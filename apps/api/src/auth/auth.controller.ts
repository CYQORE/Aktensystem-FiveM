import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service.js";
import { FivemAuthService } from "./fivem-auth.service.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";
import { CurrentUserId } from "./current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { FiveMExchangeSchema, type FiveMExchange } from "@aktensystem/shared";
import { config } from "../common/config.js";

const REFRESH_COOKIE = "aktensystem_rt";

@UseGuards(ThrottlerGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly fivemAuth: FivemAuthService,
  ) {}

  /**
   * FiveM-Identitäts-Login: Web tauscht den One-Time-Code (aus NUI/`/cad`)
   * gegen Access-JWT + Refresh-Cookie. Public — der Code IST das Geheimnis.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("fivem/exchange")
  async fivemExchange(
    @Req() req: Request,
    @Res() res: Response,
    @Body(new ZodPipe(FiveMExchangeSchema)) dto: FiveMExchange,
  ) {
    const tokens = await this.fivemAuth.exchange(dto.code, {
      ip: req.ip,
      userAgent: req.header("user-agent") ?? undefined,
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  }

  /** Schritt 1: Redirect zu Discord. */
  @Get("discord")
  login(@Res() res: Response) {
    const state = randomBytes(16).toString("hex");
    res.cookie("oauth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.nodeEnv === "production",
    });
    res.redirect(this.auth.getDiscordAuthUrl(state));
  }

  /** Schritt 2: Discord-Callback -> Tokens -> Refresh-Cookie -> Web-Redirect. */
  @Get("discord/callback")
  async callback(@Req() req: Request, @Res() res: Response) {
    const code = String(req.query.code ?? "");
    const state = String(req.query.state ?? "");
    if (!code) throw new UnauthorizedException("Kein Code");
    if (state !== req.cookies?.oauth_state) {
      throw new UnauthorizedException("State-Mismatch");
    }

    const tokens = await this.auth.handleDiscordCallback(code, {
      ip: req.ip,
      userAgent: req.header("user-agent") ?? undefined,
    });

    this.setRefreshCookie(res, tokens.refreshToken);
    // Access-Token an das Web-Frontend übergeben (Fragment, nicht Query)
    res.redirect(`${config.webOrigin}/auth/callback#token=${tokens.accessToken}`);
  }

  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (!raw) throw new UnauthorizedException("Kein Refresh-Token");
    const tokens = await this.auth.rotateRefresh(raw, {
      ip: req.ip,
      userAgent: req.header("user-agent") ?? undefined,
    });
    this.setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res() res: Response) {
    const raw = req.cookies?.[REFRESH_COOKIE];
    if (raw) await this.auth.revoke(raw);
    res.clearCookie(REFRESH_COOKIE);
    res.json({ ok: true });
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUserId() userId: string) {
    return this.auth.me(userId);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.nodeEnv === "production",
      maxAge: config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
      path: "/api/v1/auth",
    });
  }
}
