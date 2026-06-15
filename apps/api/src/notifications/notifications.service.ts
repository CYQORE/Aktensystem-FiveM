import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { RealtimeGateway } from "../realtime/realtime.gateway.js";
import { WS_EVENTS, type NotificationType } from "@aktensystem/shared";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async notify(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    refType?: string;
    refId?: string;
  }) {
    const n = await this.prisma.notification.create({ data: input });
    this.realtime.broadcastDispatch(WS_EVENTS.NOTIFICATION, n);
    return n;
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { at: "desc" },
      take: 50,
    });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }
}
