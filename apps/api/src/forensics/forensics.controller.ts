import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ForensicsService } from "./forensics.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  AddCustodySchema,
  CreateEvidenceSchema,
  ForensicDetailSchema,
  type AddCustody,
  type CreateEvidence,
  type ForensicDetailInput,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("forensics")
export class ForensicsController {
  constructor(private readonly service: ForensicsService) {}

  @Get("case/:caseFileId/evidence")
  @CheckPolicies({ action: "read", subject: "EvidenceItem" })
  listEvidence(@Param("caseFileId") caseFileId: string) {
    return this.service.listEvidence(caseFileId);
  }

  @Post("evidence")
  @CheckPolicies({ action: "create", subject: "EvidenceItem" })
  createEvidence(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateEvidenceSchema)) dto: CreateEvidence,
  ) {
    return this.service.createEvidence(userId, dto);
  }

  @Get("evidence/:id")
  @CheckPolicies({ action: "read", subject: "EvidenceItem" })
  getEvidence(@Param("id") id: string) {
    return this.service.getEvidence(id);
  }

  @Post("evidence/:id/custody")
  @CheckPolicies({ action: "update", subject: "EvidenceItem" })
  addCustody(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(AddCustodySchema)) dto: AddCustody,
  ) {
    return this.service.addCustody(userId, id, dto);
  }

  @Get("case/:caseFileId/detail")
  @CheckPolicies({ action: "read", subject: "EvidenceItem" })
  getDetail(@Param("caseFileId") caseFileId: string) {
    return this.service.getDetail(caseFileId);
  }

  @Put("case/:caseFileId/detail")
  @CheckPolicies({ action: "update", subject: "EvidenceItem" })
  upsertDetail(
    @CurrentUserId() userId: string,
    @Param("caseFileId") caseFileId: string,
    @Body(new ZodPipe(ForensicDetailSchema)) dto: ForensicDetailInput,
  ) {
    return this.service.upsertDetail(userId, caseFileId, dto);
  }
}
