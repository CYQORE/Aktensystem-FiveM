import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@aktensystem/database";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuthService, type IssuedTokens } from "./auth.service.js";
import { config } from "../common/config.js";
import type { FiveMIssue } from "@aktensystem/shared";

const TICKET_TTL_MS = 90_000; // 90 Sekunden — kurzes Fenster für Auto-Redirect

@Injectable()
export class FivemAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Stellt einen One-Time-Login-Code für die FiveM-Identität aus.
   * Wird vom Lua-SERVER aufgerufen (bridge-authed) — die Identifier sind also
   * vertrauenswürdig (kommen vom FiveM-Server, nicht vom Client).
   * In der DB wird nur der HASH des Codes gespeichert (DB-Leak-Resistenz).
   */
  async issueTicket(input: FiveMIssue): Promise<{ code: string; loginUrl: string }> {
    const user = await this.resolveUser(input);
    const code = randomBytes(24).toString("hex"); // 48 hex chars, 192 bit
    await this.prisma.authTicket.create({
      data: {
        code: this.hash(code),
        userId: user.id,
        source: input.source,
        expiresAt: new Date(Date.now() + TICKET_TTL_MS),
      },
    });
    const loginUrl = `${config.webOrigin}/auth/fivem#code=${code}`;
    return { code, loginUrl };
  }

  /**
   * Tauscht den Code gegen JWT + Refresh. Single-use ATOMAR durchgesetzt:
   * updateMany mit `usedAt: null`-Guard ändert unter Read-Committed genau eine
   * Zeile — parallele Einlösung desselben Codes bekommt count 0.
   */
  async exchange(
    code: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const codeHash = this.hash(code);
    const claimed = await this.prisma.authTicket.updateMany({
      where: { code: codeHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new UnauthorizedException("Login-Code ungültig oder abgelaufen");
    }
    const ticket = await this.prisma.authTicket.findUnique({
      where: { code: codeHash },
    });
    return this.auth.issueTokens(ticket!.userId, meta);
  }

  /**
   * Bootstrap-Admin-Claim (in-game, z.B. /s6mdtadmin). Der ERSTE Spieler, der
   * den Claim auslöst, wird Plattform-Admin — danach gesperrt. Race-sicher:
   * der unique `key` der PlatformBootstrap-Zeile lässt nur genau einen Claim zu.
   */
  async claimAdmin(
    input: FiveMIssue,
  ): Promise<{ claimed: boolean; reason?: string }> {
    const user = await this.resolveUser(input);
    try {
      await this.prisma.platformBootstrap.create({
        data: { key: "ADMIN", userId: user.id },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return { claimed: false, reason: "already_claimed" };
      }
      throw e;
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isPlatformAdmin: true, clearance: "HOCHGEHEIM" },
    });
    return { claimed: true };
  }

  /**
   * Findet/erstellt den Plattform-User aus FiveM-Identifiern — KONFLIKTSICHER:
   *  - Gehören license und discord zu zwei VERSCHIEDENEN Accounts -> Abbruch
   *    (kein automatisches Mergen, verhindert Account-Übernahme).
   *  - discordId wird NUR bei Neuanlage aus der Bridge gesetzt, NIE nachträglich
   *    an einen bestehenden Account gehängt (Discord-Verknüpfung sonst nur über
   *    den verifizierten OAuth-Flow) -> verhindert Admin-Hijack via license.
   *  - fivemIdentifier wird nur gesetzt, wenn frei oder bereits diesem User.
   */
  private async resolveUser(input: FiveMIssue) {
    const license = input.license.startsWith("license:")
      ? input.license
      : `license:${input.license}`;
    const discordId = input.discord
      ? input.discord.replace(/^discord:/, "")
      : undefined;

    const byDiscord = discordId
      ? await this.prisma.user.findUnique({ where: { discordId } })
      : null;
    const byLicense = await this.prisma.user.findUnique({
      where: { fivemIdentifier: license },
    });

    if (byDiscord && byLicense && byDiscord.id !== byLicense.id) {
      throw new ConflictException(
        "Identitätskonflikt: license und Discord gehören zu verschiedenen Accounts",
      );
    }

    const user = byDiscord ?? byLicense;

    try {
      if (user) {
        return await this.prisma.user.update({
          where: { id: user.id },
          data: {
            // fivemIdentifier nur setzen, wenn frei/identisch (byLicense-Konflikt
            // ist oben bereits ausgeschlossen)
            fivemIdentifier: license,
            // discordId NICHT aus der Bridge überschreiben (nur OAuth)
            username: input.name ?? user.username,
            lastLoginAt: new Date(),
          },
        });
      }
      return await this.prisma.user.create({
        data: {
          fivemIdentifier: license,
          discordId, // nur bei Neuanlage (frischer, rechteloser Account)
          username: input.name ?? "FiveM-Spieler",
          lastLoginAt: new Date(),
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Identifier bereits anderweitig vergeben");
      }
      throw e;
    }
  }
}
