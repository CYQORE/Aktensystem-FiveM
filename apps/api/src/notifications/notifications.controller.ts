import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUserId() userId: string) {
    return this.service.list(userId);
  }

  @Post(":id/read")
  markRead(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.markRead(userId, id);
  }
}
