import { Module } from "@nestjs/common";
import { BolosController } from "./bolos.controller.js";
import { BolosService } from "./bolos.service.js";

@Module({
  controllers: [BolosController],
  providers: [BolosService],
})
export class BolosModule {}
