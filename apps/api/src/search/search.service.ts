import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ActorService } from "../rbac/actor.service.js";
import { CaseFileAccessService } from "../rbac/casefile-access.service.js";

export interface SearchHit {
  type: "citizen" | "vehicle" | "warrant" | "casefile" | "bolo";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

/**
 * Globale Suche über die wichtigsten Register (Bürger, Fahrzeuge, Haftbefehle,
 * Akten, Fahndungen) — speist die Command-Palette (Strg+K).
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actor: ActorService,
    private readonly access: CaseFileAccessService,
  ) {}

  async search(userId: string, q: string): Promise<SearchHit[]> {
    const term = q.trim().slice(0, 100); // Suchbegriff begrenzen
    if (term.length < 2) return [];

    // Akten nur im Rahmen der eigenen Lese-Rechte (Fraktion + Clearance + Freigaben).
    const ctx = await this.actor.buildContext(userId);
    const caseFileAccess = await this.access.readableWhere(ctx);

    const [citizens, vehicles, warrants, caseFiles, bolos] = await Promise.all([
      this.prisma.citizen.findMany({
        where: {
          OR: [
            { firstName: { contains: term } },
            { lastName: { contains: term } },
            { phone: { contains: term } },
            { fivemCharId: { contains: term } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, phone: true },
        take: 6,
      }),
      this.prisma.vehicle.findMany({
        where: { OR: [{ plate: { contains: term } }, { model: { contains: term } }] },
        select: { id: true, plate: true, model: true, owner: { select: { firstName: true, lastName: true } } },
        take: 6,
      }),
      this.prisma.warrant.findMany({
        where: {
          status: "ACTIVE",
          OR: [{ title: { contains: term } }, { reason: { contains: term } }],
        },
        select: { id: true, title: true, citizen: { select: { firstName: true, lastName: true } } },
        take: 6,
      }),
      this.prisma.caseFile.findMany({
        where: { AND: [{ title: { contains: term } }, caseFileAccess] },
        select: { id: true, title: true, type: true },
        take: 6,
      }),
      this.prisma.bolo.findMany({
        where: { active: true, OR: [{ title: { contains: term } }, { plate: { contains: term } }] },
        select: { id: true, title: true, plate: true },
        take: 6,
      }),
    ]);

    const hits: SearchHit[] = [];
    for (const c of citizens) {
      hits.push({
        type: "citizen",
        id: c.id,
        label: `${c.lastName}, ${c.firstName}`,
        sublabel: c.phone ? `Tel: ${c.phone}` : "Bürger",
        href: `/citizens/${c.id}`,
      });
    }
    for (const v of vehicles) {
      hits.push({
        type: "vehicle",
        id: v.id,
        label: v.plate,
        sublabel: [v.model, v.owner ? `${v.owner.lastName}, ${v.owner.firstName}` : null].filter(Boolean).join(" · ") || "Fahrzeug",
        href: `/vehicles?plate=${encodeURIComponent(v.plate)}`,
      });
    }
    for (const w of warrants) {
      hits.push({
        type: "warrant",
        id: w.id,
        label: w.title ?? "Haftbefehl",
        sublabel: w.citizen ? `${w.citizen.lastName}, ${w.citizen.firstName}` : "Haftbefehl",
        href: `/haftbefehle`,
      });
    }
    for (const f of caseFiles) {
      hits.push({ type: "casefile", id: f.id, label: f.title, sublabel: f.type, href: `/case-files/${f.id}` });
    }
    for (const b of bolos) {
      hits.push({ type: "bolo", id: b.id, label: b.title, sublabel: b.plate ? `🚗 ${b.plate}` : "Fahndung", href: `/fahndung` });
    }
    return hits;
  }
}
