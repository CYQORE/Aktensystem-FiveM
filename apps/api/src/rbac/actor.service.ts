import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  type ActorContext,
  RankTier,
  defineAbilityFor,
  type AppAbility,
} from "@aktensystem/rbac";
import { SECURITY_LEVEL_RANK, SecurityLevel } from "@aktensystem/shared";

/**
 * Baut den ActorContext (Fraktion, Rang-Tier, Clearance, Grants) aus der DB
 * und daraus die CASL-Ability. Quelle der Rechte: aktive FactionMembership +
 * zugehöriger Rank + User-Clearance.
 */
@Injectable()
export class ActorService {
  constructor(private readonly prisma: PrismaService) {}

  async buildContext(userId: string): Promise<ActorContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { isActive: true },
          include: { rank: true },
          take: 1,
        },
      },
    });

    if (!user) {
      // anonymer/unbekannter Actor — minimale Rechte
      return {
        userId,
        factionId: null,
        departmentIds: [],
        rankTier: RankTier.OFFICER,
        clearance: SecurityLevel.INTERN,
      };
    }

    const membership = user.memberships[0];
    const rank = membership?.rank;

    // effektive Clearance = max(User-Clearance, Rang-Clearance)
    const userClr = user.clearance as SecurityLevel;
    const rankClr = (rank?.clearance as SecurityLevel) ?? SecurityLevel.INTERN;
    const clearance =
      SECURITY_LEVEL_RANK[userClr] >= SECURITY_LEVEL_RANK[rankClr]
        ? userClr
        : rankClr;

    const extraGrants = (membership?.extraGrants as ActorContext["extraGrants"]) ?? undefined;

    return {
      userId: user.id,
      factionId: membership?.factionId ?? null,
      departmentIds: membership?.departmentId ? [membership.departmentId] : [],
      rankTier: (rank?.shareTier ?? RankTier.OFFICER) as RankTier,
      clearance,
      extraGrants,
      isPlatformAdmin: user.isPlatformAdmin,
    };
  }

  async buildAbility(userId: string): Promise<AppAbility> {
    return defineAbilityFor(await this.buildContext(userId));
  }
}
