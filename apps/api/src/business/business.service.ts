import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { AuditService } from "../audit/audit.service.js";
import {
  AuditAction,
  type CreateBusiness,
  type AddBusinessEmployee,
  type AddMenuItem,
} from "@aktensystem/shared";

/** Unternehmensregister: Firmen, Mitarbeiter, Menü/Produkte. */
@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(q?: string) {
    return this.prisma.business.findMany({
      where: q ? { name: { contains: q } } : undefined,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async get(id: string) {
    const b = await this.prisma.business.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        employees: { include: { citizen: { select: { id: true, firstName: true, lastName: true } } } },
        menuItems: { orderBy: { name: "asc" } },
      },
    });
    if (!b) throw new NotFoundException("Unternehmen nicht gefunden");
    return b;
  }

  async create(userId: string, dto: CreateBusiness) {
    const created = await this.prisma.business.create({
      data: { name: dto.name, type: dto.type as never, ownerId: dto.ownerId, address: dto.address },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Business",
      subjectId: created.id,
      after: created,
    });
    return created;
  }

  async update(userId: string, id: string, patch: Partial<CreateBusiness>) {
    const before = await this.prisma.business.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Unternehmen nicht gefunden");
    const after = await this.prisma.business.update({
      where: { id },
      data: { name: patch.name, type: patch.type as never, ownerId: patch.ownerId, address: patch.address },
    });
    await this.audit.record({
      userId,
      action: AuditAction.UPDATE,
      subjectType: "Business",
      subjectId: id,
      before,
      after,
    });
    return after;
  }

  async addEmployee(id: string, dto: AddBusinessEmployee) {
    await this.prisma.businessEmployee.upsert({
      where: { businessId_citizenId: { businessId: id, citizenId: dto.citizenId } },
      update: { role: dto.role, wage: dto.wage },
      create: { businessId: id, citizenId: dto.citizenId, role: dto.role, wage: dto.wage },
    });
    return this.get(id);
  }

  async removeEmployee(id: string, employeeId: string) {
    await this.prisma.businessEmployee.deleteMany({ where: { id: employeeId, businessId: id } });
    return { ok: true };
  }

  async addMenuItem(id: string, dto: AddMenuItem) {
    await this.prisma.menuItem.create({
      data: { businessId: id, name: dto.name, price: dto.price, category: dto.category },
    });
    return this.get(id);
  }

  async removeMenuItem(id: string, itemId: string) {
    await this.prisma.menuItem.deleteMany({ where: { id: itemId, businessId: id } });
    return { ok: true };
  }
}
