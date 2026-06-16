import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CitizensService } from "./citizens.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  CreateCitizenSchema,
  CreateCitizenRecordSchema,
  type CreateCitizen,
  type CreateCitizenRecord,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("citizens")
export class CitizensController {
  constructor(private readonly service: CitizensService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Citizen" })
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "Citizen" })
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Citizen" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateCitizenSchema)) dto: CreateCitizen,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "update", subject: "Citizen" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() patch: Partial<CreateCitizen>,
  ) {
    return this.service.update(userId, id, patch);
  }

  /** Strafakte (CaseFile STRAFAKTE + Anklagen) für den Bürger anlegen. */
  @Post(":id/records")
  @CheckPolicies({ action: "create", subject: "CaseFile" })
  createRecord(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(CreateCitizenRecordSchema)) dto: CreateCitizenRecord,
  ) {
    return this.service.createRecord(userId, id, dto);
  }

  @Patch(":id/photo")
  @CheckPolicies({ action: "update", subject: "Citizen" })
  setPhoto(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: { photo: string },
  ) {
    return this.service.setPhoto(userId, id, body.photo);
  }
}
