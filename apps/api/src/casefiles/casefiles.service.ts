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
  SECURITY_LEVEL_RANK,
  SecurityLevel,
  ShareStatus,
  ShareTargetType,
  type CreateCaseFile,
} from "@aktensystem/shared";
import type { ActorContext } from "@aktensystem/rbac";

@Injectable()
export class CaseFilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actor: ActorService,
    private readonly audit: AuditService,
  ) {}

  async create(userId: string, dto: CreateCaseFile) {
    const ctx = await this.actor.buildContext(userId);
    if (dto.ownerFactionId !== ctx.factionId && !ctx.isPlatformAdmin) {
      throw new ForbiddenException("Akte nur in eigener Fraktion anlegbar");
    }
    const created = await this.prisma.caseFile.create({
      data: {
        type: dto.type,
        title: dto.title,
        summary: dto.summary,
        ownerFactionId: dto.ownerFactionId,
        creatorId: userId,
        securityLevel: dto.securityLevel,
        securityLevelRank: SECURITY_LEVEL_RANK[dto.securityLevel as SecurityLevel],
        status: dto.status,
        subjectCitizenId: dto.subjectCitizenId,
        linksFrom: {
          create: dto.linkedCaseFileIds.map((targetId) => ({ targetId })),
        },
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.CREATE,
      subjectType: "CaseFile",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  /** Listet Akten, die der Actor sehen darf (eigene Fraktion + Freigaben). */
  async list(userId: string) {
    const ctx = await this.actor.buildContext(userId);
    if (ctx.isPlatformAdmin) {
      return this.prisma.caseFile.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
    }
    const maxRank = SECURITY_LEVEL_RANK[ctx.clearance];
    const sharedIds = await this.sharedCaseFileIds(ctx);
    return this.prisma.caseFile.findMany({
      where: {
        OR: [
          { ownerFactionId: ctx.factionId ?? undefined, securityLevelRank: { lte: maxRank } },
          { id: { in: sharedIds } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async get(userId: string, id: string) {
    const ctx = await this.actor.buildContext(userId);
    const file = await this.prisma.caseFile.findUnique({
      where: { id },
      include: { shares: true, documents: true, signatures: true },
    });
    if (!file) throw new NotFoundException("Akte nicht gefunden");
    if (!(await this.canRead(ctx, file))) {
      throw new ForbiddenException("Kein Zugriff auf diese Akte");
    }
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.READ,
      subjectType: "CaseFile",
      subjectId: id,
    });
    return file;
  }

  async update(userId: string, id: string, patch: Partial<CreateCaseFile>) {
    const ctx = await this.actor.buildContext(userId);
    const before = await this.prisma.caseFile.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Akte nicht gefunden");
    if (before.ownerFactionId !== ctx.factionId && !ctx.isPlatformAdmin) {
      throw new ForbiddenException("Nur eigene Fraktionsakten änderbar");
    }
    const after = await this.prisma.caseFile.update({
      where: { id },
      data: {
        title: patch.title,
        summary: patch.summary,
        status: patch.status,
        securityLevel: patch.securityLevel,
        securityLevelRank: patch.securityLevel
          ? SECURITY_LEVEL_RANK[patch.securityLevel as SecurityLevel]
          : undefined,
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.UPDATE,
      subjectType: "CaseFile",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  // ---- Zugriffslogik ----

  private async canRead(
    ctx: ActorContext,
    file: { ownerFactionId: string; securityLevelRank: number; id: string },
  ): Promise<boolean> {
    if (ctx.isPlatformAdmin) return true;
    const withinClearance =
      file.securityLevelRank <= SECURITY_LEVEL_RANK[ctx.clearance];
    if (file.ownerFactionId === ctx.factionId && withinClearance) return true;
    const shared = await this.sharedCaseFileIds(ctx);
    return shared.includes(file.id);
  }

  /** IDs der Akten, die dem Actor via genehmigter FileShare freigegeben sind. */
  private async sharedCaseFileIds(ctx: ActorContext): Promise<string[]> {
    const targets: Array<{ targetType: ShareTargetType; targetId: string }> = [
      { targetType: ShareTargetType.PERSON, targetId: ctx.userId },
    ];
    if (ctx.factionId) {
      targets.push({ targetType: ShareTargetType.FRAKTION, targetId: ctx.factionId });
      targets.push({ targetType: ShareTargetType.BEHOERDE, targetId: ctx.factionId });
    }
    for (const d of ctx.departmentIds) {
      targets.push({ targetType: ShareTargetType.ABTEILUNG, targetId: d });
    }
    const shares = await this.prisma.fileShare.findMany({
      where: {
        OR: targets,
        status: {
          in: [ShareStatus.TEILFREIGEGEBEN, ShareStatus.VOLLSTAENDIG_FREIGEGEBEN],
        },
      },
      select: { caseFileId: true },
    });
    return shares.map((s) => s.caseFileId);
  }
}
