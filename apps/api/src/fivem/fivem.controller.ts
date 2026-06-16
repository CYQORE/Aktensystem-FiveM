import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  FiveMDutyEventSchema,
  FiveMPositionSchema,
  FiveMEmergencyCallSchema,
  FiveMIssueSchema,
  type FiveMIssue,
} from "@aktensystem/shared";
import { FivemTokenGuard } from "./fivem.guard.js";
import { FivemService } from "./fivem.service.js";
import { FivemAuthService } from "../auth/fivem-auth.service.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";

/**
 * FiveM-Bridge: REST-Eingang für In-Game-Events. Die Lua-Resource ruft diese
 * Endpunkte auf (Duty On/Off, Live-Position, Notruf, Login-Code). Validierung via Zod.
 */
@UseGuards(FivemTokenGuard)
@Controller("fivem")
export class FivemController {
  constructor(
    private readonly fivem: FivemService,
    private readonly fivemAuth: FivemAuthService,
  ) {}

  /**
   * Lua-Server fordert One-Time-Login-Code für einen Spieler an.
   * Identifier sind vertrauenswürdig (kommen vom FiveM-Server via Bridge-Token).
   */
  @Post("auth")
  issueLogin(@Body(new ZodPipe(FiveMIssueSchema)) body: FiveMIssue) {
    return this.fivemAuth.issueTicket(body);
  }

  @Post("duty")
  duty(@Body() body: unknown) {
    const event = FiveMDutyEventSchema.parse(body);
    return this.fivem.handleDuty(event);
  }

  @Post("position")
  position(@Body() body: unknown) {
    const event = FiveMPositionSchema.parse(body);
    return this.fivem.handlePosition(event);
  }

  @Post("dispatch")
  dispatch(@Body() body: unknown) {
    const event = FiveMEmergencyCallSchema.parse(body);
    return this.fivem.handleEmergencyCall(event);
  }
}
