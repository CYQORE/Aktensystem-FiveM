import { Module } from "@nestjs/common";
import { DispatchController } from "./dispatch.controller.js";
import { DispatchService } from "./dispatch.service.js";
import { RealtimeModule } from "../realtime/realtime.module.js";

@Module({
  imports: [RealtimeModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
