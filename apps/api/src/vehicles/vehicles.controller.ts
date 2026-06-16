import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { VehiclesService } from "./vehicles.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import { CreateVehicleSchema, type CreateVehicle } from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Vehicle" })
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "Vehicle" })
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Vehicle" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateVehicleSchema)) dto: CreateVehicle,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "update", subject: "Vehicle" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() patch: Partial<CreateVehicle>,
  ) {
    return this.service.update(userId, id, patch);
  }
}
