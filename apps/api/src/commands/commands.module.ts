import { Module } from "@nestjs/common";
import { FivemCommandsService } from "./commands.service.js";

/** Befehlswarteschlange zur FiveM-Bridge; von fines/jail (enqueue) und fivem (poll/ack) genutzt. */
@Module({
  providers: [FivemCommandsService],
  exports: [FivemCommandsService],
})
export class CommandsModule {}
