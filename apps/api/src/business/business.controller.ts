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
import { BusinessService } from "./business.service.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PoliciesGuard } from "../rbac/policies.guard.js";
import { CheckPolicies } from "../rbac/policies.decorator.js";
import { CurrentUserId } from "../auth/current-user.decorator.js";
import { ZodPipe } from "../common/zod-validation.pipe.js";
import {
  CreateBusinessSchema,
  AddBusinessEmployeeSchema,
  AddMenuItemSchema,
  type CreateBusiness,
  type AddBusinessEmployee,
  type AddMenuItem,
} from "@aktensystem/shared";

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Controller("businesses")
export class BusinessController {
  constructor(private readonly service: BusinessService) {}

  @Get()
  @CheckPolicies({ action: "read", subject: "Business" })
  list(@Query("q") q?: string) {
    return this.service.list(q);
  }

  @Get(":id")
  @CheckPolicies({ action: "read", subject: "Business" })
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @CheckPolicies({ action: "create", subject: "Business" })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodPipe(CreateBusinessSchema)) dto: CreateBusiness,
  ) {
    return this.service.create(userId, dto);
  }

  @Patch(":id")
  @CheckPolicies({ action: "update", subject: "Business" })
  update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body(new ZodPipe(CreateBusinessSchema.partial())) patch: Partial<CreateBusiness>,
  ) {
    return this.service.update(userId, id, patch);
  }

  @Post(":id/employees")
  @CheckPolicies({ action: "update", subject: "Business" })
  addEmployee(
    @Param("id") id: string,
    @Body(new ZodPipe(AddBusinessEmployeeSchema)) dto: AddBusinessEmployee,
  ) {
    return this.service.addEmployee(id, dto);
  }

  @Delete(":id/employees/:employeeId")
  @CheckPolicies({ action: "update", subject: "Business" })
  removeEmployee(@Param("id") id: string, @Param("employeeId") employeeId: string) {
    return this.service.removeEmployee(id, employeeId);
  }

  @Post(":id/menu")
  @CheckPolicies({ action: "update", subject: "Business" })
  addMenuItem(@Param("id") id: string, @Body(new ZodPipe(AddMenuItemSchema)) dto: AddMenuItem) {
    return this.service.addMenuItem(id, dto);
  }

  @Delete(":id/menu/:itemId")
  @CheckPolicies({ action: "update", subject: "Business" })
  removeMenuItem(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.service.removeMenuItem(id, itemId);
  }
}
