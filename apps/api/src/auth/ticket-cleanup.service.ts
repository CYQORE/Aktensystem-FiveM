import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service.js";

/** Entfernt abgelaufene/benutzte AuthTickets (verhindert Tabellen-Bloat). */
@Injectable()
export class TicketCleanupService {
  private readonly logger = new Logger(TicketCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async purge() {
    const res = await this.prisma.authTicket.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    if (res.count > 0) {
      this.logger.debug(`${res.count} abgelaufene/benutzte AuthTickets entfernt`);
    }
  }
}
