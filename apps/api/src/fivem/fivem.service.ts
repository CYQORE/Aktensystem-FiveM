import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { WorkforceService } from "../workforce/workforce.service.js";
import {
  WS_EVENTS,
  DispatchPriority,
  type FiveMDutyEvent,
  type FiveMPosition,
  type FiveMEmergencyCall,
} from "@aktensystem/shared";

/**
 * Verarbeitet FiveM-Bridge-Events und verdrahtet sie mit Domänen-Services:
 *  - Duty  -> WorkforceService (ShiftLog start/stop)
 *  - Position -> Unit-Position aktualisieren + Live-Broadcast
 *  - Notruf -> DispatchCall anlegen + Broadcast
 */
@Injectable()
export class FivemService {
  private readonly logger = new Logger(FivemService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly workforce: WorkforceService,
  ) {}

  private resolveUser(identifier: string) {
    return this.prisma.user.findUnique({
      where: { fivemIdentifier: identifier },
      include: { memberships: { where: { isActive: true }, include: { rank: true }, take: 1 } },
    });
  }

  async handleDuty(event: FiveMDutyEvent) {
    const user = await this.resolveUser(event.identifier);
    if (!user) {
      this.logger.debug(`Duty-Event für unbekannten Identifier ${event.identifier}`);
      return { accepted: false, reason: "user_not_linked" };
    }
    const membership = user.memberships[0];
    const factionId = membership?.factionId ?? event.factionId;
    if (event.onDuty) {
      if (!factionId) return { accepted: false, reason: "no_faction" };
      await this.workforce.startDuty(user.id, factionId, membership?.rank?.name ?? event.rank);
    } else {
      await this.workforce.endDuty(user.id);
    }
    return { accepted: true };
  }

  async handlePosition(event: FiveMPosition) {
    const user = await this.resolveUser(event.identifier);
    if (user) {
      const member = await this.prisma.unitMember.findFirst({
        where: { userId: user.id },
      });
      if (member) {
        const unit = await this.prisma.unit.update({
          where: { id: member.unitId },
          data: { x: event.x, y: event.y, heading: event.heading, lastSeenAt: new Date() },
        });
        this.realtime.broadcastPosition(unit.sectorId ?? "global", {
          unitId: unit.id,
          callsign: unit.callsign,
          x: event.x,
          y: event.y,
          heading: event.heading,
          status: unit.status,
        });
        return { accepted: true };
      }
    }
    // kein zugeordnetes Unit -> rohe Position broadcasten
    this.realtime.broadcastPosition("global", event);
    return { accepted: true };
  }

  async handleEmergencyCall(event: FiveMEmergencyCall) {
    const call = await this.prisma.dispatchCall.create({
      data: {
        line: event.line,
        location: `${event.x.toFixed(1)}, ${event.y.toFixed(1)}`,
        category: event.line,
        description: event.message,
        priority: DispatchPriority.P2,
        x: event.x,
        y: event.y,
      },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_CREATED, call);
    return { accepted: true, callNumber: call.number };
  }
}
