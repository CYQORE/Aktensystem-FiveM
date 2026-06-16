import { Controller, Get, UseGuards } from "@nestjs/common";
import { DashboardService } from "./dashboard.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get("stats")
  @CheckPolicies({ action: "read", subject: "DispatchCall" })
  stats() {
    return this.service.stats();
  }
}
