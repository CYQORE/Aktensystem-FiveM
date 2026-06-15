import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  FiveMDutyEventSchema,
  FiveMPositionSchema,
  FiveMEmergencyCallSchema,
} from "@aktensystem/shared";
import { FivemTokenGuard } from "./fivem.guard.js";
import { FivemService } from "./fivem.service.js";

/**
 * FiveM-Bridge: REST-Eingang für In-Game-Events. Die Lua-Resource ruft diese
 * Endpunkte auf (Duty On/Off, Live-Position, Notruf). Validierung via Zod.
 */
@UseGuards(FivemTokenGuard)
@Controller("fivem")
export class FivemController {
  constructor(private readonly fivem: FivemService) {}

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
