import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreateBolo } from "@aktensystem/shared";

/** BOLO / Fahndung (Be On The Lookout) — Person und/oder Fahrzeug. */
@Injectable()
export class BolosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(active?: string) {
    return this.prisma.bolo.findMany({
      where: active === "false" ? undefined : { active: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async create(userId: string, dto: CreateBolo) {
    const created = await this.prisma.bolo.create({
      data: {
        title: dto.title,
        description: dto.description,
        citizenId: dto.citizenId,
        plate: dto.plate ? dto.plate.toUpperCase() : undefined,
        byUserId: userId,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Bolo",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async resolve(userId: string, id: string) {
    const before = await this.prisma.bolo.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Fahndung nicht gefunden");
    const after = await this.prisma.bolo.update({ where: { id }, data: { active: false } });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Bolo",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  async remove(userId: string, id: string) {
    await this.prisma.bolo.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("Fahndung nicht gefunden");
    });
    await this.audit.record({
      userId,
      action: AuditAction.DELETE,
      subjectType: "Bolo",
      subjectId: id,
    });
    return { ok: true };
  }
}
