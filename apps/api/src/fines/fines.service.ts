import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { FivemCommandsService } from "../commands/commands.service.js";
import {
  AuditAction,
  FivemCommandType,
  type CreateFine,
} from "@aktensystem/shared";

/**
 * Bußgelder. Ausstellen erfasst die Forderung (UNPAID) und stellt — falls der
 * Bürger einem In-Game-Spieler zugeordnet ist (fivemCharId) — einen FINE-Befehl
 * in die Bridge-Queue. Das Geld wird ausschließlich in-game über Lua eingezogen;
 * erst die Lua-Quittung setzt den Status auf PAID.
 */
@Injectable()
export class FinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly commands: FivemCommandsService,
  ) {}

  list(status?: string, citizenId?: string) {
    return this.prisma.fine.findMany({
      where: {
        status: status && status !== "ALL" ? (status as never) : undefined,
        citizenId: citizenId || undefined,
      },
      include: {
        penalCode: { select: { code: true, title: true } },
        citizen: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: 200,
    });
  }

  async issue(userId: string, dto: CreateFine) {
    const citizen = await this.prisma.citizen.findUnique({ where: { id: dto.citizenId } });
    if (!citizen) throw new NotFoundException("Bürger nicht gefunden");

    // Doppel-Submit/Retry-Schutz: identisches offenes Bußgeld in den letzten 15s ablehnen,
    // damit ein versehentlicher Doppelklick nicht zweimal Geld in-game einzieht.
    const dup = await this.prisma.fine.findFirst({
      where: {
        citizenId: dto.citizenId,
        penalCodeId: dto.penalCodeId ?? null,
        amount: dto.amount,
        status: "UNPAID",
        issuedAt: { gt: new Date(Date.now() - 15_000) },
      },
    });
    if (dup) throw new ConflictException("Identisches offenes Bußgeld wurde gerade ausgestellt");

    const fine = await this.prisma.fine.create({
      data: {
        citizenId: dto.citizenId,
        penalCodeId: dto.penalCodeId,
        amount: dto.amount,
        officerId: userId,
      },
    });

    // In-Game-Einzug nur wenn gewünscht UND ein FiveM-Identifier hinterlegt ist.
    let queued = false;
    if (dto.collectInGame && citizen.fivemCharId) {
      await this.commands.enqueue({
        type: FivemCommandType.FINE,
        targetIdentifier: citizen.fivemCharId,
        citizenId: citizen.id,
        fineId: fine.id,
        amount: dto.amount,
        reason: dto.reason,
      });
      queued = true;
    }

    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Fine",
      subjectId: fine.id,
      after: { amount: fine.amount, citizenId: fine.citizenId, queued },
    });
    return { ...fine, queued };
  }

  /** Manuell als bezahlt markieren (z. B. Barzahlung am Schalter). */
  async pay(userId: string, id: string) {
    return this.resolve(userId, id, "PAID", "fine paid manually");
  }

  /** Bußgeld erlassen (WAIVED). */
  async waive(userId: string, id: string) {
    return this.resolve(userId, id, "WAIVED", "fine waived");
  }

  /**
   * Bußgeld terminal abschließen. Nur aus UNPAID heraus (idempotent, kein paidAt-Drift),
   * und storniert einen evtl. noch offenen In-Game-Einzug, damit der Spieler nicht
   * zusätzlich in-game belastet wird.
   */
  private async resolve(
    userId: string,
    id: string,
    status: "PAID" | "WAIVED",
    cancelReason: string,
  ) {
    const before = await this.prisma.fine.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Bußgeld nicht gefunden");

    const res = await this.prisma.fine.updateMany({
      where: { id, status: "UNPAID" },
      data: status === "PAID" ? { status, paidAt: new Date() } : { status },
    });
    if (res.count === 0) throw new ConflictException("Bußgeld ist nicht mehr offen");

    // offenen In-Game-Einzug abbrechen
    await this.commands.cancelOpen({ fineId: id, type: FivemCommandType.FINE }, cancelReason);

    const after = await this.prisma.fine.findUnique({ where: { id } });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Fine",
      subjectId: id,
      before,
      after,
    });
    return after;
  }
}
