import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  type CreateVehicle,
  type CreateVehicleActivity,
} from "@aktensystem/shared";

/** Fahrzeugregister: Halter, Kennzeichen, Status (gestohlen/beschlagnahmt). */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(q?: string) {
    return this.prisma.vehicle.findMany({
      where: q
        ? {
            // MySQL-Collation ist bereits case-insensitive
            OR: [{ plate: { contains: q } }, { model: { contains: q } }],
          }
        : undefined,
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async get(id: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { owner: true, registration: true, insurance: true },
    });
    if (!v) throw new NotFoundException("Fahrzeug nicht gefunden");
    return v;
  }

  /** Kennzeichen-Abfrage (Streifen-Check): Halter + aktive BOLOs + Aktivitäten. */
  async getByPlate(plate: string) {
    const key = plate.toUpperCase();
    const v = await this.prisma.vehicle.findUnique({
      where: { plate: key },
      include: {
        owner: true,
        registration: true,
        insurance: true,
        activities: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!v) throw new NotFoundException("Fahrzeug nicht gefunden");
    const bolos = await this.prisma.bolo.findMany({
      where: { plate: key, active: true },
      orderBy: { createdAt: "desc" },
    });
    return { ...v, bolos };
  }

  /** Aktivität / Halter-Check protokollieren (Kontrolle, Sichtung, Beschlagnahme …). */
  async addActivity(userId: string, vehicleId: string, dto: CreateVehicleActivity) {
    const exists = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!exists) throw new NotFoundException("Fahrzeug nicht gefunden");
    const activity = await this.prisma.vehicleActivity.create({
      data: {
        vehicleId,
        activityType: dto.activityType,
        location: dto.location,
        notes: dto.notes,
        byUserId: userId,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "VehicleActivity",
      subjectId: activity.id,
      after: activity,
    });
    return activity;
  }

  async create(userId: string, dto: CreateVehicle) {
    const created = await this.prisma.vehicle.create({
      data: {
        plate: dto.plate.toUpperCase(),
        model: dto.model,
        color: dto.color,
        ownerId: dto.ownerId,
        stolen: dto.stolen ?? false,
        impounded: dto.impounded ?? false,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Vehicle",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async update(userId: string, id: string, patch: Partial<CreateVehicle>) {
    const before = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Fahrzeug nicht gefunden");
    const after = await this.prisma.vehicle.update({
      where: { id },
      data: {
        model: patch.model,
        color: patch.color,
        ownerId: patch.ownerId,
        stolen: patch.stolen,
        impounded: patch.impounded,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Vehicle",
      subjectId: id,
      before,
      after,
    });
    return after;
  }
}
