import { Module } from "@nestjs/common";
import { ServerSyncController } from "./server-sync.controller.js";
import { ServerSyncService } from "./server-sync.service.js";

@Module({
  controllers: [ServerSyncController],
  providers: [ServerSyncService],
  exports: [ServerSyncService],
})
export class ServerSyncModule {}
