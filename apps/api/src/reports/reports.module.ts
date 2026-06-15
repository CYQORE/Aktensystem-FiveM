import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller.js";
import { PdfService } from "./pdf.service.js";
import { CaseFilesModule } from "../casefiles/casefiles.module.js";

@Module({
  imports: [CaseFilesModule],
  controllers: [ReportsController],
  providers: [PdfService],
})
export class ReportsModule {}
