import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  FiveMDutyEventSchema,
  FiveMPositionSchema,
  FiveMEmergencyCallSchema,
  FiveMIssueSchema,
  FiveMPendingRequestSchema,
  FiveMCommandAckSchema,
  FiveMAlertSchema,
  FiveMStatusSchema,
  type FiveMIssue,
  type FiveMCommandAck,
  type FiveMPendingRequest,
  type FiveMDutyEvent,
  type FiveMPosition,
  type FiveMEmergencyCall,
  type FiveMAlert,
  type FiveMStatus,
} from "@aktensystem/shared";
import { FivemTokenGuard } from "./fivem.guard.js";
import { FivemService } from "./fivem.service.js";
import { FivemAuthService } from "../auth/fivem-auth.service.js";
import { FivemCommandsService } from "../commands/commands.service.js";
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
    private readonly commands: FivemCommandsService,
  ) {}

  /**
   * Lua-Server fordert One-Time-Login-Code für einen Spieler an.
   * Identifier sind vertrauenswürdig (kommen vom FiveM-Server via Bridge-Token).
   */
  @Post("auth")
  issueLogin(@Body(new ZodPipe(FiveMIssueSchema)) body: FiveMIssue) {
    return this.fivemAuth.issueTicket(body);
  }

  /**
   * Bootstrap-Admin-Claim in-game (/s6mdtadmin). Erster Spieler wird Admin,
   * danach gesperrt. Bridge-authed (Identifier vom FiveM-Server).
   */
  @Post("admin-claim")
  claimAdmin(@Body(new ZodPipe(FiveMIssueSchema)) body: FiveMIssue) {
    return this.fivemAuth.claimAdmin(body);
  }

  @Post("duty")
  duty(@Body(new ZodPipe(FiveMDutyEventSchema)) body: FiveMDutyEvent) {
    return this.fivem.handleDuty(body);
  }

  @Post("position")
  position(@Body(new ZodPipe(FiveMPositionSchema)) body: FiveMPosition) {
    return this.fivem.handlePosition(body);
  }

  @Post("dispatch")
  dispatch(@Body(new ZodPipe(FiveMEmergencyCallSchema)) body: FiveMEmergencyCall) {
    return this.fivem.handleEmergencyCall(body);
  }

  /** Panic-/Backup-Alarm aus dem Spiel. */
  @Post("alert")
  alert(@Body(new ZodPipe(FiveMAlertSchema)) body: FiveMAlert) {
    return this.fivem.handleAlert(body);
  }

  /** Status-Code (10-Code) in-game setzen. */
  @Post("status")
  status(@Body(new ZodPipe(FiveMStatusSchema)) body: FiveMStatus) {
    return this.fivem.handleStatus(body);
  }

  /**
   * Lua-Poll: liefert offene Befehle (Geld/Haft) für aktuell online Spieler
   * und markiert sie als ausgeliefert. Hochfrequent, daher schlanke Antwort.
   */
  @Post("commands/pending")
  async pending(@Body(new ZodPipe(FiveMPendingRequestSchema)) body: FiveMPendingRequest) {
    const commands = await this.commands.fetchPending(body.identifiers);
    return { commands };
  }

  /** Lua-Quittung: Befehl in-game ausgeführt (oder fehlgeschlagen). */
  @Post("commands/ack")
  ack(@Body(new ZodPipe(FiveMCommandAckSchema)) body: FiveMCommandAck) {
    return this.commands.ack(body);
  }
}
