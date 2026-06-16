import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { SetRankGrants } from "@aktensystem/shared";

/**
 * Rollen-/Rechte-Verwaltung: pro Fraktion und Rang konfigurierbare Zusatzrechte.
 * Die Grants werden auf dem Rang gespeichert und in ActorService.buildContext
 * in die CASL-Ability gemischt (additiv zu den Basisrechten).
 */
@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  listFactions() {
    return this.prisma.faction.findMany({
      select: { id: true, shortName: true, name: true },
      orderBy: { shortName: "asc" },
    });
  }

  listRanks(factionId: string) {
    return this.prisma.rank.findMany({
      where: { factionId },
      select: { id: true, name: true, level: true, grants: true },
      orderBy: { level: "asc" },
    });
  }

  setGrants(rankId: string, dto: SetRankGrants) {
    return this.prisma.rank.update({
      where: { id: rankId },
      data: { grants: dto.grants },
      select: { id: true, name: true, grants: true },
    });
  }
}
