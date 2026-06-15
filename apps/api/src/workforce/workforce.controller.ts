import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { WorkforceService } from "./workforce.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("workforce")
export class WorkforceController {
  constructor(private readonly service: WorkforceService) {}

  /** Statistik. period = week|month|year (Default week). */
  @Get("stats")
  @CheckPolicies({ action: "read", subject: "ShiftLog" })
  stats(
    @Query("period") period: "week" | "month" | "year" = "week",
    @Query("factionId") factionId?: string,
  ) {
    const days = period === "year" ? 365 : period === "month" ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.service.stats(since, factionId);
  }
}
