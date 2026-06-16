import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { config } from "../common/config.js";

/**
 * Schützt die FiveM-Bridge-Endpunkte per Shared-Secret-Header.
 * Die Lua-Resource sendet `x-fivem-token: <FIVEM_BRIDGE_TOKEN>`.
 * Vergleich timing-safe (constant-time).
 */
@Injectable()
export class FivemTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.header("x-fivem-token") ?? "";
    const expected = config.fivemBridgeToken;
    if (!expected || !this.safeEqual(token, expected)) {
      throw new UnauthorizedException("Ungültiges FiveM-Bridge-Token");
    }
    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }
}
