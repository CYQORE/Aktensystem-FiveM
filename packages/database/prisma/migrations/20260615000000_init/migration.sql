-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SecurityLevel" AS ENUM ('INTERN', 'VERTRAULICH', 'BEHOERDENINTERN', 'GEHEIM', 'HOCHGEHEIM');

-- CreateEnum
CREATE TYPE "CaseFileType" AS ENUM ('PERSONENAKTE', 'ERMITTLUNGSAKTE', 'STRAFAKTE', 'FORENSIKAKTE', 'OBDUKTIONSBERICHT', 'PATIENTENAKTE', 'GERICHTSAKTE', 'STAATSANWALTSCHAFTSAKTE', 'GEFAENGNISAKTE', 'UNTERNEHMENSAKTE', 'VERWALTUNGSAKTE');

-- CreateEnum
CREATE TYPE "CaseFileStatus" AS ENUM ('ENTWURF', 'OFFEN', 'IN_BEARBEITUNG', 'GESCHLOSSEN', 'ARCHIVIERT');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PRIVAT', 'BEANTRAGT', 'IN_PRUEFUNG', 'TEILFREIGEGEBEN', 'VOLLSTAENDIG_FREIGEGEBEN', 'ABGELEHNT', 'WIDERRUFEN');

-- CreateEnum
CREATE TYPE "ShareTargetType" AS ENUM ('PERSON', 'ROLLE', 'ABTEILUNG', 'FRAKTION', 'BEHOERDE');

-- CreateEnum
CREATE TYPE "EmergencyLine" AS ENUM ('POLICE_911', 'NON_EMERGENCY_311', 'EMS_112', 'BEHOERDENTELEFON');

-- CreateEnum
CREATE TYPE "DispatchPriority" AS ENUM ('P1', 'P2', 'P3', 'P4');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('OFFEN', 'DISPATCHED', 'UNTERWEGS', 'VOR_ORT', 'TRANSPORT', 'ABGESCHLOSSEN');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('FREI', 'STREIFE', 'VERKEHRSKONTROLLE', 'EINSATZ', 'VERFOLGUNG', 'KRANKENHAUS', 'PAUSE', 'AUSSER_DIENST');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('FRUEH', 'SPAET', 'NACHT', 'SONDERDIENST');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', 'REVOKE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SIGN');

