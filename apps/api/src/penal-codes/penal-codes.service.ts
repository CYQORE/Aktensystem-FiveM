import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreatePenalCode } from "@aktensystem/shared";

/**
 * Strafkatalog (Penal Code) — Nachschlagewerk + Pflege.
 * Orientiert an nn_mdt: editierbare Delikte mit Kategorie, Bußgeld, Haftzeit,
 * Führerschein-Punkten. Soft-Delete, damit bestehende Charge/Fine-FKs halten.
 */
@Injectable()
export class PenalCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(q?: string, category?: string) {
    return this.prisma.penalCode.findMany({
      where: {
        deletedAt: null,
        category: category && category !== "Alle" ? category : undefined,
        OR: q
          ? [{ title: { contains: q } }, { description: { contains: q } }]
          : undefined,
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    });
  }

  /** Kategorien + Anzahl (für die Sidebar). */
  async categories() {
    const rows = await this.prisma.penalCode.groupBy({
      by: ["category"],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return rows
      .map((r) => ({ category: r.category, count: r._count._all }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }

  async create(userId: string, dto: CreatePenalCode) {
    const created = await this.prisma.penalCode.create({
      data: { ...dto, code: `PC-${randomBytes(4).toString("hex")}` },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "PenalCode",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async update(userId: string, id: string, dto: Partial<CreatePenalCode>) {
    const before = await this.prisma.penalCode.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw new NotFoundException("Delikt nicht gefunden");
    const after = await this.prisma.penalCode.update({ where: { id }, data: dto });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "PenalCode",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  /** Soft-Delete (bricht keine bestehenden Charge/Fine-Verknüpfungen). */
  async remove(userId: string, id: string) {
    const before = await this.prisma.penalCode.findUnique({ where: { id } });
    if (!before || before.deletedAt) throw new NotFoundException("Delikt nicht gefunden");
    await this.prisma.penalCode.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      userId,
      action: AuditAction.DELETE,
      subjectType: "PenalCode",
      subjectId: id,
      before,
    });
    return { ok: true };
  }
}
