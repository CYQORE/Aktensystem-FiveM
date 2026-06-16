import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ChatService } from "./chat.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { SendChatMessageSchema, type SendChatMessage } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("chat")
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get("channels")
  @CheckPolicies({ action: "read", subject: "ChatMessage" })
  channels(@CurrentUserId() userId: string) {
    return this.service.accessibleChannels(userId);
  }

  @Get(":channel/messages")
  @CheckPolicies({ action: "read", subject: "ChatMessage" })
  list(@CurrentUserId() userId: string, @Param("channel") channel: string) {
    return this.service.list(userId, channel);
  }

  @Post(":channel/messages")
  @CheckPolicies({ action: "create", subject: "ChatMessage" })
  send(
    @CurrentUserId() userId: string,
    @Param("channel") channel: string,
    @Body(new ZodPipe(SendChatMessageSchema)) dto: SendChatMessage,
  ) {
    return this.service.send(userId, channel, dto.body);
  }
}
