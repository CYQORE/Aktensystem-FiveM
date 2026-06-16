import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "./storage.service.js";
import { AuditService } from "../audit/audit.service.js";
import { ActorService } from "../rbac/actor.service.js";
import { CaseFileAccessService } from "../rbac/casefile-access.service.js";
import { AuditAction } from "@aktensystem/shared";

export interface UploadInput {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
    private readonly actor: ActorService,
    private readonly access: CaseFileAccessService,
  ) {}

  /**
   * Lesezugriff auf ein Dokument prüfen: an die Akten-Zugriffsregel gekoppelt
   * (Fraktion + Sicherheitsstufe + Freigaben). Lose Dokumente nur Admin.
   */
  private async assertCanReadDoc(userId: string, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { caseFile: { select: { id: true, ownerFactionId: true, securityLevelRank: true } } },
    });
    if (!doc) throw new NotFoundException("Dokument nicht gefunden");
    const ctx = await this.actor.buildContext(userId);
    if (ctx.isPlatformAdmin) return doc;
    if (!doc.caseFile) throw new ForbiddenException("Kein Zugriff auf dieses Dokument");
    if (!(await this.access.canRead(ctx, doc.caseFile))) {
      throw new ForbiddenException("Kein Zugriff auf dieses Dokument");
    }
    return doc;
  }

  /** Schreibzugriff auf eine Ziel-Akte prüfen (nicht schwächer als Lesen). */
  private async assertCaseFileAccess(userId: string, caseFileId: string) {
    const file = await this.prisma.caseFile.findUnique({
      where: { id: caseFileId },
      select: { id: true, ownerFactionId: true, securityLevelRank: true },
    });
    if (!file) throw new NotFoundException("Akte nicht gefunden");
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && !(await this.access.canRead(ctx, file))) {
      throw new ForbiddenException("Kein Zugriff auf diese Akte");
    }
  }

  async upload(userId: string, caseFileId: string | undefined, file: UploadInput) {
    // An eine Akte hängen nur, wenn der Nutzer Zugriff auf diese Akte hat.
    if (caseFileId) await this.assertCaseFileAccess(userId, caseFileId);
    const key = `${caseFileId ?? "loose"}/${randomUUID()}-${file.originalname}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    const doc = await this.prisma.document.create({
      data: {
        caseFileId,
        filename: file.originalname,
        mimeType: file.mimetype,
        storageRef: key,
        size: file.size,
        uploadedById: userId,
      },
    });
    await this.audit.record({
      userId,
      action: AuditAction.CREATE,
      subjectType: "Document",
      subjectId: doc.id,
      after: { filename: doc.filename, size: doc.size },
    });
    return doc;
  }

  /** Neue Version eines bestehenden Dokuments anlegen (nur mit Zugriff auf die Akte). */
  async addVersion(userId: string, documentId: string, file: UploadInput) {
    const doc = await this.assertCanReadDoc(userId, documentId);
    const version = doc.version + 1;
    const key = `${doc.caseFileId ?? "loose"}/${randomUUID()}-v${version}-${file.originalname}`;
    await this.storage.put(key, file.buffer, file.mimetype);
    await this.prisma.documentVersion.create({
      data: { documentId, version, storageRef: key, size: file.size, uploadedById: userId },
    });
    return this.prisma.document.update({
      where: { id: documentId },
      data: { version, storageRef: key, size: file.size },
    });
  }

  async downloadUrl(userId: string, id: string) {
    const doc = await this.assertCanReadDoc(userId, id);
    return { url: await this.storage.presignedGet(doc.storageRef), filename: doc.filename };
  }

  /** Datei durch die API streamen (browser-tauglich, kein interner MinIO-Host). */
  async raw(userId: string, id: string) {
    const doc = await this.assertCanReadDoc(userId, id);
    return {
      stream: await this.storage.getStream(doc.storageRef),
      filename: doc.filename,
      mimeType: doc.mimeType,
    };
  }

  /** Dokumente einer Akte — nur wenn die Akte lesbar ist. */
  async listForCaseFile(userId: string, caseFileId: string) {
    const file = await this.prisma.caseFile.findUnique({
      where: { id: caseFileId },
      select: { id: true, ownerFactionId: true, securityLevelRank: true },
    });
    if (!file) return [];
    const ctx = await this.actor.buildContext(userId);
    if (!ctx.isPlatformAdmin && !(await this.access.canRead(ctx, file))) {
      throw new ForbiddenException("Kein Zugriff auf diese Akte");
    }
    return this.prisma.document.findMany({ where: { caseFileId } });
  }
}
