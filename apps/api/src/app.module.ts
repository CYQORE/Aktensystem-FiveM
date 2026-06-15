import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { FivemModule } from "./fivem/fivem.module.js";

/**
 * Wurzel-Modul. Phase 1: Health + Prisma + Realtime-Gateway + FiveM-Bridge-Skelett.
 * Fach-Module (Auth, RBAC-Guard, CaseFile, Sharing, Dispatch, Workforce, Documents)
 * werden in Phase 3 ergänzt — hier als Domänen-Bounded-Contexts vorgesehen.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RealtimeModule,
    FivemModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
