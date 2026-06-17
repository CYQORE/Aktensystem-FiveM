import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@aktensystem/database";
import { PrismaService } from "../prisma/prisma.service.js";

/** Eine Bürger-Zeile, wie sie aus der ESX-`users`-Tabelle kommt (roh). */
export interface CitizenSyncRow {
  identifier: string;
  firstname?: string | null;
  lastname?: string | null;
  dateofbirth?: string | null;
  sex?: string | null;
  phone_number?: string | null;
  p_image?: string | null;
}

/**
 * Eine Fahrzeug-Zeile. Direkt-Sync liefert das rohe `vehicle`-JSON; die
 * Lua-Bridge liefert bereits den ausgelesenen `model`-Namen (kleiner Payload).
 */
export interface VehicleSyncRow {
  owner?: string | null;
  plate?: string | null;
  vehicle?: string | null;
  model?: string | null;
}

/**
 * Server-Sync: spiegelt Spieler (`users`) und Fahrzeuge (`owned_vehicles`) der
 * FiveM-Game-Datenbank in das Bürger- und Fahrzeugregister.
 *
 * Zwei Quellen, gleiche Upsert-Logik:
 *  - `sync()` liest direkt per Raw-SQL — nur wenn S6mdt AUF der Game-DB läuft.
 *  - Die FiveM-Bridge (`/fivem/sync/*`) liefert die Zeilen per HTTPS-POST,
 *    wenn Game-Server und S6mdt auf getrennten Maschinen laufen.
 *
 * Wichtig: der Sync ist **nicht-destruktiv** (fill-if-empty). Er befüllt nur
 * leere Register-Felder; manuell gepflegte Werte (Foto, korrigierte Namen,
 * Telefon) bleiben bei jedem erneuten Lauf erhalten.
 */
