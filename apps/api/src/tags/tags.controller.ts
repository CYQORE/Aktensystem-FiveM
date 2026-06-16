import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { TagsService } from "./tags.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  CreateTagSchema,
  AttachTagSchema,
  type CreateTag,
  type AttachTag,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("tags")
export class TagsController {
  constructor(private readonly service: TagsService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Tag" })
  list() {
    return this.service.list();
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Tag" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateTagSchema)) dto: CreateTag,
  ) {
    return this.service.create(userId, dto);
  }

  @Delete(":id")
  @CheckPolicies({ action: "manage", subject: "all" })
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }

  @Post("citizen/:citizenId")
  @CheckPolicies({ action: "update", subject: "Citizen" })
  attach(
    @CurrentUserId() userId: string,
    @Param("citizenId") citizenId: string,
    @Body(new ZodPipe(AttachTagSchema)) dto: AttachTag,
  ) {
    return this.service.attach(userId, citizenId, dto.tagId);
  }

  @Delete("citizen/:citizenId/:tagId")
  @CheckPolicies({ action: "update", subject: "Citizen" })
  detach(
    @CurrentUserId() userId: string,
    @Param("citizenId") citizenId: string,
    @Param("tagId") tagId: string,
  ) {
    return this.service.detach(userId, citizenId, tagId);
  }
}
