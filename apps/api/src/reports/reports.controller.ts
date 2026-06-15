import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { PdfService } from "./pdf.service.js";
import { CaseFilesService } from "../casefiles/casefiles.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("case-files")
export class ReportsController {
  constructor(
    private readonly pdf: PdfService,
    private readonly caseFiles: CaseFilesService,
  ) {}

  /** Akten-Export als PDF (RBAC-geprüft über CaseFilesService.get). */
  @Get(":id/report.pdf")
  @CheckPolicies({ action: "read", subject: "CaseFile" })
  async report(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const file = await this.caseFiles.get(userId, id);
    const buffer = await this.pdf.caseFileReport(file);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="akte-${id}.pdf"`);
    res.send(buffer);
  }
}
