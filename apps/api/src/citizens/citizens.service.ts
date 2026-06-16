import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ActorService } from "../rbac/actor.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreateCitizen } from "@aktensystem/shared";

/** Bürgerregister: anlegen, suchen, lesen, ändern (mit Audit). */
@Injectable()
export class CitizensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actor: ActorService,
    private readonly audit: AuditService,
  ) {}

  /** Liste/Suche über Vor-/Nachname/Telefon. */
  list(q?: string) {
    return this.prisma.citizen.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
    });
  }

  async get(id: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
      include: {
        vehicles: true,
        properties: true,
        caseFiles: { select: { id: true, type: true, title: true, status: true, securityLevel: true } },
        licenses: true,
        warrants: { where: { status: "ACTIVE" } },
      },
    });
    if (!citizen) throw new NotFoundException("Bürger nicht gefunden");
    return citizen;
  }

  async create(userId: string, dto: CreateCitizen) {
    const ctx = await this.actor.buildContext(userId);
    const created = await this.prisma.citizen.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        phone: dto.phone,
        address: dto.address,
        fivemCharId: dto.fivemCharId,
        photo: dto.photo,
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.CREATE,
      subjectType: "Citizen",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async update(userId: string, id: string, patch: Partial<CreateCitizen>) {
    const ctx = await this.actor.buildContext(userId);
    const before = await this.prisma.citizen.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Bürger nicht gefunden");
    const after = await this.prisma.citizen.update({
      where: { id },
      data: {
        firstName: patch.firstName,
        lastName: patch.lastName,
        dateOfBirth: patch.dateOfBirth ? new Date(patch.dateOfBirth) : undefined,
        gender: patch.gender,
        phone: patch.phone,
        address: patch.address,
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.UPDATE,
      subjectType: "Citizen",
      subjectId: id,
      before,
      after,
    });
    return after;
  }
}
