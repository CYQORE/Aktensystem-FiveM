import { z } from "zod";
import {
  CaseFileType,
  CaseFileStatus,
  SecurityLevel,
  ShareStatus,
  ShareTargetType,
  DispatchPriority,
  DispatchStatus,
  EmergencyLine,
  UnitStatus,
  FrameworkAdapter,
} from "./enums";

/**
 * Geteilte Zod-Schemas — Validierung an API-Grenze (NestJS) und im FE
 * (React-Hook-Form). Ein Vertrag, zwei Seiten.
 */

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const CreateCitizenSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  dateOfBirth: z.string().optional(), // ISO-Datum
  gender: z.string().max(20).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(200).optional(),
  fivemCharId: z.string().max(120).optional(),
  photo: z.string().url().optional(),
});
export type CreateCitizen = z.infer<typeof CreateCitizenSchema>;

export const CreateCaseFileSchema = z.object({
  type: z.nativeEnum(CaseFileType),
  title: z.string().min(3).max(200),
  summary: z.string().max(5000).optional(),
  ownerFactionId: z.string().uuid(),
  securityLevel: z.nativeEnum(SecurityLevel).default(SecurityLevel.INTERN),
  status: z.nativeEnum(CaseFileStatus).default(CaseFileStatus.ENTWURF),
  subjectCitizenId: z.string().uuid().optional(),
  linkedCaseFileIds: z.array(z.string().uuid()).default([]),
});
export type CreateCaseFile = z.infer<typeof CreateCaseFileSchema>;

export const ShareCaseFileSchema = z.object({
  caseFileId: z.string().uuid(),
  targetType: z.nativeEnum(ShareTargetType),
  targetId: z.string(),
  status: z.nativeEnum(ShareStatus).default(ShareStatus.BEANTRAGT),
  reason: z.string().max(1000).optional(),
  // optionale Feld-Whitelist für Teilfreigaben
  allowedFields: z.array(z.string()).optional(),
});
export type ShareCaseFile = z.infer<typeof ShareCaseFileSchema>;

export const CreateDispatchCallSchema = z.object({
  line: z.nativeEnum(EmergencyLine),
  callerName: z.string().max(120).optional(),
  location: z.string().max(200),
  postal: z.string().max(20).optional(),
  category: z.string().max(80),
  description: z.string().max(2000),
  priority: z.nativeEnum(DispatchPriority).default(DispatchPriority.P3),
  status: z.nativeEnum(DispatchStatus).default(DispatchStatus.OFFEN),
});
export type CreateDispatchCall = z.infer<typeof CreateDispatchCallSchema>;

// ---- FiveM-Bridge Payloads ----

export const FiveMAuthHeaderSchema = z.object({
  token: z.string().min(8),
  adapter: z.nativeEnum(FrameworkAdapter).default(FrameworkAdapter.STANDALONE),
});

export const FiveMDutyEventSchema = z.object({
  identifier: z.string(), // license:xxx oder discord:xxx
  factionId: z.string().optional(),
  rank: z.string().optional(),
  onDuty: z.boolean(),
  timestamp: z.number().int(),
});
export type FiveMDutyEvent = z.infer<typeof FiveMDutyEventSchema>;

export const FiveMPositionSchema = z.object({
  identifier: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  vehicle: z.string().optional(),
  status: z.nativeEnum(UnitStatus).optional(),
});
export type FiveMPosition = z.infer<typeof FiveMPositionSchema>;

/** Lua-Server fordert One-Time-Login-Code an (bridge-authed). */
export const FiveMIssueSchema = z.object({
  license: z.string().min(3),
  discord: z.string().optional(), // discord:xxxx (ohne Prefix oder mit)
  name: z.string().max(120).optional(),
  source: z.enum(["NUI", "BROWSER"]).default("NUI"),
});
export type FiveMIssue = z.infer<typeof FiveMIssueSchema>;

/** Web tauscht Code gegen JWT (public). Code = randomBytes(24).hex = 48 hex. */
export const FiveMExchangeSchema = z.object({
  code: z
    .string()
    .length(48)
    .regex(/^[0-9a-f]+$/),
});
export type FiveMExchange = z.infer<typeof FiveMExchangeSchema>;

export const FiveMEmergencyCallSchema = z.object({
  identifier: z.string().optional(),
  line: z.nativeEnum(EmergencyLine),
  x: z.number(),
  y: z.number(),
  message: z.string().max(2000),
});
export type FiveMEmergencyCall = z.infer<typeof FiveMEmergencyCallSchema>;
