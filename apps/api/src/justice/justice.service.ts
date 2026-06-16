import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  type AddHearing,
  type AddSentence,
  type AddVerdict,
  type CreateCourtCase,
} from "@aktensystem/shared";

/** Gerichtssystem: Verfahren, Verhandlungen, Urteile, Strafmaß. */
@Injectable()
export class JusticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listCases() {
    return this.prisma.courtCase.findMany({
      include: {
        defendant: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { hearings: true } },
      },
      orderBy: { filedAt: "desc" },
      take: 100,
    });
  }

  async getCase(id: string) {
    const c = await this.prisma.courtCase.findUnique({
      where: { id },
      include: {
        defendant: true,
        hearings: { orderBy: { scheduledAt: "asc" } },
        verdicts: { orderBy: { decidedAt: "desc" } },
        sentences: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!c) throw new NotFoundException("Verfahren nicht gefunden");
    return c;
  }

  async createCase(userId: string, dto: CreateCourtCase) {
    const created = await this.prisma.courtCase.create({
      data: {
        title: dto.title,
        type: dto.type,
        caseFileId: dto.caseFileId,
        defendantId: dto.defendantId,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "CourtCase",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  addHearing(userId: string, courtCaseId: string, dto: AddHearing) {
    return this.prisma.courtHearing.create({
      data: {
        courtCaseId,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        room: dto.room,
        notes: dto.notes,
      },
    });
  }

  async addVerdict(userId: string, courtCaseId: string, dto: AddVerdict) {
    const verdict = await this.prisma.verdict.create({
      data: { courtCaseId, type: dto.type, summary: dto.summary, judgeId: userId },
    });
    await this.prisma.courtCase.update({
      where: { id: courtCaseId },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "CourtCase",
      subjectId: courtCaseId,
      after: { verdict: verdict.type },
    });
    return verdict;
  }

  addSentence(userId: string, courtCaseId: string, dto: AddSentence) {
    return this.prisma.sentence.create({
      data: {
        courtCaseId,
        type: dto.type,
        jailDays: dto.jailDays,
        fineAmount: dto.fineAmount,
        probationDays: dto.probationDays,
        communityHours: dto.communityHours,
      },
    });
  }
}
