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
import { FinesService } from "./fines.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateFineSchema, type CreateFine } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("fines")
export class FinesController {
  constructor(private readonly service: FinesService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Fine" })
  list(@Query("status") status?: string, @Query("citizenId") citizenId?: string) {
    return this.service.list(status, citizenId);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Fine" })
  issue(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateFineSchema)) dto: CreateFine,
  ) {
    return this.service.issue(userId, dto);
  }

  @Patch(":id/pay")
  @CheckPolicies({ action: "update", subject: "Fine" })
  pay(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.pay(userId, id);
  }

  @Patch(":id/waive")
  @CheckPolicies({ action: "update", subject: "Fine" })
  waive(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.waive(userId, id);
  }
}
