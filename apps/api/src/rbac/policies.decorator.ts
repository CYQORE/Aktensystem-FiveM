import { SetMetadata } from "@nestjs/common";
import type { AppAction, AppSubject } from "@aktensystem/rbac";

export interface RequiredPolicy {
  action: AppAction;
  subject: AppSubject;
}

export const POLICIES_KEY = "required_policies";

/**
 * Deklariert die nötigen Rechte für eine Route.
 *   @CheckPolicies({ action: "read", subject: "CaseFile" })
 */
export const CheckPolicies = (...policies: RequiredPolicy[]) =>
  SetMetadata(POLICIES_KEY, policies);
