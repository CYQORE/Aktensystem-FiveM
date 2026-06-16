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
import { WarrantsService } from "./warrants.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateWarrantSchema, type CreateWarrant } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("warrants")
export class WarrantsController {
  constructor(private readonly service: WarrantsService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Warrant" })
  list(@Query("status") status?: string, @Query("q") q?: string) {
    return this.service.list(status, q);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "Warrant" })
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Warrant" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateWarrantSchema)) dto: CreateWarrant,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id/execute")
  @CheckPolicies({ action: "update", subject: "Warrant" })
  execute(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.setStatus(userId, id, "EXECUTED");
  }

  @Patch(":id/cancel")
  @CheckPolicies({ action: "update", subject: "Warrant" })
  cancel(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.setStatus(userId, id, "RECALLED");
  }
}
