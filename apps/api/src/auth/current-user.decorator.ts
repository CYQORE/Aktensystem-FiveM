import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

/** Liefert die userId, die JwtAuthGuard am Request gesetzt hat. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request & { userId?: string }>();
    return req.userId ?? "";
  },
);
