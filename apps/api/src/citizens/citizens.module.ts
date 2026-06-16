import { Module } from "@nestjs/common";
import { CitizensController } from "./citizens.controller.js";
import { CitizensService } from "./citizens.service.js";

@Module({
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}
