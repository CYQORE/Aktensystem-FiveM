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
import { JailService } from "./jail.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateJailSchema, type CreateJail } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("jail")
export class JailController {
  constructor(private readonly service: JailService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Inmate" })
  list(@Query("status") status?: string) {
    return this.service.list(status);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Inmate" })
  book(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateJailSchema)) dto: CreateJail,
  ) {
    return this.service.book(userId, dto);
  }

  @Patch(":id/release")
  @CheckPolicies({ action: "update", subject: "Inmate" })
  release(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.release(userId, id);
  }
}
