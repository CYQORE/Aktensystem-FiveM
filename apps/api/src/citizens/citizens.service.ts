import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ActorService } from "../rbac/actor.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  CaseFileType,
  type CreateCitizen,
  type CreateCitizenRecord,
} from "@aktensystem/shared";

/** Gefährdungsstufe aus aktiven Haftbefehlen + offenen Anklagen ableiten. */
type Threat = "KEINE" | "BEOBACHTEN" | "GESUCHT" | "GEFAEHRLICH";

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
            // MySQL-Collation (utf8mb4_..._ci) ist bereits case-insensitive
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
    });
  }

  /** Aggregiertes Bürgerprofil (wie nn_mdt: Fahrzeuge, Akten, Anklagen, Bußgelder, Lizenzen, Haftbefehle, Gefährdung). */
  async get(id: string) {
    const citizen = await this.prisma.citizen.findUnique({
      where: { id },
      include: {
        vehicles: true,
        properties: true,
        caseFiles: { select: { id: true, type: true, title: true, status: true, securityLevel: true, createdAt: true } },
        licenses: true,
        warrants: { orderBy: { issuedAt: "desc" } },
        charges: { include: { penalCode: true }, orderBy: { createdAt: "desc" } },
        fines: { include: { penalCode: true }, orderBy: { issuedAt: "desc" } },
        tags: { include: { tag: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!citizen) throw new NotFoundException("Bürger nicht gefunden");

    const bolos = await this.prisma.bolo.findMany({
      where: { citizenId: id, active: true },
      orderBy: { createdAt: "desc" },
    });

    return { ...citizen, bolos, threatLevel: this.threat(citizen) };
  }

  private threat(c: { warrants: { status: string }[]; charges: { penalCode: { class: string } | null }[] }): Threat {
    const activeWarrants = c.warrants.filter((w) => w.status === "ACTIVE").length;
    const hasFelony = c.charges.some((ch) => ch.penalCode?.class === "FELONY");
    if (activeWarrants > 0 && hasFelony) return "GEFAEHRLICH";
    if (activeWarrants > 0) return "GESUCHT";
    if (c.charges.length > 0) return "BEOBACHTEN";
    return "KEINE";
  }

  /** Strafakte anlegen: CaseFile (STRAFAKTE) + Anklagen für den Bürger. */
  async createRecord(userId: string, citizenId: string, dto: CreateCitizenRecord) {
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.factionId) throw new ForbiddenException("Keine Fraktion zugeordnet");
    const citizen = await this.prisma.citizen.findUnique({ where: { id: citizenId } });
    if (!citizen) throw new NotFoundException("Bürger nicht gefunden");

    const caseFile = await this.prisma.caseFile.create({
      data: {
        type: CaseFileType.STRAFAKTE,
        title: dto.title,
        summary: dto.summary,
        ownerFactionId: ctx.factionId,
        creatorId: userId,
        subjectCitizenId: citizenId,
        charges: {
          create: (dto.charges ?? []).map((c) => ({
            citizenId,
            penalCodeId: c.penalCodeId,
            count: c.count ?? 1,
            notes: c.notes,
            byUserId: userId,
          })),
        },
      },
      include: { charges: true },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.CREATE,
      subjectType: "CaseFile",
      subjectId: caseFile.id,
      after: { title: caseFile.title, charges: caseFile.charges.length },
    });
    return caseFile;
  }

  /** Foto-URL setzen (Capture via FiveM-Bridge folgt Phase 7). */
  async setPhoto(userId: string, id: string, photo: string) {
    const updated = await this.prisma.citizen.update({ where: { id }, data: { photo } });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Citizen",
      subjectId: id,
      after: { photo },
    });
    return updated;
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
