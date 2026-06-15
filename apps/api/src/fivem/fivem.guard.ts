import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

/**
 * Schützt die FiveM-Bridge-Endpunkte per Shared-Secret-Header.
 * Die Lua-Resource sendet `x-fivem-token: <FIVEM_BRIDGE_TOKEN>`.
 */
@Injectable()
export class FivemTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.header("x-fivem-token");
    const expected = process.env.FIVEM_BRIDGE_TOKEN;
    if (!expected || token !== expected) {
      throw new UnauthorizedException("Ungültiges FiveM-Bridge-Token");
    }
    return true;
  }
}
