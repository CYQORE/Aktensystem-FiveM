import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { Prisma } from "@aktensystem/database";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  type IssueLicense,
  type SetLicenseStatus,
  type CreateGovLaw,
  type CreateCustomsDeclaration,
  type SetCustomsStatus,
} from "@aktensystem/shared";

/** Behörden-Verwaltung: DMV-Lizenzen, Gesetze, Zoll-Deklarationen. */
@Injectable()
export class GovernmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- DMV / Lizenzen ----
  listLicenses(citizenId?: string) {
    return this.prisma.license.findMany({
      where: { citizenId: citizenId || undefined },
      include: { citizen: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { issuedAt: "desc" },
      take: 200,
    });
  }

  async issueLicense(userId: string, dto: IssueLicense) {
    const make = () => `${dto.type.slice(0, 3)}-${randomBytes(4).toString("hex").toUpperCase()}`;
    let created;
    try {
      created = await this.prisma.license.create({
        data: {
          type: dto.type as never,
          number: make(),
          citizenId: dto.citizenId,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2002") {
          // extrem seltene Nummern-Kollision -> einmal mit neuer Nummer wiederholen
          created = await this.prisma.license.create({
            data: { type: dto.type as never, number: make(), citizenId: dto.citizenId, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined },
          });
        } else if (e.code === "P2003") {
          throw new NotFoundException("Bürger nicht gefunden");
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "License",
      subjectId: created.id,
      after: { type: created.type, number: created.number, citizenId: dto.citizenId },
    });
    return created;
  }

  async setLicenseStatus(userId: string, id: string, dto: SetLicenseStatus) {
    const before = await this.prisma.license.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Lizenz nicht gefunden");
    const after = await this.prisma.license.update({ where: { id }, data: { status: dto.status as never } });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "License",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  // ---- Gesetze ----
  listLaws(q?: string) {
    return this.prisma.govLaw.findMany({
      where: q ? { OR: [{ title: { contains: q } }, { code: { contains: q } }] } : undefined,
      orderBy: [{ category: "asc" }, { code: "asc" }],
      take: 300,
    });
  }

  async createLaw(userId: string, dto: CreateGovLaw) {
    let created;
    try {
      created = await this.prisma.govLaw.create({
        data: { code: dto.code, title: dto.title, category: dto.category, body: dto.body },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Gesetzes-Kürzel existiert bereits");
      }
      throw e;
    }
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "GovLaw",
      subjectId: created.id,
      after: { code: created.code, title: created.title },
    });
    return created;
  }

  async updateLaw(userId: string, id: string, patch: Partial<CreateGovLaw>) {
    const before = await this.prisma.govLaw.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Gesetz nicht gefunden");
    const after = await this.prisma.govLaw.update({
      where: { id },
      data: { code: patch.code, title: patch.title, category: patch.category, body: patch.body },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "GovLaw",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  async removeLaw(userId: string, id: string) {
    await this.prisma.govLaw.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("Gesetz nicht gefunden");
    });
    await this.audit.record({ userId, action: AuditAction.DELETE, subjectType: "GovLaw", subjectId: id });
    return { ok: true };
  }

  // ---- Zoll ----
  listCustoms(status?: string) {
    return this.prisma.customsDeclaration.findMany({
      where: status && status !== "ALL" ? { status: status as never } : undefined,
      include: { declarant: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { at: "desc" },
      take: 200,
    });
  }

  async createCustoms(userId: string, dto: CreateCustomsDeclaration) {
    let created;
    try {
      created = await this.prisma.customsDeclaration.create({
        data: {
          declarantId: dto.declarantId,
          goods: { description: dto.goods },
          declaredValue: dto.declaredValue,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw new NotFoundException("Anmelder nicht gefunden");
      }
      throw e;
    }
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "CustomsDeclaration",
      subjectId: created.id,
      after: { declaredValue: created.declaredValue },
    });
    return created;
  }

  async setCustomsStatus(userId: string, id: string, dto: SetCustomsStatus) {
    const before = await this.prisma.customsDeclaration.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Deklaration nicht gefunden");
    const after = await this.prisma.customsDeclaration.update({
      where: { id },
      data: { status: dto.status as never, inspectorId: userId },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "CustomsDeclaration",
      subjectId: id,
      before,
      after,
    });
    return after;
  }
}
