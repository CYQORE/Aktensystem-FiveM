import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

/** Aggregierte Kennzahlen fürs Dashboard in einem Request. */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const [
      openCalls,
      activeUnits,
      activeWarrants,
      activeBolos,
      unpaidFines,
      activeInmates,
      citizens,
      caseFiles,
    ] = await Promise.all([
      this.prisma.dispatchCall.count({ where: { status: { not: "ABGESCHLOSSEN" } } }),
      this.prisma.unit.count({ where: { status: { not: "AUSSER_DIENST" } } }),
      this.prisma.warrant.count({ where: { status: "ACTIVE" } }),
      this.prisma.bolo.count({ where: { active: true } }),
      this.prisma.fine.count({ where: { status: "UNPAID" } }),
      this.prisma.inmate.count({ where: { status: { in: ["BOOKED", "INCARCERATED"] } } }),
      this.prisma.citizen.count(),
      this.prisma.caseFile.count(),
    ]);
    return {
      openCalls,
      activeUnits,
      activeWarrants,
      activeBolos,
      unpaidFines,
      activeInmates,
      citizens,
      caseFiles,
    };
  }
}
