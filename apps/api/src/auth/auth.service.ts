import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService, type JwtSignOptions } from "@nestjs/jwt";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { config } from "../common/config.js";

interface DiscordProfile {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
  email?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Discord-OAuth-Autorisierungs-URL (Schritt 1). */
  getDiscordAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: config.discord.callbackUrl,
      response_type: "code",
      scope: "identify email",
      state,
    });
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }

  /** Callback (Schritt 2): Code -> Token -> Profil -> User-Upsert -> Tokens. */
  async handleDiscordCallback(
    code: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.discord.clientId,
        client_secret: config.discord.clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: config.discord.callbackUrl,
      }),
    });
    if (!tokenRes.ok) throw new UnauthorizedException("Discord-Token-Tausch fehlgeschlagen");
    const tokenJson = (await tokenRes.json()) as { access_token: string };

    const profRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    if (!profRes.ok) throw new UnauthorizedException("Discord-Profil nicht abrufbar");
    const profile = (await profRes.json()) as DiscordProfile;

    const user = await this.prisma.user.upsert({
      where: { discordId: profile.id },
      update: {
        username: profile.username,
        globalName: profile.global_name,
        avatar: profile.avatar,
        email: profile.email,
        lastLoginAt: new Date(),
      },
      create: {
        discordId: profile.id,
        username: profile.username,
        globalName: profile.global_name,
        avatar: profile.avatar,
        email: profile.email,
        lastLoginAt: new Date(),
      },
    });

    return this.issueTokens(user.id, meta);
  }

  /** Access-JWT + rotierendes Refresh-Token (gehasht persistiert). */
  async issueTokens(
    userId: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId },
      {
        secret: config.jwt.accessSecret,
        expiresIn: config.jwt.accessTtl as JwtSignOptions["expiresIn"],
      },
    );

    const raw = randomBytes(48).toString("hex");
    const expiresAt = new Date(
      Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(raw),
        expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return { accessToken, refreshToken: raw };
  }

  /** Refresh: validiert + rotiert. Reuse/Revoke -> 401. */
  async rotateRefresh(
    raw: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(raw) },
    });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh-Token ungültig");
    }
    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(existing.userId, meta);
  }

  async revoke(raw: string): Promise<void> {
    await this.prisma.refreshToken
      .update({
        where: { tokenHash: this.hash(raw) },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { where: { isActive: true }, include: { faction: true, rank: true } } },
    });
  }

  private hash(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
