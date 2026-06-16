import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import type { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { DocumentsService, type UploadInput } from "./documents.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post("upload")
  @CheckPolicies({ action: "create", subject: "Document" })
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUserId() userId: string,
    @UploadedFile() file: UploadInput,
    @Query("caseFileId") caseFileId?: string,
  ) {
    return this.service.upload(userId, caseFileId, file);
  }

  @Post(":id/version")
  @CheckPolicies({ action: "update", subject: "Document" })
  @UseInterceptors(FileInterceptor("file"))
  addVersion(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @UploadedFile() file: UploadInput,
  ) {
    return this.service.addVersion(userId, id, file);
  }

  @Get(":id/download")
  @CheckPolicies({ action: "read", subject: "Document" })
  download(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.downloadUrl(userId, id);
  }

  /** Datei direkt durch die API streamen (Frontend lädt via authentifiziertem fetch). */
  @Get(":id/raw")
  @CheckPolicies({ action: "read", subject: "Document" })
  async raw(@CurrentUserId() userId: string, @Param("id") id: string, @Res() res: Response) {
    const { stream, filename, mimeType } = await this.service.raw(userId, id);
    // Stream-Fehler (z. B. MinIO-Verbindung bricht mitten im Transfer) abfangen,
    // sonst killt ein unbehandeltes 'error'-Event den API-Worker.
    stream.on("error", (e: Error) => {
      if (!res.headersSent) res.status(500).end();
      else res.destroy(e);
    });
    res.on("close", () => stream.destroy());
    res.setHeader("Content-Type", mimeType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(filename)}"`,
    );
    stream.pipe(res);
  }

  @Get()
  @CheckPolicies({ action: "read", subject: "Document" })
  list(@CurrentUserId() userId: string, @Query("caseFileId") caseFileId: string) {
    return this.service.listForCaseFile(userId, caseFileId);
  }
}
