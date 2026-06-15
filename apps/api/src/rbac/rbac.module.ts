import { Global, Module } from "@nestjs/common";
import { ActorService } from "./actor.service.js";
import { PoliciesGuard } from "./policies.guard.js";

@Global()
@Module({
  providers: [ActorService, PoliciesGuard],
  exports: [ActorService, PoliciesGuard],
})
export class RbacModule {}
