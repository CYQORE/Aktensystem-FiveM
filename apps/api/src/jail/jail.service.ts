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
  type CreateJail,
} from "@aktensystem/shared";

/**
 * Haft / Strafvollzug. Buchen legt einen Inmate (BOOKED) an und stellt — falls
 * der Bürger einem In-Game-Spieler zugeordnet ist — einen JAIL-Befehl in die
 * Bridge-Queue. Das Einsperren passiert ausschließlich in-game über Lua; erst
 * die Quittung setzt den Status auf INCARCERATED. Freilassen analog (RELEASE).
 */
@Injectable()
export class JailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly commands: FivemCommandsService,
  ) {}

  /** Aktive Insassen (gebucht oder inhaftiert). */
  async list(status = "ACTIVE") {
    const where =
      status === "ALL"
        ? {}
        : status === "ACTIVE"
          ? { status: { in: ["BOOKED", "INCARCERATED"] as never } }
          : { status: status as never };
    const rows = await this.prisma.inmate.findMany({
      where,
      include: {
        citizen: { select: { id: true, firstName: true, lastName: true, photo: true, fivemCharId: true } },
      },
      orderBy: { intakeAt: "desc" },
      take: 200,
    });
    // queued = wird/wurde in-game vollzogen (nur wenn Bürger einem Spieler zugeordnet ist)
    return rows.map(({ citizen, ...i }) => ({
      ...i,
      queued: Boolean(citizen?.fivemCharId),
      citizen: citizen
        ? { id: citizen.id, firstName: citizen.firstName, lastName: citizen.lastName, photo: citizen.photo }
        : null,
    }));
  }

  async book(userId: string, dto: CreateJail) {
    const citizen = await this.prisma.citizen.findUnique({ where: { id: dto.citizenId } });
    if (!citizen) throw new NotFoundException("Bürger nicht gefunden");

    // Doppelte aktive Haft verhindern.
    const active = await this.prisma.inmate.findFirst({
      where: { citizenId: dto.citizenId, status: { in: ["BOOKED", "INCARCERATED"] } },
    });
    if (active) throw new ConflictException("Bürger ist bereits in Haft");

    const seconds = dto.minutes * 60;
    const releaseAt = new Date(Date.now() + seconds * 1000);
    const willQueue = Boolean(citizen.fivemCharId);

    const inmate = await this.prisma.inmate.create({
      data: {
        citizenId: dto.citizenId,
        caseFileId: dto.caseFileId,
        // Ohne FiveM-Zuordnung gibt es keinen In-Game-Ack -> direkt INCARCERATED,
        // sonst BOOKED bis die Lua-Bridge die Einweisung quittiert.
        status: willQueue ? "BOOKED" : "INCARCERATED",
        cell: dto.cell,
        jailSeconds: seconds,
        reason: dto.reason,
        officerId: userId,
        releaseAt,
      },
    });

    let queued = false;
    if (willQueue && citizen.fivemCharId) {
      await this.commands.enqueue({
        type: FivemCommandType.JAIL,
        targetIdentifier: citizen.fivemCharId,
        citizenId: citizen.id,
        inmateId: inmate.id,
        jailSeconds: seconds,
        reason: dto.reason,
      });
      queued = true;
    }

    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Inmate",
      subjectId: inmate.id,
      after: { citizenId: inmate.citizenId, minutes: dto.minutes, reason: dto.reason, queued },
    });
    return { ...inmate, queued };
  }

  /**
   * Insassen freilassen. Eine evtl. noch offene JAIL-Einweisung wird storniert
   * (kann sonst nach Freilassung erneut einsperren). Bei zugeordnetem Spieler ist
   * der In-Game-Ack autoritativ für den RELEASED-Status (analog book/INCARCERATED);
   * ohne Zuordnung wird direkt freigegeben.
   */
  async release(userId: string, id: string) {
    const inmate = await this.prisma.inmate.findUnique({ where: { id } });
    if (!inmate) throw new NotFoundException("Insasse nicht gefunden");
    if (inmate.status !== "BOOKED" && inmate.status !== "INCARCERATED") {
      throw new ConflictException("Insasse ist nicht aktiv inhaftiert");
    }

    // noch offene Einweisung stornieren, damit sie nicht erneut einsperrt
    await this.commands.cancelOpen(
      { inmateId: id, type: FivemCommandType.JAIL },
      "superseded by RELEASE",
    );

    const citizen = await this.prisma.citizen.findUnique({ where: { id: inmate.citizenId } });

    let updated = inmate;
    if (citizen?.fivemCharId) {
      // In-Game freilassen; RELEASED-Status setzt der Ack (commands.ack).
      await this.commands.enqueue({
        type: FivemCommandType.RELEASE,
        targetIdentifier: citizen.fivemCharId,
        citizenId: inmate.citizenId,
        inmateId: inmate.id,
      });
    } else {
      // kein In-Game-Bezug -> direkt freigeben
      updated = await this.prisma.inmate.update({
        where: { id },
        data: { status: "RELEASED", servedAt: new Date() },
      });
    }

    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Inmate",
      subjectId: id,
      before: inmate,
      after: { ...updated, releaseRequested: true },
    });
    return updated;
  }
}
