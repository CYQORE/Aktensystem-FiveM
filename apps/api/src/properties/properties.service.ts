import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreateProperty } from "@aktensystem/shared";

/** Immobilien-/Grundstücksregister (Eigentümer, Adresse). */
@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(q?: string) {
    return this.prisma.property.findMany({
      where: q ? { OR: [{ label: { contains: q } }, { address: { contains: q } }] } : undefined,
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async get(id: string) {
    const p = await this.prisma.property.findUnique({
      where: { id },
      include: { owner: true },
    });
    if (!p) throw new NotFoundException("Immobilie nicht gefunden");
    return p;
  }

  async create(userId: string, dto: CreateProperty) {
    const created = await this.prisma.property.create({
      data: { label: dto.label, address: dto.address, ownerId: dto.ownerId },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Property",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async update(userId: string, id: string, patch: Partial<CreateProperty>) {
    const before = await this.prisma.property.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Immobilie nicht gefunden");
    const after = await this.prisma.property.update({
      where: { id },
      data: { label: patch.label, address: patch.address, ownerId: patch.ownerId },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Property",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  async remove(userId: string, id: string) {
    await this.prisma.property.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("Immobilie nicht gefunden");
    });
    await this.audit.record({
      userId,
      action: AuditAction.DELETE,
      subjectType: "Property",
      subjectId: id,
    });
    return { ok: true };
  }
}
