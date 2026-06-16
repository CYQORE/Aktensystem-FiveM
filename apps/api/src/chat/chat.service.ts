import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { ActorService } from "../rbac/actor.service.js";

/**
 * LEO-Chat (interner Behörden-Chat). Kanäle: "GLOBAL" (alle) + eigene Fraktion.
 * Senden/Lesen prüft Kanalzugriff; neue Nachrichten werden live an die
 * Kanal-Abonnenten gepusht (RealtimeGateway-Room chat:<channel>).
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly actor: ActorService,
  ) {}

  /** Kanäle, die der Nutzer sehen darf (Global + eigene Fraktion). */
  async accessibleChannels(userId: string) {
    const ctx = await this.actor.buildContext(userId);
    const channels = [{ key: "GLOBAL", label: "Global" }];
    if (ctx.factionId) {
      const faction = await this.prisma.faction.findUnique({
        where: { id: ctx.factionId },
        select: { shortName: true, name: true },
      });
      channels.push({ key: ctx.factionId, label: faction?.shortName ?? faction?.name ?? "Fraktion" });
    }
    return channels;
  }

  private async assertAccess(userId: string, channel: string) {
    if (channel === "GLOBAL") return;
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && ctx.factionId !== channel) {
      throw new ForbiddenException("Kein Zugriff auf diesen Kanal");
    }
  }

  async list(userId: string, channel: string) {
    await this.assertAccess(userId, channel);
    const msgs = await this.prisma.chatMessage.findMany({
      where: { channel },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return msgs.reverse(); // aufsteigend für die Anzeige
  }

  async send(userId: string, channel: string, body: string) {
    await this.assertAccess(userId, channel);
    const senderName = await this.resolveName(userId);
    const msg = await this.prisma.chatMessage.create({
      data: { channel, senderId: userId, senderName, body },
    });
    this.realtime.broadcastChat(channel, msg);
    return msg;
  }

  /** Anzeigename: "Callsign · Name" wenn Callsign vorhanden. */
  private async resolveName(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        globalName: true,
        username: true,
        memberships: { where: { isActive: true }, select: { callsign: true }, take: 1 },
      },
    });
    const base = user?.globalName ?? user?.username ?? "Unbekannt";
    const callsign = user?.memberships[0]?.callsign;
    return callsign ? `${callsign} · ${base}` : base;
  }
}
