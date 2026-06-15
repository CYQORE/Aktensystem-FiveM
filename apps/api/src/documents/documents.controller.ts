import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
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
  download(@Param("id") id: string) {
    return this.service.downloadUrl(id);
  }

  @Get()
  @CheckPolicies({ action: "read", subject: "Document" })
  list(@Query("caseFileId") caseFileId: string) {
    return this.service.listForCaseFile(caseFileId);
  }
}
