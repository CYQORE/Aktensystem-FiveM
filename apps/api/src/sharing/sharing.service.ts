import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ActorService } from "../rbac/actor.service.js";
import { AuditService } from "../audit/audit.service.js";
import { RankTier } from "@aktensystem/rbac";
import {
  AuditAction,
  SECURITY_LEVEL_RANK,
  SecurityLevel,
  ShareStatus,
  type ShareCaseFile,
} from "@aktensystem/shared";

/** Maximale Sicherheitsstufe, die ein Rang-Tier freigeben darf. */
const TIER_MAX_LEVEL: Record<RankTier, number> = {
  [RankTier.OFFICER]: 0, // keine externe Freigabe
  [RankTier.SERGEANT]: SECURITY_LEVEL_RANK[SecurityLevel.INTERN],
  [RankTier.LIEUTENANT]: SECURITY_LEVEL_RANK[SecurityLevel.BEHOERDENINTERN],
  [RankTier.CAPTAIN]: SECURITY_LEVEL_RANK[SecurityLevel.GEHEIM],
  [RankTier.CHIEF]: SECURITY_LEVEL_RANK[SecurityLevel.HOCHGEHEIM],
};

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actor: ActorService,
    private readonly audit: AuditService,
  ) {}

  /** Freigabe beantragen (Status BEANTRAGT). Rang-/Stufen-Prüfung. */
  async request(userId: string, dto: ShareCaseFile) {
    const ctx = await this.actor.buildContext(userId);
    const file = await this.prisma.caseFile.findUnique({
      where: { id: dto.caseFileId },
    });
    if (!file) throw new NotFoundException("Akte nicht gefunden");
    if (file.ownerFactionId !== ctx.factionId && !ctx.isPlatformAdmin) {
      throw new ForbiddenException("Nur eigene Fraktionsakten teilbar");
    }
    if (!ctx.isPlatformAdmin) {
      const allowed = TIER_MAX_LEVEL[ctx.rankTier];
      if (allowed === 0) throw new ForbiddenException("Rang darf nicht extern freigeben");
      if (file.securityLevelRank > allowed) {
        throw new ForbiddenException("Sicherheitsstufe übersteigt Freigabe-Reichweite des Rangs");
      }
    }
    const share = await this.prisma.fileShare.create({
      data: {
        caseFileId: dto.caseFileId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: ShareStatus.BEANTRAGT,
        reason: dto.reason,
        allowedFields: dto.allowedFields ?? [],
        requestedById: userId,
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.SHARE,
      subjectType: "FileShare",
      subjectId: share.id,
      after: share,
    });
    return share;
  }

  listForFile(caseFileId: string) {
    return this.prisma.fileShare.findMany({ where: { caseFileId } });
  }

  /** Entscheidung: genehmigen (voll/teil) oder ablehnen. Captain+ erforderlich. */
  async decide(
    userId: string,
    shareId: string,
    decision: "approve_full" | "approve_partial" | "reject",
    allowedFields?: string[],
  ) {
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && ctx.rankTier < RankTier.CAPTAIN) {
      throw new ForbiddenException("Genehmigung erst ab Captain");
    }
    const share = await this.prisma.fileShare.findUnique({ where: { id: shareId } });
    if (!share) throw new NotFoundException("Freigabe nicht gefunden");

    let status: ShareStatus;
    if (decision === "reject") status = ShareStatus.ABGELEHNT;
    else if (decision === "approve_partial") {
      if (!allowedFields?.length) throw new BadRequestException("Feld-Whitelist nötig");
      status = ShareStatus.TEILFREIGEGEBEN;
    } else status = ShareStatus.VOLLSTAENDIG_FREIGEGEBEN;

    const updated = await this.prisma.fileShare.update({
      where: { id: shareId },
      data: {
        status,
        decidedById: userId,
        decidedAt: new Date(),
        // Feld-Whitelist nur bei Teilfreigabe setzen (sonst unverändert lassen)
        ...(decision === "approve_partial" ? { allowedFields: allowedFields ?? [] } : {}),
      },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.SHARE,
      subjectType: "FileShare",
      subjectId: shareId,
      before: share,
      after: updated,
    });
    return updated;
  }

  /** Widerruf. Chief erforderlich. */
  async revoke(userId: string, shareId: string) {
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && ctx.rankTier < RankTier.CHIEF) {
      throw new ForbiddenException("Widerruf erst ab Chief");
    }
    const before = await this.prisma.fileShare.findUnique({ where: { id: shareId } });
    if (!before) throw new NotFoundException("Freigabe nicht gefunden");
    const updated = await this.prisma.fileShare.update({
      where: { id: shareId },
      data: { status: ShareStatus.WIDERRUFEN, decidedById: userId, decidedAt: new Date() },
    });
    await this.audit.record({
      userId,
      factionId: ctx.factionId,
      action: AuditAction.REVOKE,
      subjectType: "FileShare",
      subjectId: shareId,
      before,
      after: updated,
    });
    return updated;
  }
}
