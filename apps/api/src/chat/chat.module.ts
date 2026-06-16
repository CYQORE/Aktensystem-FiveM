import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller.js";
import { ChatService } from "./chat.service.js";
import { RealtimeModule } from "../realtime/realtime.module.js";

@Module({
  imports: [RealtimeModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
