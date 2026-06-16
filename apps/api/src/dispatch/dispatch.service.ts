import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { ActorService } from "../rbac/actor.service.js";
import {
  WS_EVENTS,
  DispatchStatus,
  UnitStatus,
  type CreateDispatchCall,
} from "@aktensystem/shared";

@Injectable()
export class DispatchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly actor: ActorService,
  ) {}

  /** Fraktions-Zugehörigkeit einer Einheit prüfen (Admin darf alles). */
  private async assertSameFaction(userId: string, unitId: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundException("Einheit nicht gefunden");
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && unit.factionId !== ctx.factionId) {
      throw new ForbiddenException("Einheit gehört zu einer anderen Fraktion");
    }
    return unit;
  }

  async createCall(dto: CreateDispatchCall) {
    const call = await this.prisma.dispatchCall.create({ data: dto });
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_CREATED, call);
    return call;
  }

  listCalls() {
    return this.prisma.dispatchCall.findMany({
      where: { status: { not: DispatchStatus.ABGESCHLOSSEN } },
      include: { assignments: { include: { unit: true } }, notes: true },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  async assignUnit(userId: string, callId: string, unitId: string) {
    const call = await this.prisma.dispatchCall.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException("Einsatz nicht gefunden");
    await this.assertSameFaction(userId, unitId);
    const assignment = await this.prisma.unitAssignment.upsert({
      where: { callId_unitId: { callId, unitId } },
      update: { clearedAt: null },
      create: { callId, unitId },
    });
    await this.prisma.dispatchCall.update({
      where: { id: callId },
      data: { status: DispatchStatus.DISPATCHED },
    });
    await this.prisma.unit.update({
      where: { id: unitId },
      data: { status: UnitStatus.EINSATZ },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_ASSIGNED, { callId, unitId });
    return assignment;
  }

  async updateCallStatus(callId: string, status: DispatchStatus) {
    const call = await this.prisma.dispatchCall.update({
      where: { id: callId },
      data: {
        status,
        closedAt: status === DispatchStatus.ABGESCHLOSSEN ? new Date() : undefined,
      },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.DISPATCH_UPDATED, call);
    return call;
  }

  listUnits() {
    return this.prisma.unit.findMany({
      include: { members: true, faction: { select: { shortName: true, color: true } } },
      orderBy: { callsign: "asc" },
    });
  }

  async setUnitStatus(userId: string, unitId: string, status: UnitStatus) {
    await this.assertSameFaction(userId, unitId);
    const unit = await this.prisma.unit.update({
      where: { id: unitId },
      data: { status },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.UNIT_STATUS, { unitId, status });
    return unit;
  }

  /** 10-Code-Referenz (Funk-/Statuscodes). */
  listStatusCodes() {
    return this.prisma.statusCode.findMany({ orderBy: { code: "asc" } });
  }
}
