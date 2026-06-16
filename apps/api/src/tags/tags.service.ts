import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@aktensystem/database";
import { PrismaService } from "../prisma/prisma.service.js";
import { ActorService } from "../rbac/actor.service.js";
import type { CreateTag } from "@aktensystem/shared";

/** Tags/Flags zur Markierung von Bürgern (z. B. "Bewaffnet", "Informant"). */
@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly actor: ActorService,
  ) {}

  list() {
    return this.prisma.tag.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  }

  async create(userId: string, dto: CreateTag) {
    const ctx = await this.actor.buildContext(userId);
    const factionId = ctx.factionId ?? null;

    // MySQL behandelt NULL in UNIQUE als distinkt -> globale Tags (factionId=null)
    // würden sonst dupliziert. Daher explizite Existenzprüfung.
    const existing = await this.prisma.tag.findFirst({ where: { name: dto.name, factionId } });
    if (existing) throw new ConflictException("Tag mit diesem Namen existiert bereits");

    try {
      return await this.prisma.tag.create({
        data: {
          name: dto.name,
          color: dto.color,
          category: dto.category,
          factionId: factionId ?? undefined,
        },
      });
    } catch (e) {
      // Race auf die UNIQUE-Bedingung -> sauberes 409 statt 500.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        throw new ConflictException("Tag mit diesem Namen existiert bereits");
      }
      throw e;
    }
  }

  async remove(id: string) {
    await this.prisma.tag.delete({ where: { id } }).catch(() => {
      throw new NotFoundException("Tag nicht gefunden");
    });
    return { ok: true };
  }

  /** Tag einem Bürger zuordnen (idempotent). */
  async attach(userId: string, citizenId: string, tagId: string) {
    try {
      await this.prisma.citizenTag.upsert({
        where: { citizenId_tagId: { citizenId, tagId } },
        update: {},
        create: { citizenId, tagId, byUserId: userId },
      });
    } catch (e) {
      // unbekanntes Tag/Bürger (FK) -> 404 statt 500.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
        throw new NotFoundException("Tag oder Bürger nicht gefunden");
      }
      throw e;
    }
    return this.prisma.citizenTag.findMany({
      where: { citizenId },
      include: { tag: true },
    });
  }

  async detach(userId: string, citizenId: string, tagId: string) {
    // Fraktionsgebundenes Tag darf nur die eigene Fraktion (oder Admin) entfernen.
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (tag?.factionId) {
      const ctx = await this.actor.buildContext(userId);
      if (!ctx.isPlatformAdmin && tag.factionId !== ctx.factionId) {
        throw new ForbiddenException("Tag gehört zu einer anderen Fraktion");
      }
    }
    const res = await this.prisma.citizenTag.deleteMany({ where: { citizenId, tagId } });
    return { ok: res.count > 0 };
  }
}
