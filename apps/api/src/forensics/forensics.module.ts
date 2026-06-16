import { Module } from "@nestjs/common";
import { ForensicsController } from "./forensics.controller.js";
import { ForensicsService } from "./forensics.service.js";

@Module({
  controllers: [ForensicsController],
  providers: [ForensicsService],
})
export class ForensicsModule {}
