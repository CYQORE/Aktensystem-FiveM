import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { config } from "../common/config.js";

/**
 * Verifiziert das Access-JWT aus dem Authorization-Header und setzt req.userId.
 * Vorausgesetzt von PoliciesGuard und allen geschützten Controllern.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>();
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Kein Access-Token");
    }
    const token = header.slice(7);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: config.jwt.accessSecret,
      });
      req.userId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException("Token ungültig oder abgelaufen");
    }
  }
}
