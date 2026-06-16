import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { WS_EVENTS, type CreateRadioChannel } from "@aktensystem/shared";

/**
 * Funk-Kanäle. Web-Koordination: Kanäle + Roster (wer ist auf welchem Kanal).
 * Beitritt/Verlassen broadcastet das aktualisierte Roster. Der eigentliche
 * Voice-Sync in-game ist best-effort über die Lua-Resource (pma-voice o. Ä.).
 */
@Injectable()
export class RadioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  listChannels() {
    return this.prisma.radioChannel.findMany({
      include: { members: { orderBy: { joinedAt: "asc" } } },
      orderBy: { name: "asc" },
    });
  }

  create(dto: CreateRadioChannel) {
    return this.prisma.radioChannel.create({
      data: {
        name: dto.name,
        label: dto.label,
        factionId: dto.factionId,
        isPrivate: dto.isPrivate,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.radioChannel.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("Funkkanal nicht gefunden");
    });
    this.realtime.broadcastDispatch(WS_EVENTS.RADIO_ROSTER, { channelId: id, removed: true });
    return { ok: true };
  }

  /** Kanal beitreten. Verlässt automatisch andere Kanäle (ein aktiver Kanal je Nutzer). */
  async join(userId: string, channelId: string) {
    const channel = await this.prisma.radioChannel.findUnique({ where: { id: channelId } });
    if (!channel) throw new NotFoundException("Funkkanal nicht gefunden");

    const member = await this.prisma.unitMember.findFirst({
      where: { userId },
      orderBy: [{ isLead: "desc" }, { unit: { createdAt: "asc" } }],
      include: { unit: { select: { callsign: true } } },
    });
    const callsign = member?.unit?.callsign;

    // andere Kanäle verlassen + beitreten atomar (Invariante: genau ein aktiver Kanal)
    await this.prisma.$transaction(async (tx) => {
      await tx.radioMember.deleteMany({
        where: { userId, channelId: { not: channelId } },
      });
      await tx.radioMember.upsert({
        where: { channelId_userId: { channelId, userId } },
        update: { callsign },
        create: { channelId, userId, callsign },
      });
    });

    this.realtime.broadcastDispatch(WS_EVENTS.RADIO_ROSTER, { channelId });
    return this.listChannels();
  }

  async leave(userId: string, channelId: string) {
    await this.prisma.radioMember.deleteMany({ where: { userId, channelId } });
    this.realtime.broadcastDispatch(WS_EVENTS.RADIO_ROSTER, { channelId });
    return this.listChannels();
  }
}
