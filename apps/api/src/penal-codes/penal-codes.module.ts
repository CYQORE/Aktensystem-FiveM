import { Module } from "@nestjs/common";
import { PenalCodesController } from "./penal-codes.controller.js";
import { PenalCodesService } from "./penal-codes.service.js";

@Module({
  controllers: [PenalCodesController],
  providers: [PenalCodesService],
})
export class PenalCodesModule {}
