import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service.js";
import { StorageService } from "./storage.service.js";
import { AuditService } from "../audit/audit.service.js";
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
  ) {}

  async upload(userId: string, caseFileId: string | undefined, file: UploadInput) {
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

  /** Neue Version eines bestehenden Dokuments anlegen. */
  async addVersion(userId: string, documentId: string, file: UploadInput) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException("Dokument nicht gefunden");
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

  async downloadUrl(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Dokument nicht gefunden");
    return { url: await this.storage.presignedGet(doc.storageRef), filename: doc.filename };
  }

  listForCaseFile(caseFileId: string) {
    return this.prisma.document.findMany({ where: { caseFileId } });
  }
}