-- CreateEnum
CREATE TYPE "FactionKind" AS ENUM ('POLICE', 'SHERIFF', 'STATE_POLICE', 'FEDERAL', 'DOJ', 'COURT', 'DA_OFFICE', 'CORRECTIONS', 'PRISON', 'EMS', 'FIRE', 'DISPATCH', 'GOVERNMENT', 'FORENSICS', 'DMV', 'CUSTOMS', 'BUSINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "OffenseClass" AS ENUM ('INFRACTION', 'MISDEMEANOR', 'FELONY');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'FILED', 'CONVICTED', 'DISMISSED', 'DROPPED');

-- CreateEnum
CREATE TYPE "WarrantType" AS ENUM ('ARREST', 'SEARCH', 'BENCH');

-- CreateEnum
CREATE TYPE "WarrantStatus" AS ENUM ('ACTIVE', 'EXECUTED', 'EXPIRED', 'RECALLED');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('UNPAID', 'PAID', 'CONTESTED', 'WAIVED');

-- CreateEnum
CREATE TYPE "CourtCaseType" AS ENUM ('CRIMINAL', 'CIVIL', 'TRAFFIC', 'APPEAL');

-- CreateEnum
CREATE TYPE "CourtCaseStatus" AS ENUM ('FILED', 'SCHEDULED', 'IN_TRIAL', 'ADJOURNED', 'CLOSED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "HearingType" AS ENUM ('ARRAIGNMENT', 'PRELIMINARY', 'TRIAL', 'SENTENCING', 'APPEAL');

-- CreateEnum
CREATE TYPE "VerdictType" AS ENUM ('GUILTY', 'NOT_GUILTY', 'DISMISSED', 'MISTRIAL', 'PLEA');

-- CreateEnum
CREATE TYPE "SentenceType" AS ENUM ('PRISON', 'FINE', 'PROBATION', 'COMMUNITY_SERVICE', 'DEATH');

-- CreateEnum
CREATE TYPE "InmateStatus" AS ENUM ('BOOKED', 'INCARCERATED', 'PAROLE', 'RELEASED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('DRIVER', 'WEAPON', 'BUSINESS', 'PILOT', 'HUNTING', 'MEDICAL', 'LAW');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CustomsStatus" AS ENUM ('DECLARED', 'CLEARED', 'SEIZED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('GENERAL', 'RESTAURANT', 'REAL_ESTATE', 'MECHANIC', 'SECURITY', 'NEWS', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'SICK', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SHARE_REQUEST', 'ASSIGNMENT', 'ALERT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "globalName" TEXT,
    "avatar" TEXT,
    "email" TEXT,
    "clearance" "SecurityLevel" NOT NULL DEFAULT 'INTERN',
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "fivemIdentifier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faction" (
    "id" UUID NOT NULL,
    "kind" "FactionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rank" (
    "id" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "shareTier" INTEGER NOT NULL DEFAULT 0,
    "clearance" "SecurityLevel" NOT NULL DEFAULT 'INTERN',

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactionMembership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "rankId" UUID,
    "departmentId" UUID,
    "callsign" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extraGrants" JSONB,

    CONSTRAINT "FactionMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citizen" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "fivemCharId" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "photo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "plate" TEXT NOT NULL,
    "model" TEXT,
    "color" TEXT,
    "ownerId" UUID,
    "stolen" BOOLEAN NOT NULL DEFAULT false,
    "impounded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRegistration" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "registeredTo" TEXT,
    "validUntil" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "ownerId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFile" (
    "id" UUID NOT NULL,
    "type" "CaseFileType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "CaseFileStatus" NOT NULL DEFAULT 'ENTWURF',
    "securityLevel" "SecurityLevel" NOT NULL DEFAULT 'INTERN',
    "securityLevelRank" INTEGER NOT NULL DEFAULT 1,
    "shareStatus" "ShareStatus" NOT NULL DEFAULT 'PRIVAT',
    "ownerFactionId" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "subjectCitizenId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseFileLink" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseFileLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileShare" (
    "id" UUID NOT NULL,
    "caseFileId" UUID NOT NULL,
    "targetType" "ShareTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "ShareStatus" NOT NULL DEFAULT 'BEANTRAGT',
    "reason" TEXT,
    "allowedFields" TEXT[],
    "requestedById" UUID NOT NULL,
    "decidedById" UUID,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForensicDetail" (
    "id" UUID NOT NULL,
    "caseFileId" UUID NOT NULL,
    "dna" JSONB,
    "fingerprints" JSONB,
    "ballistics" JSONB,
    "toxicology" JSONB,
    "autopsy" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForensicDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceItem" (
    "id" UUID NOT NULL,
    "caseFileId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "storageRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustodyEvent" (
    "id" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "byUserId" UUID NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustodyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientRecord" (
    "id" UUID NOT NULL,
    "caseFileId" UUID NOT NULL,
    "citizenId" UUID,
    "publicStatus" TEXT NOT NULL DEFAULT 'STATUS',
    "diagnoses" JSONB,
    "medications" JSONB,
    "psychNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalIncident" (
    "id" UUID NOT NULL,
    "citizenId" UUID,
    "emsUserId" UUID,
    "type" TEXT NOT NULL,
    "location" TEXT,
    "outcome" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireIncident" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "reportCaseFileId" UUID,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FireIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenalCode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "class" "OffenseClass" NOT NULL,
    "description" TEXT,
    "fineMin" INTEGER NOT NULL DEFAULT 0,
    "fineMax" INTEGER NOT NULL DEFAULT 0,
    "jailDaysMin" INTEGER NOT NULL DEFAULT 0,
    "jailDaysMax" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PenalCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" UUID NOT NULL,
    "caseFileId" UUID,
    "citizenId" UUID NOT NULL,
    "penalCodeId" UUID NOT NULL,
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "count" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "byUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warrant" (
    "id" UUID NOT NULL,
    "citizenId" UUID NOT NULL,
    "caseFileId" UUID,
    "type" "WarrantType" NOT NULL DEFAULT 'ARREST',
    "status" "WarrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "issuedById" UUID,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Warrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bolo" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "citizenId" UUID,
    "plate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "byUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bolo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArrestRecord" (
    "id" UUID NOT NULL,
    "citizenId" UUID NOT NULL,
    "caseFileId" UUID,
    "officerId" UUID NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArrestRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fine" (
    "id" UUID NOT NULL,
    "citizenId" UUID NOT NULL,
    "penalCodeId" UUID,
    "amount" INTEGER NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'UNPAID',
    "officerId" UUID,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Fine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtCase" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "type" "CourtCaseType" NOT NULL DEFAULT 'CRIMINAL',
    "status" "CourtCaseStatus" NOT NULL DEFAULT 'FILED',
    "title" TEXT NOT NULL,
    "caseFileId" UUID,
    "defendantId" UUID,
    "prosecutorId" UUID,
    "defenseId" UUID,
    "judgeId" UUID,
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "CourtCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourtHearing" (
    "id" UUID NOT NULL,
    "courtCaseId" UUID NOT NULL,
    "type" "HearingType" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "room" TEXT,
    "notes" TEXT,

    CONSTRAINT "CourtHearing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verdict" (
    "id" UUID NOT NULL,
    "courtCaseId" UUID NOT NULL,
    "type" "VerdictType" NOT NULL,
    "summary" TEXT,
    "judgeId" UUID,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verdict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" UUID NOT NULL,
    "courtCaseId" UUID NOT NULL,
    "verdictId" UUID,
    "type" "SentenceType" NOT NULL,
    "jailDays" INTEGER,
    "fineAmount" INTEGER,
    "probationDays" INTEGER,
    "communityHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inmate" (
    "id" UUID NOT NULL,
    "bookingNumber" SERIAL NOT NULL,
    "citizenId" UUID NOT NULL,
    "caseFileId" UUID,
    "sentenceId" UUID,
    "status" "InmateStatus" NOT NULL DEFAULT 'BOOKED',
    "cell" TEXT,
    "propertyHeld" JSONB,
    "intakeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releaseAt" TIMESTAMP(3),

    CONSTRAINT "Inmate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" UUID NOT NULL,
    "type" "LicenseType" NOT NULL,
    "number" TEXT NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
    "citizenId" UUID NOT NULL,
    "issuedByFactionId" UUID,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovLaw" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "body" TEXT NOT NULL,
    "effective" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GovLaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomsDeclaration" (
    "id" UUID NOT NULL,
    "declarantId" UUID,
    "goods" JSONB NOT NULL,
    "declaredValue" INTEGER NOT NULL DEFAULT 0,
    "status" "CustomsStatus" NOT NULL DEFAULT 'DECLARED',
    "inspectorId" UUID,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomsDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Business" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BusinessType" NOT NULL DEFAULT 'GENERAL',
    "ownerId" UUID,
    "address" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEmployee" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "citizenId" UUID NOT NULL,
    "role" TEXT,
    "wage" INTEGER NOT NULL DEFAULT 0,
    "status" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "category" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealEstateListing" (
    "id" UUID NOT NULL,
    "businessId" UUID,
    "propertyId" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
    "agentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealEstateListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MechanicJob" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "vehicleId" UUID,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL DEFAULT 0,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MechanicJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityContract" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "clientName" TEXT NOT NULL,
    "details" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsArticle" (
    "id" UUID NOT NULL,
    "businessId" UUID,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchCall" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "line" "EmergencyLine" NOT NULL,
    "callerName" TEXT,
    "location" TEXT NOT NULL,
    "postal" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "DispatchPriority" NOT NULL DEFAULT 'P3',
    "status" "DispatchStatus" NOT NULL DEFAULT 'OFFEN',
    "sectorId" UUID,
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "DispatchCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallNote" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "byUserId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusCode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "StatusCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" UUID NOT NULL,
    "callsign" TEXT NOT NULL,
    "factionId" UUID NOT NULL,
    "channel" TEXT,
    "sectorId" UUID,
    "status" "UnitStatus" NOT NULL DEFAULT 'AUSSER_DIENST',
    "x" DOUBLE PRECISION,
    "y" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMember" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UnitMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitAssignment" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "UnitAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "rankName" TEXT,
    "shiftType" "ShiftType" NOT NULL DEFAULT 'FRUEH',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "autoClosed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShiftLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftSchedule" (
    "id" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "recurring" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftAssignment" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isStandIn" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "factionId" UUID NOT NULL,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL DEFAULT 'REQUESTED',
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "decidedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowDefinition" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appliesToType" "CaseFileType",
    "factionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowState" (
    "id" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkflowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "fromStateId" UUID NOT NULL,
    "toStateId" UUID NOT NULL,
    "allowedRoles" JSONB,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowInstance" (
    "id" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "caseFileId" UUID,
    "currentStateId" UUID NOT NULL,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTask" (
    "id" UUID NOT NULL,
    "instanceId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeUserId" UUID,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "caseFileId" UUID,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "storageRef" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" UUID NOT NULL,
    "caseFileId" UUID NOT NULL,
    "signerId" UUID NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "refType" TEXT,
    "refId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "factionId" UUID,
    "rankName" TEXT,
    "action" "AuditAction" NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prevHash" TEXT,
    "hash" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_fivemIdentifier_key" ON "User"("fivemIdentifier");

-- CreateIndex
CREATE INDEX "User_fivemIdentifier_idx" ON "User"("fivemIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Faction_shortName_key" ON "Faction"("shortName");

-- CreateIndex
CREATE INDEX "Faction_kind_idx" ON "Faction"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "Department_factionId_name_key" ON "Department"("factionId", "name");

-- CreateIndex
CREATE INDEX "Rank_factionId_level_idx" ON "Rank"("factionId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Rank_factionId_name_key" ON "Rank"("factionId", "name");

-- CreateIndex
CREATE INDEX "FactionMembership_factionId_idx" ON "FactionMembership"("factionId");

-- CreateIndex
CREATE UNIQUE INDEX "FactionMembership_userId_factionId_key" ON "FactionMembership"("userId", "factionId");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_fivemCharId_key" ON "Citizen"("fivemCharId");

-- CreateIndex
CREATE INDEX "Citizen_lastName_firstName_idx" ON "Citizen"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Citizen_fivemCharId_idx" ON "Citizen"("fivemCharId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleRegistration_vehicleId_key" ON "VehicleRegistration"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Insurance_vehicleId_key" ON "Insurance"("vehicleId");

-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");

-- CreateIndex
CREATE INDEX "CaseFile_ownerFactionId_type_idx" ON "CaseFile"("ownerFactionId", "type");

-- CreateIndex
CREATE INDEX "CaseFile_securityLevelRank_idx" ON "CaseFile"("securityLevelRank");

-- CreateIndex
CREATE INDEX "CaseFile_subjectCitizenId_idx" ON "CaseFile"("subjectCitizenId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseFileLink_sourceId_targetId_key" ON "CaseFileLink"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "FileShare_caseFileId_idx" ON "FileShare"("caseFileId");

-- CreateIndex
CREATE INDEX "FileShare_targetType_targetId_idx" ON "FileShare"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ForensicDetail_caseFileId_key" ON "ForensicDetail"("caseFileId");

-- CreateIndex
CREATE INDEX "EvidenceItem_caseFileId_idx" ON "EvidenceItem"("caseFileId");

-- CreateIndex
CREATE INDEX "CustodyEvent_evidenceId_at_idx" ON "CustodyEvent"("evidenceId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "PatientRecord_caseFileId_key" ON "PatientRecord"("caseFileId");

-- CreateIndex
CREATE INDEX "MedicalIncident_citizenId_idx" ON "MedicalIncident"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "PenalCode_code_key" ON "PenalCode"("code");

-- CreateIndex
CREATE INDEX "Charge_citizenId_idx" ON "Charge"("citizenId");

-- CreateIndex
CREATE INDEX "Charge_caseFileId_idx" ON "Charge"("caseFileId");

-- CreateIndex
CREATE INDEX "Warrant_citizenId_status_idx" ON "Warrant"("citizenId", "status");

-- CreateIndex
CREATE INDEX "Bolo_active_idx" ON "Bolo"("active");

-- CreateIndex
CREATE INDEX "ArrestRecord_citizenId_idx" ON "ArrestRecord"("citizenId");

-- CreateIndex
CREATE INDEX "Fine_citizenId_status_idx" ON "Fine"("citizenId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CourtCase_number_key" ON "CourtCase"("number");

-- CreateIndex
CREATE INDEX "CourtCase_status_idx" ON "CourtCase"("status");

-- CreateIndex
CREATE INDEX "CourtHearing_courtCaseId_scheduledAt_idx" ON "CourtHearing"("courtCaseId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Verdict_courtCaseId_idx" ON "Verdict"("courtCaseId");

-- CreateIndex
CREATE INDEX "Sentence_courtCaseId_idx" ON "Sentence"("courtCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Inmate_bookingNumber_key" ON "Inmate"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Inmate_sentenceId_key" ON "Inmate"("sentenceId");

-- CreateIndex
CREATE INDEX "Inmate_citizenId_status_idx" ON "Inmate"("citizenId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "License_number_key" ON "License"("number");

-- CreateIndex
CREATE INDEX "License_citizenId_type_idx" ON "License"("citizenId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "GovLaw_code_key" ON "GovLaw"("code");

-- CreateIndex
CREATE INDEX "CustomsDeclaration_status_idx" ON "CustomsDeclaration"("status");

-- CreateIndex
CREATE INDEX "Business_type_idx" ON "Business"("type");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEmployee_businessId_citizenId_key" ON "BusinessEmployee"("businessId", "citizenId");

-- CreateIndex
CREATE INDEX "RealEstateListing_status_idx" ON "RealEstateListing"("status");

-- CreateIndex
CREATE INDEX "MechanicJob_businessId_status_idx" ON "MechanicJob"("businessId", "status");

-- CreateIndex
CREATE INDEX "NewsArticle_status_idx" ON "NewsArticle"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DispatchCall_number_key" ON "DispatchCall"("number");

-- CreateIndex
CREATE INDEX "DispatchCall_status_priority_idx" ON "DispatchCall"("status", "priority");

-- CreateIndex
CREATE INDEX "CallNote_callId_at_idx" ON "CallNote"("callId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_code_key" ON "Sector"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StatusCode_code_key" ON "StatusCode"("code");

-- CreateIndex
CREATE INDEX "Unit_factionId_status_idx" ON "Unit"("factionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMember_unitId_userId_key" ON "UnitMember"("unitId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitAssignment_callId_unitId_key" ON "UnitAssignment"("callId", "unitId");

-- CreateIndex
CREATE INDEX "ShiftLog_userId_startedAt_idx" ON "ShiftLog"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "ShiftLog_factionId_startedAt_idx" ON "ShiftLog"("factionId", "startedAt");

-- CreateIndex
CREATE INDEX "ShiftSchedule_factionId_startsAt_idx" ON "ShiftSchedule"("factionId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftAssignment_scheduleId_userId_key" ON "ShiftAssignment"("scheduleId", "userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_userId_status_idx" ON "LeaveRequest"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowDefinition_key_key" ON "WorkflowDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowState_definitionId_key_key" ON "WorkflowState"("definitionId", "key");

-- CreateIndex
CREATE INDEX "WorkflowTransition_definitionId_idx" ON "WorkflowTransition"("definitionId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_status_idx" ON "WorkflowInstance"("status");

-- CreateIndex
CREATE INDEX "WorkflowInstance_caseFileId_idx" ON "WorkflowInstance"("caseFileId");

-- CreateIndex
CREATE INDEX "WorkflowTask_instanceId_status_idx" ON "WorkflowTask"("instanceId", "status");

-- CreateIndex
CREATE INDEX "Document_caseFileId_idx" ON "Document"("caseFileId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "Signature_caseFileId_idx" ON "Signature"("caseFileId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "AuditLog_subjectType_subjectId_idx" ON "AuditLog"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_at_idx" ON "AuditLog"("userId", "at");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rank" ADD CONSTRAINT "Rank_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactionMembership" ADD CONSTRAINT "FactionMembership_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRegistration" ADD CONSTRAINT "VehicleRegistration_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_ownerFactionId_fkey" FOREIGN KEY ("ownerFactionId") REFERENCES "Faction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFile" ADD CONSTRAINT "CaseFile_subjectCitizenId_fkey" FOREIGN KEY ("subjectCitizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFileLink" ADD CONSTRAINT "CaseFileLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseFileLink" ADD CONSTRAINT "CaseFileLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileShare" ADD CONSTRAINT "FileShare_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForensicDetail" ADD CONSTRAINT "ForensicDetail_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceItem" ADD CONSTRAINT "EvidenceItem_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodyEvent" ADD CONSTRAINT "CustodyEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "EvidenceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRecord" ADD CONSTRAINT "PatientRecord_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientRecord" ADD CONSTRAINT "PatientRecord_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalIncident" ADD CONSTRAINT "MedicalIncident_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_penalCodeId_fkey" FOREIGN KEY ("penalCodeId") REFERENCES "PenalCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warrant" ADD CONSTRAINT "Warrant_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrestRecord" ADD CONSTRAINT "ArrestRecord_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArrestRecord" ADD CONSTRAINT "ArrestRecord_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_penalCodeId_fkey" FOREIGN KEY ("penalCodeId") REFERENCES "PenalCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtCase" ADD CONSTRAINT "CourtCase_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtCase" ADD CONSTRAINT "CourtCase_defendantId_fkey" FOREIGN KEY ("defendantId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourtHearing" ADD CONSTRAINT "CourtHearing_courtCaseId_fkey" FOREIGN KEY ("courtCaseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verdict" ADD CONSTRAINT "Verdict_courtCaseId_fkey" FOREIGN KEY ("courtCaseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_courtCaseId_fkey" FOREIGN KEY ("courtCaseId") REFERENCES "CourtCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_verdictId_fkey" FOREIGN KEY ("verdictId") REFERENCES "Verdict"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inmate" ADD CONSTRAINT "Inmate_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inmate" ADD CONSTRAINT "Inmate_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inmate" ADD CONSTRAINT "Inmate_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "Sentence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_issuedByFactionId_fkey" FOREIGN KEY ("issuedByFactionId") REFERENCES "Faction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomsDeclaration" ADD CONSTRAINT "CustomsDeclaration_declarantId_fkey" FOREIGN KEY ("declarantId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealEstateListing" ADD CONSTRAINT "RealEstateListing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicJob" ADD CONSTRAINT "MechanicJob_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MechanicJob" ADD CONSTRAINT "MechanicJob_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityContract" ADD CONSTRAINT "SecurityContract_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsArticle" ADD CONSTRAINT "NewsArticle_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispatchCall" ADD CONSTRAINT "DispatchCall_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallNote" ADD CONSTRAINT "CallNote_callId_fkey" FOREIGN KEY ("callId") REFERENCES "DispatchCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMember" ADD CONSTRAINT "UnitMember_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAssignment" ADD CONSTRAINT "UnitAssignment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "DispatchCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitAssignment" ADD CONSTRAINT "UnitAssignment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftLog" ADD CONSTRAINT "ShiftLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftSchedule" ADD CONSTRAINT "ShiftSchedule_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "Faction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ShiftSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowState" ADD CONSTRAINT "WorkflowState_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "WorkflowDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_currentStateId_fkey" FOREIGN KEY ("currentStateId") REFERENCES "WorkflowState"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTask" ADD CONSTRAINT "WorkflowTask_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_caseFileId_fkey" FOREIGN KEY ("caseFileId") REFERENCES "CaseFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_signerId_fkey" FOREIGN KEY ("signerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