@Injectable()
export class ServerSyncService {
  private readonly logger = new Logger(ServerSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Direkt-Sync per Raw-SQL (S6mdt muss auf der Game-DB laufen). */
  async sync() {
    const citizens = await this.upsertCitizens(await this.readCitizens());
    const vehicles = await this.upsertVehicles(await this.readVehicles());
    return { ok: true, citizens, vehicles };
  }

  // ---- Raw-SQL-Lesen (nur Direkt-Sync) ----

  private async readCitizens(): Promise<CitizenSyncRow[]> {
    try {
      return await this.prisma.$queryRawUnsafe<CitizenSyncRow[]>(
        `SELECT identifier, firstname, lastname, dateofbirth, sex, phone_number, p_image
         FROM users
         WHERE firstname IS NOT NULL AND firstname <> ''
         ORDER BY identifier
         LIMIT 10000`,
      );
    } catch (e) {
      throw new Error(
        `Konnte 'users' nicht lesen — läuft S6mdt auf der Game-DB? (${(e as Error).message})`,
      );
    }
  }

  private async readVehicles(): Promise<VehicleSyncRow[]> {
    try {
      return await this.prisma.$queryRawUnsafe<VehicleSyncRow[]>(
        `SELECT owner, plate, vehicle FROM owned_vehicles ORDER BY plate LIMIT 50000`,
      );
    } catch (e) {
      throw new Error(`Konnte 'owned_vehicles' nicht lesen (${(e as Error).message})`);
    }
  }

  // ---- Upsert (von Direkt-Sync UND Bridge geteilt) ----

  /**
   * ESX `users` -> Bürgerregister (Schlüssel: fivemCharId = identifier).
   * Fill-if-empty: neue Bürger werden voll angelegt, bestehende nur in leeren
   * Feldern ergänzt — manuelle Korrekturen werden nie überschrieben.
   */
  async upsertCitizens(rows: CitizenSyncRow[]): Promise<number> {
    const idents = [...new Set(rows.map((r) => r.identifier).filter(Boolean))];
    if (idents.length === 0) return 0;

    const existing = await this.prisma.citizen.findMany({
      where: { fivemCharId: { in: idents } },
      select: {
        fivemCharId: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        photo: true,
      },
    });
    const byId = new Map(existing.map((c) => [c.fivemCharId as string, c]));

    let count = 0;
    for (const r of rows) {
      if (!r.identifier) continue;
      const firstName = r.firstname?.trim() || undefined;
      const lastName = r.lastname?.trim() || undefined;
      const dob = this.parseDob(r.dateofbirth);
      const gender = this.mapGender(r.sex);
      const phone = r.phone_number?.trim() || undefined;
      const photo = this.cleanPhoto(r.p_image);
      const cur = byId.get(r.identifier);
      try {
        if (!cur) {
          await this.prisma.citizen.create({
            data: {
              fivemCharId: r.identifier,
              firstName: firstName ?? "Unbekannt",
              lastName: lastName ?? "",
              dateOfBirth: dob,
              gender,
              phone,
              photo,
            },
          });
        } else {
          const data: Prisma.CitizenUpdateInput = {};
          if ((this.blank(cur.firstName) || cur.firstName === "Unbekannt") && firstName) {
            data.firstName = firstName;
          }
          if (this.blank(cur.lastName) && lastName) data.lastName = lastName;
          if (!cur.dateOfBirth && dob) data.dateOfBirth = dob;
          if (this.blank(cur.gender) && gender) data.gender = gender;
          if (this.blank(cur.phone) && phone) data.phone = phone;
          if (this.blank(cur.photo) && photo) data.photo = photo;
          if (Object.keys(data).length > 0) {
            await this.prisma.citizen.update({ where: { fivemCharId: r.identifier }, data });
          }
        }
        count++;
      } catch (e) {
        this.logger.warn(`Bürger-Sync ${r.identifier}: ${(e as Error).message}`);
      }
    }
    return count;
  }

  /** ESX `owned_vehicles` -> Fahrzeugregister (Schlüssel: plate; Halter via identifier). */
  async upsertVehicles(rows: VehicleSyncRow[]): Promise<number> {
    // identifier -> Citizen.id einmal auflösen (nicht pro Fahrzeug)
    const citizens = await this.prisma.citizen.findMany({
      where: { fivemCharId: { not: null } },
      select: { id: true, fivemCharId: true },
    });
    const byIdent = new Map(citizens.map((c) => [c.fivemCharId as string, c.id]));

    let count = 0;
    let unresolved = 0;
    for (const r of rows) {
      const plate = (r.plate ?? "").trim().toUpperCase();
      if (!plate) continue;
      let ownerId: string | undefined;
      if (r.owner) {
        ownerId = byIdent.get(r.owner);
        if (!ownerId) unresolved++;
      }
      const model = r.model?.trim() || this.vehicleModel(r.vehicle ?? null) || undefined;
      try {
        await this.prisma.vehicle.upsert({
          where: { plate },
          update: { ownerId, model },
          create: { plate, ownerId, model },
        });
        count++;
      } catch (e) {
        this.logger.warn(`Fahrzeug-Sync ${plate}: ${(e as Error).message}`);
      }
    }
    if (unresolved > 0) {
      this.logger.warn(
        `${unresolved} Fahrzeuge ohne auflösbaren Halter (Spieler nicht als Bürger importiert).`,
      );
    }
    return count;
  }

  // ---- Helfer ----

  private blank(v?: string | null): boolean {
    return !v || v.trim() === "";
  }

  /** ESX speichert dateofbirth meist als DD/MM/YYYY; sonst ISO-Fallback. */
  private parseDob(raw?: string | null): Date | undefined {
    if (!raw) return undefined;
    const s = raw.trim();
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    const d = m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }

  private mapGender(sex?: string | null): string | undefined {
    const s = (sex ?? "").trim().toLowerCase();
    if (s === "m" || s === "male" || s === "männlich") return "männlich";
    if (s === "f" || s === "w" || s === "female" || s === "weiblich") return "weiblich";
    return undefined; // unbekannte Codes nicht roh ins Register schreiben
  }

  /** Nur http(s)-URLs oder image-Data-URLs zulassen (kein beliebiger Müll). */
  private cleanPhoto(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const s = raw.trim();
    return /^(https?:\/\/|data:image\/)/i.test(s) ? s : undefined;
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
