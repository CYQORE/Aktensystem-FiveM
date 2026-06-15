import { Injectable, Logger } from "@nestjs/common";
import type {
  FiveMDutyEvent,
  FiveMPosition,
  FiveMEmergencyCall,
} from "@aktensystem/shared";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";

/**
 * Verarbeitet FiveM-Bridge-Events. Phase 1: validiert + broadcastet Live-Daten
 * über das Realtime-Gateway. Persistenz (ShiftLog/Unit-Position/DispatchCall)
 * und Sektor-Zuordnung folgen in Phase 3/5.
 */
@Injectable()
export class FivemService {
  private readonly logger = new Logger(FivemService.name);

  constructor(private readonly realtime: RealtimeGateway) {}

  handleDuty(event: FiveMDutyEvent) {
    // TODO Phase 3: ShiftLog start/stop, Auto-Abschluss bei Disconnect
    this.logger.debug(
      `Duty ${event.onDuty ? "ON" : "OFF"} für ${event.identifier}`,
    );
    return { accepted: true };
  }

  handlePosition(event: FiveMPosition) {
    // TODO Phase 3: Unit.x/y/lastSeenAt updaten + Sektor ableiten
    this.realtime.broadcastPosition("global", event);
    return { accepted: true };
  }

  handleEmergencyCall(event: FiveMEmergencyCall) {
    // TODO Phase 3: DispatchCall anlegen, Priorität ableiten
    this.realtime.broadcastDispatch("dispatch:created", event);
    return { accepted: true };
  }
}
