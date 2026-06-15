import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
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
  ) {}

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

  async assignUnit(callId: string, unitId: string) {
    const call = await this.prisma.dispatchCall.findUnique({ where: { id: callId } });
    if (!call) throw new NotFoundException("Einsatz nicht gefunden");
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

  async setUnitStatus(unitId: string, status: UnitStatus) {
    const unit = await this.prisma.unit.update({
      where: { id: unitId },
      data: { status },
    });
    this.realtime.broadcastDispatch(WS_EVENTS.UNIT_STATUS, { unitId, status });
    return unit;
  }
}
