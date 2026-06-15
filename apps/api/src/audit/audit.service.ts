import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuditAction } from "@aktensystem/shared";

export interface AuditEntry {
  userId?: string | null;
  factionId?: string | null;
  rankName?: string | null;
  action: AuditAction;
  subjectType: string;
  subjectId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Unveränderlicher, hash-verketteter Audit-Trail. Jede Zeile hasht ihren
 * Inhalt + den Hash der Vorzeile (prevHash). Manipulation bricht die Kette.
 *
 * Hinweis Prod-Härtung: für strikte Serialisierung der Kette eine Postgres-
 * Advisory-Lock um (read-last, insert) legen; hier vereinfacht.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    const last = await this.prisma.auditLog.findFirst({
      orderBy: { at: "desc" },
      select: { hash: true },
    });
    const prevHash = last?.hash ?? null;

    const canonical = JSON.stringify({
      userId: entry.userId ?? null,
      action: entry.action,
      subjectType: entry.subjectType,
      subjectId: entry.subjectId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      prevHash,
    });
    const hash = createHash("sha256").update(canonical).digest("hex");

    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        factionId: entry.factionId ?? null,
        rankName: entry.rankName ?? null,
        action: entry.action,
        subjectType: entry.subjectType,
        subjectId: entry.subjectId ?? null,
        before: entry.before == null ? undefined : (entry.before as object),
        after: entry.after == null ? undefined : (entry.after as object),
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        prevHash,
        hash,
      },
    });
  }

  /** Verifiziert die Integrität der Kette (Reihenfolge nach at). */
  async verifyChain(): Promise<{ ok: boolean; brokenAt?: string }> {
    const rows = await this.prisma.auditLog.findMany({ orderBy: { at: "asc" } });
    let prevHash: string | null = null;
    for (const r of rows) {
      const canonical: string = JSON.stringify({
        userId: r.userId,
        action: r.action,
        subjectType: r.subjectType,
        subjectId: r.subjectId,
        before: r.before ?? null,
        after: r.after ?? null,
        prevHash,
      });
      const expect: string = createHash("sha256").update(canonical).digest("hex");
      if (expect !== r.hash) return { ok: false, brokenAt: r.id };
      prevHash = r.hash;
    }
    return { ok: true };
  }
}
