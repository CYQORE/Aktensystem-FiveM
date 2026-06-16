import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  type AddCustody,
  type CreateEvidence,
  type ForensicDetailInput,
} from "@aktensystem/shared";

/**
 * Forensik: Beweismittel + Chain of Custody (jede Bewegung protokolliert) +
 * forensische Detaildaten (DNA/Fingerabdrücke/Ballistik/Tox/Obduktion).
 */
@Injectable()
export class ForensicsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listEvidence(caseFileId: string) {
    return this.prisma.evidenceItem.findMany({
      where: { caseFileId },
      include: { custody: { orderBy: { at: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getEvidence(id: string) {
    const e = await this.prisma.evidenceItem.findUnique({
      where: { id },
      include: { custody: { orderBy: { at: "asc" } } },
    });
    if (!e) throw new NotFoundException("Beweismittel nicht gefunden");
    return e;
  }

  async createEvidence(userId: string, dto: CreateEvidence) {
    const item = await this.prisma.evidenceItem.create({
      data: {
        caseFileId: dto.caseFileId,
        label: dto.label,
        kind: dto.kind,
        storageRef: dto.storageRef,
        // initialer Custody-Eintrag: Sicherstellung
        custody: {
          create: { action: "sichergestellt", byUserId: userId },
        },
      },
      include: { custody: true },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "EvidenceItem",
      subjectId: item.id,
      after: { label: item.label, kind: item.kind },
    });
    return item;
  }

  /** Chain-of-Custody-Bewegung anhängen (unveränderliche Historie). */
  async addCustody(userId: string, evidenceId: string, dto: AddCustody) {
    const evidence = await this.prisma.evidenceItem.findUnique({
      where: { id: evidenceId },
    });
    if (!evidence) throw new NotFoundException("Beweismittel nicht gefunden");
    const event = await this.prisma.custodyEvent.create({
      data: {
        evidenceId,
        action: dto.action,
        byUserId: userId,
        location: dto.location,
        note: dto.note,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "EvidenceItem",
      subjectId: evidenceId,
      after: { custody: event.action },
    });
    return event;
  }

  /** Forensische Detaildaten der Akte setzen/aktualisieren (1:1 zur Akte). */
  async upsertDetail(userId: string, caseFileId: string, dto: ForensicDetailInput) {
    const detail = await this.prisma.forensicDetail.upsert({
      where: { caseFileId },
      update: { ...dto },
      create: { caseFileId, ...dto },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "ForensicDetail",
      subjectId: caseFileId,
    });
    return detail;
  }

  getDetail(caseFileId: string) {
    return this.prisma.forensicDetail.findUnique({ where: { caseFileId } });
  }
}
