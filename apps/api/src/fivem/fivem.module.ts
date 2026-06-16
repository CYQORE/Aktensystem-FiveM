import { Module } from "@nestjs/common";
import { FivemController } from "./fivem.controller.js";
import { FivemService } from "./fivem.service.js";
import { RealtimeModule } from "../realtime/realtime.module.js";
import { CommandsModule } from "../commands/commands.module.js";

@Module({
  imports: [RealtimeModule, CommandsModule],
  controllers: [FivemController],
  providers: [FivemService],
})
export class FivemModule {}
