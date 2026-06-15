import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SharingService } from "./sharing.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { ShareCaseFileSchema, type ShareCaseFile } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class SharingController {
  constructor(private readonly service: SharingService) {}

  @Post("case-files/:id/share")
  @CheckPolicies({ action: "share", subject: "CaseFile" })
  request(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(ShareCaseFileSchema)) dto: ShareCaseFile,
  ) {
    return this.service.request(userId, { ...dto, caseFileId: id });
  }

  @Get("case-files/:id/shares")
  @CheckPolicies({ action: "read", subject: "FileShare" })
  list(@Param("id") id: string) {
    return this.service.listForFile(id);
  }

  @Post("file-shares/:id/approve")
  @CheckPolicies({ action: "approve", subject: "FileShare" })
  approve(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: { partial?: boolean; allowedFields?: string[] },
  ) {
    return this.service.decide(
      userId,
      id,
      body.partial ? "approve_partial" : "approve_full",
      body.allowedFields,
    );
  }

  @Post("file-shares/:id/reject")
  @CheckPolicies({ action: "approve", subject: "FileShare" })
  reject(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.decide(userId, id, "reject");
  }

  @Post("file-shares/:id/revoke")
  @CheckPolicies({ action: "revoke", subject: "FileShare" })
  revoke(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.revoke(userId, id);
  }
}
