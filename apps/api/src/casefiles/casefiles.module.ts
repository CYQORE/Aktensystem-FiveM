import { Module } from "@nestjs/common";
import { CaseFilesController } from "./casefiles.controller.js";
import { CaseFilesService } from "./casefiles.service.js";

@Module({
  controllers: [CaseFilesController],
  providers: [CaseFilesService],
  exports: [CaseFilesService],
})
export class CaseFilesModule {}
