import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { PermissionsService } from "./permissions.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { SetRankGrantsSchema, type SetRankGrants } from "@aktensystem/shared";

// Nur Plattform-Admins dürfen Rechte verteilen (manage all).
@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("admin")
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get("factions")
  @CheckPolicies({ action: "manage", subject: "all" })
  factions() {
    return this.service.listFactions();
  }

  @Get("factions/:id/ranks")
  @CheckPolicies({ action: "manage", subject: "all" })
  ranks(@Param("id") id: string) {
    return this.service.listRanks(id);
  }

  @Patch("ranks/:id/grants")
  @CheckPolicies({ action: "manage", subject: "all" })
  setGrants(
    @Param("id") id: string,
    @Body(new ZodPipe(SetRankGrantsSchema)) dto: SetRankGrants,
  ) {
    return this.service.setGrants(id, dto);
  }
}
