import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreateWarrant } from "@aktensystem/shared";

/** Haftbefehle: anlegen, Liste/Filter, vollstrecken (EXECUTED), widerrufen (RECALLED). */
@Injectable()
export class WarrantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(status = "ACTIVE", q?: string) {
    return this.prisma.warrant.findMany({
      where: {
        status: status === "ALL" ? undefined : (status as never),
        citizen: q
          ? { OR: [{ firstName: { contains: q } }, { lastName: { contains: q } }] }
          : undefined,
      },
      include: { citizen: { select: { id: true, firstName: true, lastName: true, photo: true } } },
      orderBy: { issuedAt: "desc" },
      take: 200,
    });
  }

  async get(id: string) {
    const w = await this.prisma.warrant.findUnique({
      where: { id },
      include: { citizen: true, caseFile: { select: { id: true, title: true } } },
    });
    if (!w) throw new NotFoundException("Haftbefehl nicht gefunden");
    return w;
  }

  async create(userId: string, dto: CreateWarrant) {
    const created = await this.prisma.warrant.create({
      data: {
        citizenId: dto.citizenId,
        title: dto.title,
        reason: dto.reason,
        priority: dto.priority,
        type: dto.type,
        caseFileId: dto.caseFileId,
        issuedById: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Warrant",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  /** EXECUTED = vollstreckt; RECALLED = widerrufen. */
  async setStatus(userId: string, id: string, status: "EXECUTED" | "RECALLED") {
    const before = await this.prisma.warrant.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Haftbefehl nicht gefunden");
    const after = await this.prisma.warrant.update({ where: { id }, data: { status } });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Warrant",
      subjectId: id,
      before,
      after,
    });
    return after;
  }
}
