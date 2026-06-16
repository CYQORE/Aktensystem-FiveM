import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service.js";
import { FivemAuthService } from "./fivem-auth.service.js";
import { TicketCleanupService } from "./ticket-cleanup.service.js";
import { AuthController } from "./auth.controller.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { config } from "../common/config.js";

@Global()
@Module({
  imports: [JwtModule.register({ secret: config.jwt.accessSecret })],
  controllers: [AuthController],
  providers: [AuthService, FivemAuthService, TicketCleanupService, JwtAuthGuard],
  exports: [AuthService, FivemAuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
