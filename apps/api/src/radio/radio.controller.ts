import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { RadioService } from "./radio.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateRadioChannelSchema, type CreateRadioChannel } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("radio/channels")
export class RadioController {
  constructor(private readonly service: RadioService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "RadioChannel" })
  list() {
    return this.service.listChannels();
  }

  @Post()
  @CheckPolicies({ action: "manage", subject: "all" })
  create(@Body(new ZodPipe(CreateRadioChannelSchema)) dto: CreateRadioChannel) {
    return this.service.create(dto);
  }

  @Delete(":id")
  @CheckPolicies({ action: "manage", subject: "all" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post(":id/join")
  @CheckPolicies({ action: "update", subject: "RadioChannel" })
  join(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.join(userId, id);
  }

  @Post(":id/leave")
  @CheckPolicies({ action: "update", subject: "RadioChannel" })
  leave(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.leave(userId, id);
  }
}
