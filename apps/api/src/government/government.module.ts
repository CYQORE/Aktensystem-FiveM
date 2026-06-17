import { Module } from "@nestjs/common";
import { GovernmentController } from "./government.controller.js";
import { GovernmentService } from "./government.service.js";

@Module({
  controllers: [GovernmentController],
  providers: [GovernmentService],
})
export class GovernmentModule {}
