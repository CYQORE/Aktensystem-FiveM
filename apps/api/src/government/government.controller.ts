import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GovernmentService } from "./government.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  IssueLicenseSchema,
  SetLicenseStatusSchema,
  CreateGovLawSchema,
  CreateCustomsDeclarationSchema,
  SetCustomsStatusSchema,
  type IssueLicense,
  type SetLicenseStatus,
  type CreateGovLaw,
  type CreateCustomsDeclaration,
  type SetCustomsStatus,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class GovernmentController {
  constructor(private readonly service: GovernmentService) {}

  // ---- DMV / Lizenzen ----
  @Get("licenses")
  @CheckPolicies({ action: "read", subject: "License" })
  listLicenses(@Query("citizenId") citizenId?: string) {
    return this.service.listLicenses(citizenId);
  }

  @Post("licenses")
  @CheckPolicies({ action: "create", subject: "License" })
  issueLicense(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(IssueLicenseSchema)) dto: IssueLicense,
  ) {
    return this.service.issueLicense(userId, dto);
  }

  @Patch("licenses/:id/status")
  @CheckPolicies({ action: "update", subject: "License" })
  setLicenseStatus(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(SetLicenseStatusSchema)) dto: SetLicenseStatus,
  ) {
    return this.service.setLicenseStatus(userId, id, dto);
  }

  // ---- Gesetze (Pflege nur Admin via manage all) ----
  @Get("gov-laws")
  @CheckPolicies({ action: "read", subject: "GovLaw" })
  listLaws(@Query("q") q?: string) {
    return this.service.listLaws(q);
  }

  @Post("gov-laws")
  @CheckPolicies({ action: "manage", subject: "all" })
  createLaw(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateGovLawSchema)) dto: CreateGovLaw,
  ) {
    return this.service.createLaw(userId, dto);
  }

  @Patch("gov-laws/:id")
  @CheckPolicies({ action: "manage", subject: "all" })
  updateLaw(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(CreateGovLawSchema.partial())) patch: Partial<CreateGovLaw>,
  ) {
    return this.service.updateLaw(userId, id, patch);
  }

  @Delete("gov-laws/:id")
  @CheckPolicies({ action: "manage", subject: "all" })
  removeLaw(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.removeLaw(userId, id);
  }

  // ---- Zoll ----
  @Get("customs")
  @CheckPolicies({ action: "read", subject: "CustomsDeclaration" })
  listCustoms(@Query("status") status?: string) {
    return this.service.listCustoms(status);
  }

  @Post("customs")
  @CheckPolicies({ action: "create", subject: "CustomsDeclaration" })
  createCustoms(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateCustomsDeclarationSchema)) dto: CreateCustomsDeclaration,
  ) {
    return this.service.createCustoms(userId, dto);
  }

  @Patch("customs/:id/status")
  @CheckPolicies({ action: "update", subject: "CustomsDeclaration" })
  setCustomsStatus(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(SetCustomsStatusSchema)) dto: SetCustomsStatus,
  ) {
    return this.service.setCustomsStatus(userId, id, dto);
  }
}
