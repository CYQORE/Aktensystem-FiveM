import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PenalCodesService } from "./penal-codes.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreatePenalCodeSchema, type CreatePenalCode } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("penal-codes")
export class PenalCodesController {
  constructor(private readonly service: PenalCodesService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "PenalCode" })
  list(@Query("q") q?: string, @Query("category") category?: string) {
    return this.service.list(q, category);
  }

  @Get("categories")
  @CheckPolicies({ action: "read", subject: "PenalCode" })
  categories() {
    return this.service.categories();
  }

  // Pflege nur für Admin/Dienstaufsicht (manage = nur Plattform-Admin).
  @Post()
  @CheckPolicies({ action: "manage", subject: "PenalCode" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreatePenalCodeSchema)) dto: CreatePenalCode,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "manage", subject: "PenalCode" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: Partial<CreatePenalCode>,
  ) {
    return this.service.update(userId, id, dto);
  }

  @Delete(":id")
  @CheckPolicies({ action: "manage", subject: "PenalCode" })
  remove(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.remove(userId, id);
  }
}
