import { Global, Module } from "@nestjs/common";
import { ActorService } from "./actor.service.js";
import { PoliciesGuard } from "./policies.guard.js";
import { CaseFileAccessService } from "./casefile-access.service.js";

@Global()
@Module({
  providers: [ActorService, PoliciesGuard, CaseFileAccessService],
  exports: [ActorService, PoliciesGuard, CaseFileAccessService],
})
export class RbacModule {}
