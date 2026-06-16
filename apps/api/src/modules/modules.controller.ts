import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ModulesService } from "./modules.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { RegisterModuleSchema, type RegisterModule } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("modules")
export class ModulesController {
  constructor(private readonly service: ModulesService) {}

  /** Modul-Liste (für dynamische Navigation). Alle authentifizierten Nutzer. */
  @Get()
  @CheckPolicies({ action: "read", subject: "PlatformModule" })
  list() {
    return this.service.list();
  }

  /** Neues Modul registrieren (Admin) — Erweiterung im laufenden Betrieb. */
  @Post()
  @CheckPolicies({ action: "manage", subject: "PlatformModule" })
  register(@Body(new ZodPipe(RegisterModuleSchema)) dto: RegisterModule) {
    return this.service.register(dto);
  }

  /** Modul an-/ausschalten (Admin). */
  @Patch(":key")
  @CheckPolicies({ action: "manage", subject: "PlatformModule" })
  toggle(@Param("key") key: string, @Body() body: { enabled: boolean }) {
    return this.service.setEnabled(key, body.enabled);
  }
}
