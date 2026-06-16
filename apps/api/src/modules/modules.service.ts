import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { RegisterModule } from "@aktensystem/shared";

/** Kernmodule, die beim Boot registriert werden (idempotent). */
const CORE_MODULES = [
  { key: "dashboard", name: "Dashboard", icon: "▦", route: "/dashboard", category: "Übersicht", core: true, sortOrder: 10 },
  { key: "citizens", name: "Bürger", icon: "👤", route: "/citizens", category: "Akten & Justiz", core: true, sortOrder: 20 },
  { key: "case-files", name: "Akten", icon: "🗂", route: "/case-files", category: "Akten & Justiz", core: true, sortOrder: 21 },
  { key: "forensics", name: "Forensik", icon: "🔬", route: "/forensics", category: "Akten & Justiz", core: false, sortOrder: 22 },
  { key: "strafkatalog", name: "Strafkatalog", icon: "📕", route: "/strafkatalog", category: "Akten & Justiz", core: false, sortOrder: 23 },
  { key: "justice", name: "Gericht", icon: "⚖", route: "/justice", category: "Akten & Justiz", core: false, sortOrder: 24 },
  { key: "audit", name: "Audit-Trail", icon: "🛡", route: "/audit", category: "Akten & Justiz", core: true, sortOrder: 29 },
  { key: "vehicles", name: "Fahrzeuge", icon: "🚗", route: "/vehicles", category: "Register", core: false, sortOrder: 30 },
  { key: "dispatch", name: "Dispatch", icon: "🚨", route: "/dispatch", category: "Leitstelle / CAD", core: true, sortOrder: 40 },
  { key: "units", name: "Leitstellenblatt", icon: "📋", route: "/units", category: "Leitstelle / CAD", core: true, sortOrder: 41 },
  { key: "map", name: "Live-Karte", icon: "🗺", route: "/map", category: "Leitstelle / CAD", core: true, sortOrder: 42 },
  { key: "workforce", name: "Dienstzeit", icon: "⏱", route: "/workforce", category: "Personal", core: true, sortOrder: 50 },
  { key: "modules", name: "Module", icon: "🧩", route: "/modules", category: "Administration", core: true, sortOrder: 90 },
];

@Injectable()
export class ModulesService implements OnModuleInit {
  private readonly logger = new Logger(ModulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Kernmodule beim Boot registrieren (DB darf in Dev fehlen). */
  async onModuleInit() {
    try {
      for (const m of CORE_MODULES) {
        await this.prisma.platformModule.upsert({
          where: { key: m.key },
          // Name/Route/Kategorie nachziehen, aber `enabled` des Admins respektieren
          update: { name: m.name, icon: m.icon, route: m.route, category: m.category, core: m.core, sortOrder: m.sortOrder },
          create: m,
        });
      }
    } catch (err) {
      this.logger.warn(`Modul-Registry-Seed übersprungen: ${(err as Error).message}`);
    }
  }

  list() {
    return this.prisma.platformModule.findMany({ orderBy: { sortOrder: "asc" } });
  }

  /** Modul registrieren/aktualisieren (Admin). Ermöglicht neue Module im Betrieb. */
  register(dto: RegisterModule) {
    return this.prisma.platformModule.upsert({
      where: { key: dto.key },
      update: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        route: dto.route,
        category: dto.category,
        sortOrder: dto.sortOrder ?? 100,
        version: dto.version ?? "1.0.0",
      },
      create: {
        key: dto.key,
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        route: dto.route,
        category: dto.category,
        sortOrder: dto.sortOrder ?? 100,
        version: dto.version ?? "1.0.0",
      },
    });
  }

  /** Modul an-/ausschalten (Admin). Kernmodule bleiben aktiv. */
  async setEnabled(key: string, enabled: boolean) {
    const mod = await this.prisma.platformModule.findUnique({ where: { key } });
    if (mod?.core && !enabled) {
      return mod; // Kernmodul kann nicht deaktiviert werden
    }
    return this.prisma.platformModule.update({ where: { key }, data: { enabled } });
  }
}
