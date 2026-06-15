import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ShiftType } from "@aktensystem/shared";

/**
 * Dienstzeiterfassung. Mit FiveM-Bridge verdrahtet: OnDuty -> startDuty,
 * OffDuty -> endDuty, Disconnect -> autoClose. Zusätzlich Statistik-Aggregate.
 */
@Injectable()
export class WorkforceService {
  constructor(private readonly prisma: PrismaService) {}

  async startDuty(
    userId: string,
    factionId: string,
    rankName?: string,
    shiftType: ShiftType = ShiftType.FRUEH,
  ) {
    const open = await this.prisma.shiftLog.findFirst({
      where: { userId, endedAt: null },
    });
    if (open) return open; // bereits im Dienst
    return this.prisma.shiftLog.create({
      data: { userId, factionId, rankName, shiftType },
    });
  }

  async endDuty(userId: string, autoClosed = false) {
    const open = await this.prisma.shiftLog.findFirst({
      where: { userId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (!open) return null;
    const endedAt = new Date();
    const durationSec = Math.max(
      0,
      Math.floor((endedAt.getTime() - open.startedAt.getTime()) / 1000),
    );
    return this.prisma.shiftLog.update({
      where: { id: open.id },
      data: { endedAt, durationSec, autoClosed },
    });
  }

  /** Aggregierte Dienststunden ab Stichtag, optional pro Fraktion. */
  async stats(since: Date, factionId?: string) {
    const logs = await this.prisma.shiftLog.findMany({
      where: {
        factionId,
        startedAt: { gte: since },
        durationSec: { not: null },
      },
      select: { userId: true, factionId: true, durationSec: true },
    });

    const byUser = new Map<string, number>();
    const byFaction = new Map<string, number>();
    let total = 0;
    for (const l of logs) {
      const d = l.durationSec ?? 0;
      total += d;
      byUser.set(l.userId, (byUser.get(l.userId) ?? 0) + d);
      byFaction.set(l.factionId, (byFaction.get(l.factionId) ?? 0) + d);
    }

    const topActive = [...byUser.entries()]
      .map(([uid, sec]) => ({ userId: uid, seconds: sec }))
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10);

    return {
      since,
      totalSeconds: total,
      avgSecondsPerUser: byUser.size ? Math.round(total / byUser.size) : 0,
      topActive,
      perFaction: [...byFaction.entries()].map(([fid, sec]) => ({
        factionId: fid,
        seconds: sec,
      })),
    };
  }
}
