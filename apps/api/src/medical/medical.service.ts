import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import { AuditAction, type CreateMedicalIncident } from "@aktensystem/shared";

/** EMS/Medizin: Einsatzberichte (MedicalIncident). */
@Injectable()
export class MedicalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(citizenId?: string) {
    return this.prisma.medicalIncident.findMany({
      where: { citizenId: citizenId || undefined },
      include: { citizen: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { at: "desc" },
      take: 200,
    });
  }

  async create(userId: string, dto: CreateMedicalIncident) {
    const created = await this.prisma.medicalIncident.create({
      data: {
        citizenId: dto.citizenId,
        type: dto.type,
        location: dto.location,
        outcome: dto.outcome,
        emsUserId: userId,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "PatientRecord",
      subjectId: created.id,
      after: { type: created.type, citizenId: created.citizenId },
    });
    return created;
  }
}
