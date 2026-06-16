import { Module } from "@nestjs/common";
import { JailController } from "./jail.controller.js";
import { JailService } from "./jail.service.js";
import { CommandsModule } from "../commands/commands.module.js";

@Module({
  imports: [CommandsModule],
  controllers: [JailController],
  providers: [JailService],
})
export class JailModule {}
