import { Controller, Post, UseGuards } from "@nestjs/common";
import { ServerSyncService } from "./server-sync.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("server-sync")
export class ServerSyncController {
  constructor(private readonly service: ServerSyncService) {}

  /** Spieler + Fahrzeuge aus der Game-DB ziehen (nur Admin). */
  @Post()
  @CheckPolicies({ action: "manage", subject: "all" })
  sync() {
    return this.service.sync();
  }
}
