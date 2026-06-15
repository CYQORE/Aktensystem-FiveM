import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CaseFilesService } from "./casefiles.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateCaseFileSchema, type CreateCaseFile } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("case-files")
export class CaseFilesController {
  constructor(private readonly service: CaseFilesService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "CaseFile" })
  list(@CurrentUserId() userId: string) {
    return this.service.list(userId);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "CaseFile" })
  get(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.get(userId, id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "CaseFile" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateCaseFileSchema)) dto: CreateCaseFile,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "update", subject: "CaseFile" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() patch: Partial<CreateCaseFile>,
  ) {
    return this.service.update(userId, id, patch);
  }
}
