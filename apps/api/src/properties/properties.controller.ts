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
import { PropertiesService } from "./properties.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreatePropertySchema, type CreateProperty } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("properties")
export class PropertiesController {
  constructor(private readonly service: PropertiesService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Property" })
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "Property" })
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Property" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreatePropertySchema)) dto: CreateProperty,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "update", subject: "Property" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(CreatePropertySchema.partial())) patch: Partial<CreateProperty>,
  ) {
    return this.service.update(userId, id, patch);
  }

  @Delete(":id")
  @CheckPolicies({ action: "delete", subject: "Property" })
  remove(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.service.remove(userId, id);
  }
}
