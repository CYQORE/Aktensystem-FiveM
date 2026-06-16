import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeGateway } from "./realtime.gateway.js";
import { config } from "../common/config.js";

@Module({
  imports: [JwtModule.register({ secret: config.jwt.accessSecret })],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
