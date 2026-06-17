import { Module } from "@nestjs/common";
import { MedicalController } from "./medical.controller.js";
import { MedicalService } from "./medical.service.js";

@Module({
  controllers: [MedicalController],
  providers: [MedicalService],
})
export class MedicalModule {}
