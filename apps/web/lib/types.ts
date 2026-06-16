/** UI-seitige Entity-Typen (Teilmenge der API-Antworten). */

export interface CaseFile {
  id: string;
  type: string;
  title: string;
  summary?: string | null;
  status: string;
  securityLevel: string;
  securityLevelRank: number;
  shareStatus: string;
  ownerFactionId: string;
  creatorId: string;
  subjectCitizenId?: string | null;
  createdAt: string;
  updatedAt: string;
  documents?: DocumentMeta[];
  shares?: FileShare[];
}

export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  fivemCharId?: string | null;
  photo?: string | null;
  createdAt: string;
  vehicles?: Array<{ id: string; plate: string; model?: string | null }>;
  properties?: Array<{ id: string; label: string; address: string }>;
  caseFiles?: Array<{ id: string; type: string; title: string; status: string; securityLevel: string }>;
  licenses?: Array<{ id: string; type: string; number: string; status: string }>;
  warrants?: Array<{ id: string; type: string; status: string; reason: string }>;
}

export interface DocumentMeta {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  version: number;
  createdAt: string;
}

export interface FileShare {
  id: string;
  caseFileId: string;
  targetType: string;
  targetId: string;
  status: string;
  reason?: string | null;
  allowedFields: string[];
  requestedById: string;
  decidedById?: string | null;
  decidedAt?: string | null;
  createdAt: string;
}

export interface Unit {
  id: string;
  callsign: string;
  factionId: string;
  channel?: string | null;
  sector?: string | null;
  sectorId?: string | null;
  status: string;
  x?: number | null;
  y?: number | null;
  heading?: number | null;
  lastSeenAt?: string | null;
  members?: Array<{ id: string; userId: string; isLead: boolean }>;
  faction?: { shortName: string; color?: string | null } | null;
}

export interface DispatchCall {
  id: string;
  number: number;
  line: string;
  callerName?: string | null;
  location: string;
  postal?: string | null;
  category: string;
  description: string;
  priority: string;
  status: string;
  x?: number | null;
  y?: number | null;
  createdAt: string;
  closedAt?: string | null;
  assignments?: Array<{ id: string; unitId: string; unit?: Unit }>;
  notes?: Array<{ id: string; note: string; at: string }>;
}

export interface WorkforceStats {
  since: string;
  totalSeconds: number;
  avgSecondsPerUser: number;
  topActive: Array<{ userId: string; seconds: number }>;
  perFaction: Array<{ factionId: string; seconds: number }>;
}

export interface AuditEntry {
  id: string;
  userId?: string | null;
  factionId?: string | null;
  rankName?: string | null;
  action: string;
  subjectType: string;
  subjectId?: string | null;
  ip?: string | null;
  at: string;
  hash: string;
  prevHash?: string | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  model?: string | null;
  color?: string | null;
  stolen: boolean;
  impounded: boolean;
  ownerId?: string | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
  registration?: { registeredTo?: string | null; validUntil?: string | null } | null;
  insurance?: { provider: string; policyNo: string; validUntil?: string | null } | null;
  createdAt: string;
}

export interface CustodyEvent {
  id: string;
  action: string;
  byUserId: string;
  location?: string | null;
  note?: string | null;
  at: string;
}

export interface EvidenceItem {
  id: string;
  caseFileId: string;
  label: string;
  kind: string;
  storageRef?: string | null;
  createdAt: string;
  custody?: CustodyEvent[];
}

export interface ForensicDetail {
  caseFileId: string;
  dna?: string | null;
  fingerprints?: string | null;
  ballistics?: string | null;
  toxicology?: string | null;
  autopsy?: string | null;
}

export interface CourtCase {
  id: string;
  number: number;
  title: string;
  type: string;
  status: string;
  caseFileId?: string | null;
  defendantId?: string | null;
  defendant?: { id: string; firstName: string; lastName: string } | null;
  filedAt: string;
  closedAt?: string | null;
  hearings?: Array<{ id: string; type: string; scheduledAt: string; room?: string | null; notes?: string | null }>;
  verdicts?: Array<{ id: string; type: string; summary?: string | null; decidedAt: string }>;
  sentences?: Array<{ id: string; type: string; jailDays?: number | null; fineAmount?: number | null; probationDays?: number | null; communityHours?: number | null }>;
  _count?: { hearings: number };
}

export interface PlatformModule {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  route?: string | null;
  category?: string | null;
  enabled: boolean;
  core: boolean;
  sortOrder: number;
  version: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  at: string;
}
