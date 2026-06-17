import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

/**
 * Server-Sync: zieht Spieler (users) und Fahrzeuge (owned_vehicles) aus der
 * FiveM-Game-Datenbank und spiegelt sie in das Bürger- und Fahrzeugregister.
 *
 * Voraussetzung: S6mdt läuft auf DERSELBEN Datenbank wie der Game-Server
 * (DATABASE_URL = esxlegacy_e28cce). Dann liegen `users`/`owned_vehicles`
 * neben den `s6mdt_*`-Tabellen und werden per Raw-SQL gelesen.
 */
@Injectable()
export class ServerSyncService {
  private readonly logger = new Logger(ServerSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sync() {
    const citizens = await this.syncCitizens();
    const vehicles = await this.syncVehicles();
    return { ok: true, citizens, vehicles };
  }

  /** ESX `users` -> Bürgerregister (Schlüssel: fivemCharId = identifier). */
  private async syncCitizens() {
    let rows: Array<{
      identifier: string;
      firstname: string | null;
      lastname: string | null;
      dateofbirth: string | null;
      sex: string | null;
      phone_number: string | null;
      p_image: string | null;
    }>;
    try {
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT identifier, firstname, lastname, dateofbirth, sex, phone_number, p_image
         FROM users
         WHERE firstname IS NOT NULL AND firstname <> ''
         LIMIT 10000`,
      );
    } catch (e) {
      throw new Error(
        `Konnte 'users' nicht lesen — läuft S6mdt auf der Game-DB? (${(e as Error).message})`,
      );
    }

    let count = 0;
    for (const r of rows) {
      if (!r.identifier) continue;
      const dob = r.dateofbirth ? new Date(r.dateofbirth) : null;
      const gender = r.sex === "m" ? "männlich" : r.sex === "f" || r.sex === "w" ? "weiblich" : r.sex ?? undefined;
      await this.prisma.citizen
        .upsert({
          where: { fivemCharId: r.identifier },
          update: {
            firstName: r.firstname ?? undefined,
            lastName: r.lastname ?? undefined,
            dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : undefined,
            gender: gender || undefined,
            phone: r.phone_number ?? undefined,
            photo: r.p_image ?? undefined,
          },
          create: {
            fivemCharId: r.identifier,
            firstName: r.firstname ?? "Unbekannt",
            lastName: r.lastname ?? "",
            dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : undefined,
            gender: gender || undefined,
            phone: r.phone_number ?? undefined,
            photo: r.p_image ?? undefined,
          },
        })
        .then(() => count++)
        .catch((e) => this.logger.warn(`Bürger-Sync ${r.identifier}: ${(e as Error).message}`));
    }
    return count;
  }

  /** ESX `owned_vehicles` -> Fahrzeugregister (Schlüssel: plate; Halter via identifier). */
  private async syncVehicles() {
    let rows: Array<{ owner: string | null; plate: string | null; vehicle: string | null }>;
    try {
      rows = await this.prisma.$queryRawUnsafe(
        `SELECT owner, plate, vehicle FROM owned_vehicles LIMIT 50000`,
      );
    } catch (e) {
      throw new Error(`Konnte 'owned_vehicles' nicht lesen (${(e as Error).message})`);
    }

    // identifier -> Citizen.id auflösen (ein Lookup, nicht pro Fahrzeug)
    const citizens = await this.prisma.citizen.findMany({
      where: { fivemCharId: { not: null } },
      select: { id: true, fivemCharId: true },
    });
    const byIdent = new Map(citizens.map((c) => [c.fivemCharId as string, c.id]));

    let count = 0;
    for (const r of rows) {
      const plate = (r.plate ?? "").trim().toUpperCase();
      if (!plate) continue;
      const ownerId = r.owner ? byIdent.get(r.owner) : undefined;
      const model = this.vehicleModel(r.vehicle);
      await this.prisma.vehicle
        .upsert({
          where: { plate },
          update: { ownerId, model: model ?? undefined },
          create: { plate, ownerId, model: model ?? undefined },
        })
        .then(() => count++)
        .catch((e) => this.logger.warn(`Fahrzeug-Sync ${plate}: ${(e as Error).message}`));
    }
    return count;
  }

  /** Modellname aus dem vehicle-JSON ziehen (nur wenn Klartext, sonst null). */
  private vehicleModel(raw: string | null): string | null {
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as { model?: unknown };
      if (typeof v.model === "string" && v.model.trim() && !/^\d+$/.test(v.model)) {
        return v.model.slice(0, 60);
      }
    } catch {
      /* kein gültiges JSON */
    }
    return null;
  }
}
