import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { ActorContext } from "@aktensystem/rbac";
import {
  SECURITY_LEVEL_RANK,
  SecurityLevel,
  ShareStatus,
  ShareTargetType,
} from "@aktensystem/shared";

/**
 * Zentrale Lese-Zugriffsprüfung für Akten (Fraktion + Sicherheitsstufe + Freigaben).
 * Genutzt von CaseFiles, Documents und der globalen Suche, damit die Regel an
 * einer Stelle lebt (kein Drift).
 */
@Injectable()
export class CaseFileAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async canRead(
    ctx: ActorContext,
    file: { ownerFactionId: string; securityLevelRank: number; id: string },
  ): Promise<boolean> {
    if (ctx.isPlatformAdmin) return true;
    const withinClearance = file.securityLevelRank <= SECURITY_LEVEL_RANK[ctx.clearance as SecurityLevel];
    if (file.ownerFactionId === ctx.factionId && withinClearance) return true;
    const shared = await this.sharedCaseFileIds(ctx);
    return shared.includes(file.id);
  }

  /** Prisma-where-Klausel für alle vom Actor lesbaren Akten. */
  async readableWhere(ctx: ActorContext) {
    if (ctx.isPlatformAdmin) return {};
    const sharedIds = await this.sharedCaseFileIds(ctx);
    const or: Array<Record<string, unknown>> = [{ id: { in: sharedIds } }];
    // Fraktions-Zweig nur wenn factionId gesetzt — sonst würde `?? undefined`
    // den ownerFactionId-Filter fallen lassen und ALLE Fraktionen matchen.
    if (ctx.factionId) {
      or.unshift({
        ownerFactionId: ctx.factionId,
        securityLevelRank: { lte: SECURITY_LEVEL_RANK[ctx.clearance as SecurityLevel] },
      });
    }
    return { OR: or };
  }

  async sharedCaseFileIds(ctx: ActorContext): Promise<string[]> {
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
        status: { in: [ShareStatus.TEILFREIGEGEBEN, ShareStatus.VOLLSTAENDIG_FREIGEGEBEN] },
      },
      select: { caseFileId: true },
    });
    return shares.map((s) => s.caseFileId);
  }
}
