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
import { BolosService } from "./bolos.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateBoloSchema, type CreateBolo } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("bolos")
export class BolosController {
  constructor(private readonly service: BolosService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Bolo" })
  list(@Query("active") active?: string) {
    return this.service.list(active);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Bolo" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateBoloSchema)) dto: CreateBolo,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id/resolve")
  @CheckPolicies({ action: "update", subject: "Bolo" })
  resolve(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.resolve(userId, id);
  }

  @Delete(":id")
  @CheckPolicies({ action: "delete", subject: "Bolo" })
  remove(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.remove(userId, id);
  }
}
