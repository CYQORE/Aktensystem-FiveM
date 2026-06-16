import { Module } from "@nestjs/common";
import { RadioController } from "./radio.controller.js";
import { RadioService } from "./radio.service.js";
import { RealtimeModule } from "../realtime/realtime.module.js";

@Module({
  imports: [RealtimeModule],
  controllers: [RadioController],
  providers: [RadioService],
})
export class RadioModule {}
