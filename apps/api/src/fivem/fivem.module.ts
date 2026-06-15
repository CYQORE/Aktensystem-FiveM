import { Module } from "@nestjs/common";
import { FivemController } from "./fivem.controller.js";
import { FivemService } from "./fivem.service.js";
import { RealtimeModule } from "../realtime/realtime.module.js";

@Module({
  imports: [RealtimeModule],
  controllers: [FivemController],
  providers: [FivemService],
})
export class FivemModule {}
