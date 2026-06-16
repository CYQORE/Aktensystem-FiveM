import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health/health.controller.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RealtimeModule } from "./realtime/realtime.module.js";
import { FivemModule } from "./fivem/fivem.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { RbacModule } from "./rbac/rbac.module.js";
import { AuditModule } from "./audit/audit.module.js";
import { CitizensModule } from "./citizens/citizens.module.js";
import { VehiclesModule } from "./vehicles/vehicles.module.js";
import { ForensicsModule } from "./forensics/forensics.module.js";
import { JusticeModule } from "./justice/justice.module.js";
import { PenalCodesModule } from "./penal-codes/penal-codes.module.js";
import { WarrantsModule } from "./warrants/warrants.module.js";
import { BolosModule } from "./bolos/bolos.module.js";
import { FinesModule } from "./fines/fines.module.js";
import { JailModule } from "./jail/jail.module.js";
import { RadioModule } from "./radio/radio.module.js";
import { ModulesRegistryModule } from "./modules/modules.module.js";
import { CaseFilesModule } from "./casefiles/casefiles.module.js";
import { SharingModule } from "./sharing/sharing.module.js";
import { DispatchModule } from "./dispatch/dispatch.module.js";
import { WorkforceModule } from "./workforce/workforce.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { ReportsModule } from "./reports/reports.module.js";
import { NotificationsModule } from "./notifications/notifications.module.js";

/**
 * Wurzel-Modul (Phase 3). Plattform-Querschnitt (Prisma/RBAC/Auth/Audit/
 * Workforce/Notifications) global; Fach-Module je Bounded Context.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Basis-Drossel; eng gezogen auf den public Auth-Endpunkten (siehe AuthController).
    // FiveM-Bridge ist bewusst NICHT throttled (Hochfrequenz-Positionsdaten).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PrismaModule,
    RealtimeModule,
    RbacModule,
    AuthModule,
    AuditModule,
    WorkforceModule,
    NotificationsModule,
    CitizensModule,
    VehiclesModule,
    ForensicsModule,
    JusticeModule,
    PenalCodesModule,
    WarrantsModule,
    BolosModule,
    FinesModule,
    JailModule,
    RadioModule,
    ModulesRegistryModule,
    CaseFilesModule,
    SharingModule,
    DispatchModule,
    DocumentsModule,
    ReportsModule,
    FivemModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
