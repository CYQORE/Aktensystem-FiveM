import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";

/** Audit-Trail: nur lesbar. Schreiben/Löschen ist systemweit unterbunden. */
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("audit")
export class AuditController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "AuditLog" })
  async list(
    @Query("subjectType") subjectType?: string,
    @Query("subjectId") subjectId?: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: { subjectType, subjectId },
      orderBy: { at: "desc" },
      take: 200,
    });
  }

  @Get("verify")
  @CheckPolicies({ action: "read", subject: "AuditLog" })
  verify() {
    return this.audit.verifyChain();
  }
}
