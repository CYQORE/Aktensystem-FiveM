import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ActorService } from "./actor.service.js";
import {
  POLICIES_KEY,
  type RequiredPolicy,
} from "./policies.decorator.js";

/**
 * Grobgranularer Action×Subject-Check via CASL. Record-Level-Bedingungen
 * (ownerFactionId, securityLevelRank) werden zusätzlich im Service geprüft,
 * da der Datensatz dort vorliegt.
 *
 * Läuft NACH JwtAuthGuard — erwartet req.userId.
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly actor: ActorService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<RequiredPolicy[]>(POLICIES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();
    if (!req.userId) throw new ForbiddenException("Nicht authentifiziert");

    const ability = await this.actor.buildAbility(req.userId);
    const ok = required.every((p) => ability.can(p.action, p.subject));
    if (!ok) throw new ForbiddenException("Keine Berechtigung");

    return true;
  }
}
