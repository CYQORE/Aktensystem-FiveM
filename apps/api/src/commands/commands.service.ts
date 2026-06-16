import { randomUUID } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  FivemCommandStatus,
  FivemCommandType,
  type FiveMCommandAck,
} from "@aktensystem/shared";

interface EnqueueInput {
  type: FivemCommandType;
  targetIdentifier: string;
  citizenId?: string;
  fineId?: string;
  inmateId?: string;
  amount?: number;
  jailSeconds?: number;
  reason?: string;
}

/**
 * Outbound-Befehlswarteschlange zur FiveM-Lua-Bridge.
 * Web schreibt PENDING-Befehle (Geld einziehen / einsperren / freilassen).
 * Die Lua-Resource pollt pending Befehle für aktuell online Spieler,
 * führt sie in-game aus und quittiert (ack). Erst die Quittung löst die
 * fachliche Statusänderung aus (Fine=PAID, Inmate=INCARCERATED/RELEASED).
 *
 * Geld und Haft passieren damit ausschließlich in-game über Lua.
 */
@Injectable()
export class FivemCommandsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Offene (PENDING/DELIVERED) Befehle eines Typs für eine Fine/Inmate stornieren.
   * Genutzt wenn ein Bußgeld manuell bezahlt/erlassen oder ein Insasse freigelassen
   * wird, damit die Lua-Bridge die zugehörige Aktion nicht (nochmal) ausführt.
   */
  cancelOpen(
    target: { fineId?: string; inmateId?: string; type: FivemCommandType },
    error: string,
  ) {
    return this.prisma.fivemCommand.updateMany({
      where: {
        fineId: target.fineId,
        inmateId: target.inmateId,
        type: target.type,
        status: { in: [FivemCommandStatus.PENDING, FivemCommandStatus.DELIVERED] },
      },
      data: { status: FivemCommandStatus.FAILED, error, completedAt: new Date() },
    });
  }

  /** Befehl in die Queue legen (kein Dedup hier; Aufrufer prüft fachliche Duplikate). */
  enqueue(input: EnqueueInput) {
    return this.prisma.fivemCommand.create({
      data: {
        type: input.type,
        targetIdentifier: input.targetIdentifier,
        citizenId: input.citizenId,
        fineId: input.fineId,
        inmateId: input.inmateId,
        amount: input.amount,
        jailSeconds: input.jailSeconds,
        reason: input.reason,
      },
    });
  }

  /**
   * Liefert pending Befehle für die übergebenen (online) Identifier.
   * Race-safe: ein eindeutiges claimId-Token wird per updateMany atomar nur auf
   * noch-PENDING-Rows gesetzt; danach werden ausschließlich die mit DIESEM Token
   * markierten Rows zurückgegeben. Überlappende Polls können dieselbe Row daher
   * niemals doppelt ausliefern (verhindert doppelten Geldeinzug/Jail).
   */
  async fetchPending(identifiers: string[]) {
    const uniq = [...new Set(identifiers.filter((i) => i && i.length > 0))];
    if (uniq.length === 0) return [];

    const claimId = randomUUID();
    const claimed = await this.prisma.fivemCommand.updateMany({
      where: { targetIdentifier: { in: uniq }, status: FivemCommandStatus.PENDING },
      data: { status: FivemCommandStatus.DELIVERED, deliveredAt: new Date(), claimId },
    });
    if (claimed.count === 0) return [];

    const rows = await this.prisma.fivemCommand.findMany({
      where: { claimId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return rows.map((c) => ({
      id: c.id,
      type: c.type,
      targetIdentifier: c.targetIdentifier,
      amount: c.amount,
      jailSeconds: c.jailSeconds,
      reason: c.reason,
      claimId: c.claimId, // Lua echot dies im Ack zurück (Stale-Ack-Schutz)
    }));
  }

  /**
   * Quittung der Lua-Resource. Atomar + exactly-once:
   *  - Statuswechsel nur, wenn die Row noch DELIVERED ist UND (falls mitgesendet)
   *    das claimId-Token passt. Ein verspäteter Ack (Befehl wurde zwischenzeitlich
   *    von reclaimStale auf PENDING zurückgestellt oder neu ausgeliefert) trifft 0
   *    Rows und wird verworfen — verhindert Doppel-Anwendung + State-Korruption.
   *  - Statuswechsel und fachliche Wirkung laufen in EINER Transaktion (kein Crash-Fenster).
   *  - Fachliche Wirkung selbst ist status-guarded (idempotent gegen Replays).
   */
  async ack(dto: FiveMCommandAck) {
    const cmd = await this.prisma.fivemCommand.findUnique({ where: { id: dto.commandId } });
    if (!cmd) throw new NotFoundException("Befehl nicht gefunden");

    const now = new Date();
    const applied = await this.prisma.$transaction(async (tx) => {
      // Atomar nur eine noch-DELIVERED-Row (mit passendem Token) abschließen.
      const claimed = await tx.fivemCommand.updateMany({
        where: {
          id: dto.commandId,
          status: FivemCommandStatus.DELIVERED,
          ...(dto.claimId ? { claimId: dto.claimId } : {}),
        },
        data: {
          status: dto.success ? FivemCommandStatus.DONE : FivemCommandStatus.FAILED,
          error: dto.success ? null : (dto.error ?? "unbekannter Fehler"),
          completedAt: now,
        },
      });
      if (claimed.count === 0) return false; // stale/doppelt -> ignorieren

      if (dto.success) {
        if (cmd.type === FivemCommandType.FINE && cmd.fineId) {
          await tx.fine.updateMany({
            where: { id: cmd.fineId, status: "UNPAID" },
            data: { status: "PAID", paidAt: now },
          });
        } else if (cmd.type === FivemCommandType.JAIL && cmd.inmateId) {
          // nur BOOKED -> INCARCERATED (ein JAIL-Ack nach RELEASE trifft 0 Rows)
          await tx.inmate.updateMany({
            where: { id: cmd.inmateId, status: "BOOKED" },
            data: { status: "INCARCERATED" },
          });
        } else if (cmd.type === FivemCommandType.RELEASE && cmd.inmateId) {
          await tx.inmate.updateMany({
            where: { id: cmd.inmateId, status: { in: ["BOOKED", "INCARCERATED"] } },
            data: { status: "RELEASED", servedAt: now },
          });
        }
      }
      return true;
    });

    return { ok: applied, commandId: dto.commandId };
  }

  /**
   * Hängengebliebene Befehle zurückstellen: wurde ein DELIVERED-Befehl binnen
   * 120s nicht quittiert (Spieler disconnected o. Ä.), wieder auf PENDING setzen,
   * damit er beim nächsten Connect erneut ausgeliefert wird. Das Fenster (120s)
   * liegt deutlich über der normalen Ausführungs-+Ack-Latenz, damit ein langsam,
   * aber erfolgreich ausgeführter Befehl nicht doppelt in-game läuft.
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async reclaimStale() {
    const cutoff = new Date(Date.now() - 120_000);
    await this.prisma.fivemCommand.updateMany({
      where: { status: FivemCommandStatus.DELIVERED, deliveredAt: { lt: cutoff } },
      data: { status: FivemCommandStatus.PENDING, claimId: null },
    });
  }
}
