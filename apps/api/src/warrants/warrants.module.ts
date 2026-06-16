import { Module } from "@nestjs/common";
import { WarrantsController } from "./warrants.controller.js";
import { WarrantsService } from "./warrants.service.js";

@Module({
  controllers: [WarrantsController],
  providers: [WarrantsService],
})
export class WarrantsModule {}
