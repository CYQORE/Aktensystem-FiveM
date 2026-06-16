import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JusticeService } from "./justice.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  AddHearingSchema,
  AddSentenceSchema,
  AddVerdictSchema,
  CreateCourtCaseSchema,
  type AddHearing,
  type AddSentence,
  type AddVerdict,
  type CreateCourtCase,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("court-cases")
export class JusticeController {
  constructor(private readonly service: JusticeService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "CourtCase" })
  list() {
    return this.service.listCases();
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "CourtCase" })
  get(@Param("id") id: string) {
    return this.service.getCase(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "CourtCase" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateCourtCaseSchema)) dto: CreateCourtCase,
  ) {
    return this.service.createCase(userId, dto);
  }

  @Post(":id/hearings")
  @CheckPolicies({ action: "update", subject: "CourtCase" })
  addHearing(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(AddHearingSchema)) dto: AddHearing,
  ) {
    return this.service.addHearing(userId, id, dto);
  }

  @Post(":id/verdicts")
  @CheckPolicies({ action: "update", subject: "CourtCase" })
  addVerdict(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(AddVerdictSchema)) dto: AddVerdict,
  ) {
    return this.service.addVerdict(userId, id, dto);
  }

  @Post(":id/sentences")
  @CheckPolicies({ action: "update", subject: "CourtCase" })
  addSentence(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(AddSentenceSchema)) dto: AddSentence,
  ) {
    return this.service.addSentence(userId, id, dto);
  }
}
