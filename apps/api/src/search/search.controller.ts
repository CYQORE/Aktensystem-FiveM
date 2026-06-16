import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SearchService } from "./search.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("search")
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Citizen" })
  search(@CurrentUserId() userId: string, @Query("q") q = "") {
    return this.service.search(userId, q);
  }
}
