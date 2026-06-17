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

export type ThreatLevel = "KEINE" | "BEOBACHTEN" | "GESUCHT" | "GEFAEHRLICH";

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
  threatLevel?: ThreatLevel;
  vehicles?: Array<{ id: string; plate: string; model?: string | null; stolen?: boolean; impounded?: boolean }>;
  properties?: Array<{ id: string; label: string; address: string }>;
  caseFiles?: Array<{ id: string; type: string; title: string; status: string; securityLevel: string; createdAt?: string }>;
  licenses?: Array<{ id: string; type: string; number: string; status: string }>;
  warrants?: Warrant[];
  charges?: Array<{
    id: string;
    count: number;
    notes?: string | null;
    createdAt: string;
    penalCode?: { code: string; title: string; class: string; category: string } | null;
  }>;
  fines?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    penalCode?: { code: string; title: string } | null;
  }>;
  bolos?: Bolo[];
  tags?: CitizenTag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  category?: string | null;
  factionId?: string | null;
  createdAt: string;
}

export interface CitizenTag {
  id: string;
  citizenId: string;
  tagId: string;
  byUserId?: string | null;
  createdAt: string;
  tag?: Tag | null;
}

export interface ChatMessage {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface ChatChannel {
  key: string;
  label: string;
}

export interface UserSettings {
  theme: string;
  notifyDispatch: boolean;
  notifyChat: boolean;
}

interface CitizenRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface MedicalIncident {
  id: string;
  citizenId?: string | null;
  type: string;
  location?: string | null;
  outcome?: string | null;
  at: string;
  citizen?: CitizenRef | null;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  ownerId?: string | null;
  address?: string | null;
  balance: number;
  createdAt: string;
  owner?: CitizenRef | null;
  _count?: { employees: number };
  employees?: Array<{ id: string; role?: string | null; wage: number; status: string; citizen?: CitizenRef | null }>;
  menuItems?: Array<{ id: string; name: string; price: number; category?: string | null }>;
}

export interface License {
  id: string;
  type: string;
  number: string;
  status: string;
  citizenId: string;
  issuedAt: string;
  expiresAt?: string | null;
  citizen?: CitizenRef | null;
}

export interface GovLaw {
  id: string;
  code: string;
  title: string;
  category?: string | null;
  body: string;
  effective: string;
  updatedAt: string;
}

export interface CustomsDeclaration {
  id: string;
  declarantId?: string | null;
  goods: { description?: string } | unknown;
  declaredValue: number;
  status: string;
  at: string;
  declarant?: CitizenRef | null;
}

export interface Property {
  id: string;
  label: string;
  address: string;
  ownerId?: string | null;
  owner?: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface FactionModuleRow {
  key: string;
  name: string;
  icon?: string | null;
  category?: string | null;
  core: boolean;
  globalEnabled: boolean;
  factionEnabled: boolean | null;
  effective: boolean;
}

export interface RankGrant {
  action: string;
  subject: string;
}
export interface AdminFaction {
  id: string;
  shortName: string;
  name: string;
}
export interface AdminRank {
  id: string;
  name: string;
  level: number;
  grants?: RankGrant[] | null;
}

export interface SearchHit {
  type: "citizen" | "vehicle" | "warrant" | "casefile" | "bolo";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export interface DashboardStats {
  openCalls: number;
  activeUnits: number;
  activeWarrants: number;
  activeBolos: number;
  unpaidFines: number;
  activeInmates: number;
  citizens: number;
  caseFiles: number;
}

export interface Warrant {
  id: string;
  citizenId: string;
  title?: string | null;
  reason: string;
  priority: string;
  type: string;
  status: string;
  caseFileId?: string | null;
  issuedById?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  citizen?: { id: string; firstName: string; lastName: string; photo?: string | null } | null;
  caseFile?: { id: string; title: string } | null;
}

export interface Bolo {
  id: string;
  title: string;
  description: string;
  citizenId?: string | null;
  plate?: string | null;
  active: boolean;
  byUserId?: string | null;
  createdAt: string;
}

export interface Fine {
  id: string;
  citizenId: string;
  penalCodeId?: string | null;
  amount: number;
  status: string; // UNPAID | PAID | CONTESTED | WAIVED
  officerId?: string | null;
  issuedAt: string;
  paidAt?: string | null;
  queued?: boolean; // an die Lua-Bridge übergeben (In-Game-Einzug)
  penalCode?: { code: string; title: string } | null;
  citizen?: { id: string; firstName: string; lastName: string } | null;
}

export interface Inmate {
  id: string;
  bookingNumber: number;
  citizenId: string;
  caseFileId?: string | null;
  status: string; // BOOKED | INCARCERATED | PAROLE | RELEASED | TRANSFERRED
  cell?: string | null;
  jailSeconds?: number | null;
  reason?: string | null;
  officerId?: string | null;
  intakeAt: string;
  releaseAt?: string | null;
  servedAt?: string | null;
  queued?: boolean;
  citizen?: { id: string; firstName: string; lastName: string; photo?: string | null } | null;
}

export interface VehicleActivity {
  id: string;
  vehicleId: string;
  activityType: string;
  location?: string | null;
  notes?: string | null;
  byUserId?: string | null;
  createdAt: string;
}

export interface VehiclePlateLookup extends Vehicle {
  activities?: VehicleActivity[];
  bolos?: Bolo[];
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
  zone?: string | null;
  lastSeenAt?: string | null;
  members?: Array<{ id: string; userId: string; isLead: boolean }>;
  faction?: { shortName: string; color?: string | null } | null;
}

export interface RadioChannel {
  id: string;
  name: string;
  label: string;
  factionId?: string | null;
  isPrivate: boolean;
  createdAt: string;
  members?: RadioMember[];
}

export interface RadioMember {
  id: string;
  channelId: string;
  userId: string;
  callsign?: string | null;
  joinedAt: string;
}

export interface StatusCode {
  id: string;
  code: string;
  label: string;
  category?: string | null;
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
  alertKind?: string | null; // PANIC | BACKUP
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

export interface PenalCode {
  id: string;
  code: string;
  title: string;
  category: string;
  class: string;
  description?: string | null;
  fineMin: number;
  fineMax: number;
  jailDaysMin: number;
  jailDaysMax: number;
  points: number;
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
