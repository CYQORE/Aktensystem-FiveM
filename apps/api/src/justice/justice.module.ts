import { Module } from "@nestjs/common";
import { JusticeController } from "./justice.controller.js";
import { JusticeService } from "./justice.service.js";

@Module({
  controllers: [JusticeController],
  providers: [JusticeService],
})
export class JusticeModule {}
