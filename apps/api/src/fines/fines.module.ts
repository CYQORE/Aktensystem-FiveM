import { Module } from "@nestjs/common";
import { FinesController } from "./fines.controller.js";
import { FinesService } from "./fines.service.js";
import { CommandsModule } from "../commands/commands.module.js";

@Module({
  imports: [CommandsModule],
  controllers: [FinesController],
  providers: [FinesService],
})
export class FinesModule {}
