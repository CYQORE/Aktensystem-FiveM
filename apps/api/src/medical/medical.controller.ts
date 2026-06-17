import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { MedicalService } from "./medical.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateMedicalIncidentSchema, type CreateMedicalIncident } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("medical-incidents")
export class MedicalController {
  constructor(private readonly service: MedicalService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "PatientRecord" })
  list(@Query("citizenId") citizenId?: string) {
    return this.service.list(citizenId);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "PatientRecord" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateMedicalIncidentSchema)) dto: CreateMedicalIncident,
  ) {
    return this.service.create(userId, dto);
  }
}
