import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { DispatchService } from "./dispatch.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  CreateDispatchCallSchema,
  DispatchStatus,
  UnitStatus,
  type CreateDispatchCall,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller()
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  @Get("dispatch-calls")
  @CheckPolicies({ action: "read", subject: "DispatchCall" })
  listCalls() {
    return this.service.listCalls();
  }

  @Post("dispatch-calls")
  @CheckPolicies({ action: "create", subject: "DispatchCall" })
  createCall(@Body(new ZodPipe(CreateDispatchCallSchema)) dto: CreateDispatchCall) {
    return this.service.createCall(dto);
  }

  @Post("dispatch-calls/:id/assign")
  @CheckPolicies({ action: "dispatch", subject: "DispatchCall" })
  assign(@Param("id") id: string, @Body() body: { unitId: string }) {
    return this.service.assignUnit(id, body.unitId);
  }

  @Patch("dispatch-calls/:id/status")
  @CheckPolicies({ action: "dispatch", subject: "DispatchCall" })
  status(@Param("id") id: string, @Body() body: { status: DispatchStatus }) {
    return this.service.updateCallStatus(id, body.status);
  }

  @Get("units")
  @CheckPolicies({ action: "read", subject: "Unit" })
  listUnits() {
    return this.service.listUnits();
  }

  @Patch("units/:id/status")
  @CheckPolicies({ action: "read", subject: "Unit" })
  unitStatus(@Param("id") id: string, @Body() body: { status: UnitStatus }) {
    return this.service.setUnitStatus(id, body.status);
  }
}
