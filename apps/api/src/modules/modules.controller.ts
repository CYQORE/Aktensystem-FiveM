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

@Controller("modules")
export class ModulesController {
  constructor(private readonly service: ModulesService) {}

  /**
   * Modul-Liste (nur Navigations-Metadaten, nicht sensibel) — PUBLIC, damit die
   * dynamische Navigation auch vor dem Login lädt (kein 401 auf der Startseite).
   */
  @Get()
  list() {
    return this.service.list();
  }

  /** Neues Modul registrieren (Admin) — Erweiterung im laufenden Betrieb. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: "manage", subject: "PlatformModule" })
  @Post()
  register(@Body(new ZodPipe(RegisterModuleSchema)) dto: RegisterModule) {
    return this.service.register(dto);
  }

  /** Modul an-/ausschalten (Admin). */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies({ action: "manage", subject: "PlatformModule" })
  @Patch(":key")
  toggle(@Param("key") key: string, @Body() body: { enabled: boolean }) {
    return this.service.setEnabled(key, body.enabled);
  }
}
