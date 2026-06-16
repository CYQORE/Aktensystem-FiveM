import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { WorkforceService } from "../workforce/workforce.service.js";
import {
  WS_EVENTS,
  DispatchPriority,
  EmergencyLine,
  UnitStatus,
  AlertKind,
  type FiveMDutyEvent,
  type FiveMPosition,
  type FiveMEmergencyCall,
  type FiveMAlert,
  type FiveMStatus,
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

  /** Panic-Debounce: Identifier -> letzter Alarm-Zeitpunkt (ms). */
  private readonly lastAlertAt = new Map<string, number>();

  private resolveUser(identifier: string) {
    return this.prisma.user.findUnique({
      where: { fivemIdentifier: identifier },
      include: { memberships: { where: { isActive: true }, include: { rank: true }, take: 1 } },
    });
  }

  /** Deterministische Einheit eines Nutzers (Lead bevorzugt, sonst älteste). */
  private resolveUnitMember(userId: string) {
    return this.prisma.unitMember.findFirst({
      where: { userId },
      orderBy: [{ isLead: "desc" }, { unit: { createdAt: "asc" } }],
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
      const member = await this.resolveUnitMember(user.id);
      if (member) {
        const unit = await this.prisma.unit.update({
          where: { id: member.unitId },
          data: {
            x: event.x,
            y: event.y,
            heading: event.heading,
            zone: event.zone ?? undefined,
            lastSeenAt: new Date(),
          },
        });
        this.realtime.broadcastPosition(unit.sectorId ?? "global", {
          unitId: unit.id,
          callsign: unit.callsign,
          x: event.x,
          y: event.y,
          heading: event.heading,
          status: unit.status,
          zone: unit.zone,
        });
        return { accepted: true };
      }
    }
    // kein zugeordnetes Unit -> rohe Position broadcasten
    this.realtime.broadcastPosition("global", event);
    return { accepted: true };
  }

  /**
   * Panic-/Backup-Alarm aus dem Spiel. Legt einen hochprioren DispatchCall an
   * (PANIC=P1, BACKUP=P2) und broadcastet einen dedizierten Alarm an alle
   * Dispatcher. Der In-Game-Blip für andere Beamte wird direkt vom Lua-Server
   * an die Spieler gepusht (kein Backend-Roundtrip nötig).
   */
  async handleAlert(event: FiveMAlert) {
    const user = await this.resolveUser(event.identifier);
    // Nur verknüpfte Beamte dürfen Alarme auslösen (kein P1-Spam über geratene IDs).
    if (!user) return { accepted: false, reason: "user_not_linked" };

    // Debounce: max. 1 Alarm pro Identifier alle 5s (gegen Key-Mashing).
    const now = Date.now();
    const last = this.lastAlertAt.get(event.identifier) ?? 0;
    if (now - last < 5000) return { accepted: false, reason: "debounced" };
    this.lastAlertAt.set(event.identifier, now);

    const member = await this.resolveUnitMember(user.id);
    const unit = member
      ? await this.prisma.unit.findUnique({
          where: { id: member.unitId },
          select: { callsign: true },
        })
      : null;

    const isPanic = event.kind === AlertKind.PANIC;
    const callsign = unit?.callsign ?? "—";
    const location = event.zone ?? `${event.x.toFixed(0)}, ${event.y.toFixed(0)}`;
    const label = isPanic ? "🚨 PANIC — Beamter in Not" : "🚓 Backup angefordert";

    const call = await this.prisma.dispatchCall.create({
      data: {
        line: EmergencyLine.POLICE_911,
        location,
        category: label,
        description: `${label} · Einheit ${callsign}${event.message ? ` · ${event.message}` : ""}`,
        priority: isPanic ? DispatchPriority.P1 : DispatchPriority.P2,
        alertKind: event.kind,
        officerId: user.id,
        x: event.x,
        y: event.y,
      },
    });

    // dedizierter Alarm (Banner/Ton) + normales created-Event (Board-Refetch)
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_ALERT, {
      call,
      kind: event.kind,
      callsign,
      location,
    });
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_CREATED, call);
    return { accepted: true, callNumber: call.number };
  }

  /**
   * Status-Code (10-Code) in-game setzen. Mappt code -> UnitStatus über die
   * StatusCode-Tabelle (category = Ziel-UnitStatus) und aktualisiert die Einheit.
   */
  async handleStatus(event: FiveMStatus) {
    const user = await this.resolveUser(event.identifier);
    if (!user) return { accepted: false, reason: "user_not_linked" };
    const member = await this.resolveUnitMember(user.id);
    if (!member) return { accepted: false, reason: "no_unit" };

    const sc = await this.prisma.statusCode.findUnique({ where: { code: event.code } });
    const valid = Object.values(UnitStatus) as string[];
    if (!sc?.category || !valid.includes(sc.category)) {
      return { accepted: false, reason: "unknown_code" };
    }
    const target = sc.category as UnitStatus;

    const unit = await this.prisma.unit.update({
      where: { id: member.unitId },
      data: { status: target },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.UNIT_STATUS, { unitId: unit.id, status: target });
    return { accepted: true, status: target };
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
