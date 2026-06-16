-- CreateTable
CREATE TABLE `s6mdt_user` (
    `id` CHAR(36) NOT NULL,
    `discordId` VARCHAR(191) NULL,
    `username` VARCHAR(191) NOT NULL,
    `globalName` VARCHAR(191) NULL,
    `avatar` TEXT NULL,
    `email` VARCHAR(191) NULL,
    `clearance` ENUM('INTERN', 'VERTRAULICH', 'BEHOERDENINTERN', 'GEHEIM', 'HOCHGEHEIM') NOT NULL DEFAULT 'INTERN',
    `isPlatformAdmin` BOOLEAN NOT NULL DEFAULT false,
    `fivemIdentifier` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_user_discordId_key`(`discordId`),
    UNIQUE INDEX `s6mdt_user_fivemIdentifier_key`(`fivemIdentifier`),
    INDEX `s6mdt_user_fivemIdentifier_idx`(`fivemIdentifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_refresh_token` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `userAgent` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_refresh_token_tokenHash_key`(`tokenHash`),
    INDEX `s6mdt_refresh_token_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_platform_bootstrap` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `claimedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_platform_bootstrap_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_platform_module` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `route` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `core` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 100,
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `s6mdt_platform_module_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_auth_ticket` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `source` ENUM('NUI', 'BROWSER') NOT NULL DEFAULT 'NUI',
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_auth_ticket_code_key`(`code`),
    INDEX `s6mdt_auth_ticket_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_faction` (
    `id` CHAR(36) NOT NULL,
    `kind` ENUM('POLICE', 'SHERIFF', 'STATE_POLICE', 'FEDERAL', 'DOJ', 'COURT', 'DA_OFFICE', 'CORRECTIONS', 'PRISON', 'EMS', 'FIRE', 'DISPATCH', 'GOVERNMENT', 'FORENSICS', 'DMV', 'CUSTOMS', 'BUSINESS', 'OTHER') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `s6mdt_faction_shortName_key`(`shortName`),
    INDEX `s6mdt_faction_kind_idx`(`kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_department` (
    `id` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_department_factionId_name_key`(`factionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_rank` (
    `id` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,
    `shareTier` INTEGER NOT NULL DEFAULT 0,
    `clearance` ENUM('INTERN', 'VERTRAULICH', 'BEHOERDENINTERN', 'GEHEIM', 'HOCHGEHEIM') NOT NULL DEFAULT 'INTERN',
    `grants` JSON NULL,

    INDEX `s6mdt_rank_factionId_level_idx`(`factionId`, `level`),
    UNIQUE INDEX `s6mdt_rank_factionId_name_key`(`factionId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_faction_membership` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `rankId` CHAR(36) NULL,
    `departmentId` CHAR(36) NULL,
    `callsign` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `extraGrants` JSON NULL,

    INDEX `s6mdt_faction_membership_factionId_idx`(`factionId`),
    UNIQUE INDEX `s6mdt_faction_membership_userId_factionId_key`(`userId`, `factionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_citizen` (
    `id` CHAR(36) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `fivemCharId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `photo` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `s6mdt_citizen_fivemCharId_key`(`fivemCharId`),
    INDEX `s6mdt_citizen_lastName_firstName_idx`(`lastName`, `firstName`),
    INDEX `s6mdt_citizen_fivemCharId_idx`(`fivemCharId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_vehicle` (
    `id` CHAR(36) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `ownerId` CHAR(36) NULL,
    `stolen` BOOLEAN NOT NULL DEFAULT false,
    `impounded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_vehicle_plate_key`(`plate`),
    INDEX `s6mdt_vehicle_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_vehicle_activity` (
    `id` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `activityType` VARCHAR(191) NOT NULL,
    `location` TEXT NULL,
    `notes` TEXT NULL,
    `byUserId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_vehicle_activity_vehicleId_createdAt_idx`(`vehicleId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_vehicle_registration` (
    `id` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `registeredTo` VARCHAR(191) NULL,
    `validUntil` DATETIME(3) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_vehicle_registration_vehicleId_key`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_insurance` (
    `id` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `policyNo` VARCHAR(191) NOT NULL,
    `validUntil` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_insurance_vehicleId_key`(`vehicleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_property` (
    `id` CHAR(36) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `address` TEXT NOT NULL,
    `ownerId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_property_ownerId_idx`(`ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_case_file` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('PERSONENAKTE', 'ERMITTLUNGSAKTE', 'STRAFAKTE', 'FORENSIKAKTE', 'OBDUKTIONSBERICHT', 'PATIENTENAKTE', 'GERICHTSAKTE', 'STAATSANWALTSCHAFTSAKTE', 'GEFAENGNISAKTE', 'UNTERNEHMENSAKTE', 'VERWALTUNGSAKTE') NOT NULL,
    `title` TEXT NOT NULL,
    `summary` TEXT NULL,
    `status` ENUM('ENTWURF', 'OFFEN', 'IN_BEARBEITUNG', 'GESCHLOSSEN', 'ARCHIVIERT') NOT NULL DEFAULT 'ENTWURF',
    `securityLevel` ENUM('INTERN', 'VERTRAULICH', 'BEHOERDENINTERN', 'GEHEIM', 'HOCHGEHEIM') NOT NULL DEFAULT 'INTERN',
    `securityLevelRank` INTEGER NOT NULL DEFAULT 1,
    `shareStatus` ENUM('PRIVAT', 'BEANTRAGT', 'IN_PRUEFUNG', 'TEILFREIGEGEBEN', 'VOLLSTAENDIG_FREIGEGEBEN', 'ABGELEHNT', 'WIDERRUFEN') NOT NULL DEFAULT 'PRIVAT',
    `ownerFactionId` CHAR(36) NOT NULL,
    `creatorId` CHAR(36) NOT NULL,
    `subjectCitizenId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `s6mdt_case_file_ownerFactionId_type_idx`(`ownerFactionId`, `type`),
    INDEX `s6mdt_case_file_securityLevelRank_idx`(`securityLevelRank`),
    INDEX `s6mdt_case_file_subjectCitizenId_idx`(`subjectCitizenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_case_file_link` (
    `id` CHAR(36) NOT NULL,
    `sourceId` CHAR(36) NOT NULL,
    `targetId` CHAR(36) NOT NULL,
    `relation` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_case_file_link_sourceId_targetId_key`(`sourceId`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_file_share` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NOT NULL,
    `targetType` ENUM('PERSON', 'ROLLE', 'ABTEILUNG', 'FRAKTION', 'BEHOERDE') NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `status` ENUM('PRIVAT', 'BEANTRAGT', 'IN_PRUEFUNG', 'TEILFREIGEGEBEN', 'VOLLSTAENDIG_FREIGEGEBEN', 'ABGELEHNT', 'WIDERRUFEN') NOT NULL DEFAULT 'BEANTRAGT',
    `reason` TEXT NULL,
    `allowedFields` JSON NULL,
    `requestedById` CHAR(36) NOT NULL,
    `decidedById` CHAR(36) NULL,
    `decidedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_file_share_caseFileId_idx`(`caseFileId`),
    INDEX `s6mdt_file_share_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_forensic_detail` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NOT NULL,
    `dna` JSON NULL,
    `fingerprints` JSON NULL,
    `ballistics` JSON NULL,
    `toxicology` JSON NULL,
    `autopsy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_forensic_detail_caseFileId_key`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_evidence_item` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `storageRef` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_evidence_item_caseFileId_idx`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_custody_event` (
    `id` CHAR(36) NOT NULL,
    `evidenceId` CHAR(36) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `byUserId` CHAR(36) NOT NULL,
    `location` TEXT NULL,
    `note` TEXT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_custody_event_evidenceId_at_idx`(`evidenceId`, `at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_patient_record` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NULL,
    `publicStatus` VARCHAR(191) NOT NULL DEFAULT 'STATUS',
    `diagnoses` JSON NULL,
    `medications` JSON NULL,
    `psychNotes` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_patient_record_caseFileId_key`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_medical_incident` (
    `id` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NULL,
    `emsUserId` CHAR(36) NULL,
    `type` VARCHAR(191) NOT NULL,
    `location` TEXT NULL,
    `outcome` TEXT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_medical_incident_citizenId_idx`(`citizenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_fire_incident` (
    `id` CHAR(36) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `location` TEXT NOT NULL,
    `severity` INTEGER NOT NULL DEFAULT 1,
    `reportCaseFileId` CHAR(36) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_penal_code` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `class` ENUM('INFRACTION', 'MISDEMEANOR', 'FELONY') NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Vergehen',
    `description` TEXT NULL,
    `fineMin` INTEGER NOT NULL DEFAULT 0,
    `fineMax` INTEGER NOT NULL DEFAULT 0,
    `jailDaysMin` INTEGER NOT NULL DEFAULT 0,
    `jailDaysMax` INTEGER NOT NULL DEFAULT 0,
    `points` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_penal_code_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_charge` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `citizenId` CHAR(36) NOT NULL,
    `penalCodeId` CHAR(36) NOT NULL,
    `status` ENUM('PENDING', 'FILED', 'CONVICTED', 'DISMISSED', 'DROPPED') NOT NULL DEFAULT 'PENDING',
    `count` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `byUserId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_charge_citizenId_idx`(`citizenId`),
    INDEX `s6mdt_charge_caseFileId_idx`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_warrant` (
    `id` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `title` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `type` ENUM('ARREST', 'SEARCH', 'BENCH') NOT NULL DEFAULT 'ARREST',
    `status` ENUM('ACTIVE', 'EXECUTED', 'EXPIRED', 'RECALLED') NOT NULL DEFAULT 'ACTIVE',
    `reason` TEXT NOT NULL,
    `issuedById` CHAR(36) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    INDEX `s6mdt_warrant_citizenId_status_idx`(`citizenId`, `status`),
    INDEX `s6mdt_warrant_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_bolo` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `citizenId` CHAR(36) NULL,
    `plate` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `byUserId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_bolo_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_arrest_record` (
    `id` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `officerId` CHAR(36) NOT NULL,
    `location` TEXT NULL,
    `notes` TEXT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_arrest_record_citizenId_idx`(`citizenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_fine` (
    `id` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NOT NULL,
    `penalCodeId` CHAR(36) NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('UNPAID', 'PAID', 'CONTESTED', 'WAIVED') NOT NULL DEFAULT 'UNPAID',
    `officerId` CHAR(36) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `paidAt` DATETIME(3) NULL,

    INDEX `s6mdt_fine_citizenId_status_idx`(`citizenId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_court_case` (
    `id` CHAR(36) NOT NULL,
    `number` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('CRIMINAL', 'CIVIL', 'TRAFFIC', 'APPEAL') NOT NULL DEFAULT 'CRIMINAL',
    `status` ENUM('FILED', 'SCHEDULED', 'IN_TRIAL', 'ADJOURNED', 'CLOSED', 'DISMISSED') NOT NULL DEFAULT 'FILED',
    `title` TEXT NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `defendantId` CHAR(36) NULL,
    `prosecutorId` CHAR(36) NULL,
    `defenseId` CHAR(36) NULL,
    `judgeId` CHAR(36) NULL,
    `filedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_court_case_number_key`(`number`),
    INDEX `s6mdt_court_case_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_court_hearing` (
    `id` CHAR(36) NOT NULL,
    `courtCaseId` CHAR(36) NOT NULL,
    `type` ENUM('ARRAIGNMENT', 'PRELIMINARY', 'TRIAL', 'SENTENCING', 'APPEAL') NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `room` VARCHAR(191) NULL,
    `notes` TEXT NULL,

    INDEX `s6mdt_court_hearing_courtCaseId_scheduledAt_idx`(`courtCaseId`, `scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_verdict` (
    `id` CHAR(36) NOT NULL,
    `courtCaseId` CHAR(36) NOT NULL,
    `type` ENUM('GUILTY', 'NOT_GUILTY', 'DISMISSED', 'MISTRIAL', 'PLEA') NOT NULL,
    `summary` TEXT NULL,
    `judgeId` CHAR(36) NULL,
    `decidedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_verdict_courtCaseId_idx`(`courtCaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_sentence` (
    `id` CHAR(36) NOT NULL,
    `courtCaseId` CHAR(36) NOT NULL,
    `verdictId` CHAR(36) NULL,
    `type` ENUM('PRISON', 'FINE', 'PROBATION', 'COMMUNITY_SERVICE', 'DEATH') NOT NULL,
    `jailDays` INTEGER NULL,
    `fineAmount` INTEGER NULL,
    `probationDays` INTEGER NULL,
    `communityHours` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_sentence_courtCaseId_idx`(`courtCaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_inmate` (
    `id` CHAR(36) NOT NULL,
    `bookingNumber` INTEGER NOT NULL AUTO_INCREMENT,
    `citizenId` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `sentenceId` CHAR(36) NULL,
    `status` ENUM('BOOKED', 'INCARCERATED', 'PAROLE', 'RELEASED', 'TRANSFERRED') NOT NULL DEFAULT 'BOOKED',
    `cell` VARCHAR(191) NULL,
    `propertyHeld` JSON NULL,
    `jailSeconds` INTEGER NULL,
    `reason` TEXT NULL,
    `officerId` CHAR(36) NULL,
    `intakeAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `releaseAt` DATETIME(3) NULL,
    `servedAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_inmate_bookingNumber_key`(`bookingNumber`),
    UNIQUE INDEX `s6mdt_inmate_sentenceId_key`(`sentenceId`),
    INDEX `s6mdt_inmate_citizenId_status_idx`(`citizenId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_fivem_command` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('FINE', 'JAIL', 'RELEASE') NOT NULL,
    `status` ENUM('PENDING', 'DELIVERED', 'DONE', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `targetIdentifier` VARCHAR(191) NOT NULL,
    `citizenId` CHAR(36) NULL,
    `fineId` CHAR(36) NULL,
    `inmateId` CHAR(36) NULL,
    `amount` INTEGER NULL,
    `jailSeconds` INTEGER NULL,
    `reason` TEXT NULL,
    `error` TEXT NULL,
    `claimId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deliveredAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,

    INDEX `s6mdt_fivem_command_targetIdentifier_status_idx`(`targetIdentifier`, `status`),
    INDEX `s6mdt_fivem_command_status_idx`(`status`),
    INDEX `s6mdt_fivem_command_claimId_idx`(`claimId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_license` (
    `id` CHAR(36) NOT NULL,
    `type` ENUM('DRIVER', 'WEAPON', 'BUSINESS', 'PILOT', 'HUNTING', 'MEDICAL', 'LAW') NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    `citizenId` CHAR(36) NOT NULL,
    `issuedByFactionId` CHAR(36) NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_license_number_key`(`number`),
    INDEX `s6mdt_license_citizenId_type_idx`(`citizenId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_gov_law` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `effective` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `s6mdt_gov_law_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_customs_declaration` (
    `id` CHAR(36) NOT NULL,
    `declarantId` CHAR(36) NULL,
    `goods` JSON NOT NULL,
    `declaredValue` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DECLARED', 'CLEARED', 'SEIZED') NOT NULL DEFAULT 'DECLARED',
    `inspectorId` CHAR(36) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_customs_declaration_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_business` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('GENERAL', 'RESTAURANT', 'REAL_ESTATE', 'MECHANIC', 'SECURITY', 'NEWS', 'OTHER') NOT NULL DEFAULT 'GENERAL',
    `ownerId` CHAR(36) NULL,
    `address` TEXT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_business_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_business_employee` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NOT NULL,
    `role` VARCHAR(191) NULL,
    `wage` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
    `hiredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_business_employee_businessId_citizenId_key`(`businessId`, `citizenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_menu_item` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `category` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_real_estate_listing` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NULL,
    `propertyId` CHAR(36) NOT NULL,
    `price` INTEGER NOT NULL,
    `status` ENUM('AVAILABLE', 'RESERVED', 'SOLD') NOT NULL DEFAULT 'AVAILABLE',
    `agentId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_real_estate_listing_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_mechanic_job` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NOT NULL,
    `vehicleId` CHAR(36) NULL,
    `description` TEXT NOT NULL,
    `cost` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_mechanic_job_businessId_status_idx`(`businessId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_security_contract` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NOT NULL,
    `clientName` VARCHAR(191) NOT NULL,
    `details` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_news_article` (
    `id` CHAR(36) NOT NULL,
    `businessId` CHAR(36) NULL,
    `authorId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_news_article_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_dispatch_call` (
    `id` CHAR(36) NOT NULL,
    `number` INTEGER NOT NULL AUTO_INCREMENT,
    `line` ENUM('POLICE_911', 'NON_EMERGENCY_311', 'EMS_112', 'BEHOERDENTELEFON') NOT NULL,
    `callerName` VARCHAR(191) NULL,
    `location` TEXT NOT NULL,
    `postal` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` ENUM('P1', 'P2', 'P3', 'P4') NOT NULL DEFAULT 'P3',
    `status` ENUM('OFFEN', 'DISPATCHED', 'UNTERWEGS', 'VOR_ORT', 'TRANSPORT', 'ABGESCHLOSSEN') NOT NULL DEFAULT 'OFFEN',
    `sectorId` CHAR(36) NULL,
    `alertKind` VARCHAR(191) NULL,
    `officerId` CHAR(36) NULL,
    `x` DOUBLE NULL,
    `y` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `closedAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_dispatch_call_number_key`(`number`),
    INDEX `s6mdt_dispatch_call_status_priority_idx`(`status`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_call_note` (
    `id` CHAR(36) NOT NULL,
    `callId` CHAR(36) NOT NULL,
    `byUserId` CHAR(36) NOT NULL,
    `note` TEXT NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_call_note_callId_at_idx`(`callId`, `at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_sector` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `polygon` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_sector_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_status_code` (
    `id` CHAR(36) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,

    UNIQUE INDEX `s6mdt_status_code_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_unit` (
    `id` CHAR(36) NOT NULL,
    `callsign` VARCHAR(191) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `channel` VARCHAR(191) NULL,
    `sectorId` CHAR(36) NULL,
    `status` ENUM('FREI', 'STREIFE', 'VERKEHRSKONTROLLE', 'EINSATZ', 'VERFOLGUNG', 'KRANKENHAUS', 'PAUSE', 'AUSSER_DIENST') NOT NULL DEFAULT 'AUSSER_DIENST',
    `x` DOUBLE NULL,
    `y` DOUBLE NULL,
    `heading` DOUBLE NULL,
    `zone` VARCHAR(191) NULL,
    `lastSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_unit_factionId_status_idx`(`factionId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_radio_channel` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `factionId` CHAR(36) NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_radio_channel_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_radio_member` (
    `id` CHAR(36) NOT NULL,
    `channelId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `callsign` VARCHAR(191) NULL,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_radio_member_userId_idx`(`userId`),
    UNIQUE INDEX `s6mdt_radio_member_channelId_userId_key`(`channelId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_unit_member` (
    `id` CHAR(36) NOT NULL,
    `unitId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `isLead` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `s6mdt_unit_member_unitId_userId_key`(`unitId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_unit_assignment` (
    `id` CHAR(36) NOT NULL,
    `callId` CHAR(36) NOT NULL,
    `unitId` CHAR(36) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `clearedAt` DATETIME(3) NULL,

    UNIQUE INDEX `s6mdt_unit_assignment_callId_unitId_key`(`callId`, `unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_shift_log` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `rankName` VARCHAR(191) NULL,
    `shiftType` ENUM('FRUEH', 'SPAET', 'NACHT', 'SONDERDIENST') NOT NULL DEFAULT 'FRUEH',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationSec` INTEGER NULL,
    `autoClosed` BOOLEAN NOT NULL DEFAULT false,

    INDEX `s6mdt_shift_log_userId_startedAt_idx`(`userId`, `startedAt`),
    INDEX `s6mdt_shift_log_factionId_startedAt_idx`(`factionId`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_shift_schedule` (
    `id` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `shiftType` ENUM('FRUEH', 'SPAET', 'NACHT', 'SONDERDIENST') NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `recurring` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_shift_schedule_factionId_startsAt_idx`(`factionId`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_shift_assignment` (
    `id` CHAR(36) NOT NULL,
    `scheduleId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `isStandIn` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `s6mdt_shift_assignment_scheduleId_userId_key`(`scheduleId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_leave_request` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `factionId` CHAR(36) NOT NULL,
    `type` ENUM('VACATION', 'SICK', 'OTHER') NOT NULL,
    `status` ENUM('REQUESTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'REQUESTED',
    `fromDate` DATETIME(3) NOT NULL,
    `toDate` DATETIME(3) NOT NULL,
    `reason` TEXT NULL,
    `decidedById` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_leave_request_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_workflow_definition` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `appliesToType` ENUM('PERSONENAKTE', 'ERMITTLUNGSAKTE', 'STRAFAKTE', 'FORENSIKAKTE', 'OBDUKTIONSBERICHT', 'PATIENTENAKTE', 'GERICHTSAKTE', 'STAATSANWALTSCHAFTSAKTE', 'GEFAENGNISAKTE', 'UNTERNEHMENSAKTE', 'VERWALTUNGSAKTE') NULL,
    `factionId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_workflow_definition_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_workflow_state` (
    `id` CHAR(36) NOT NULL,
    `definitionId` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isInitial` BOOLEAN NOT NULL DEFAULT false,
    `isFinal` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `s6mdt_workflow_state_definitionId_key_key`(`definitionId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_workflow_transition` (
    `id` CHAR(36) NOT NULL,
    `definitionId` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fromStateId` CHAR(36) NOT NULL,
    `toStateId` CHAR(36) NOT NULL,
    `allowedRoles` JSON NULL,

    INDEX `s6mdt_workflow_transition_definitionId_idx`(`definitionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_workflow_instance` (
    `id` CHAR(36) NOT NULL,
    `definitionId` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `currentStateId` CHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `s6mdt_workflow_instance_status_idx`(`status`),
    INDEX `s6mdt_workflow_instance_caseFileId_idx`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_workflow_task` (
    `id` CHAR(36) NOT NULL,
    `instanceId` CHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `assigneeUserId` CHAR(36) NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE') NOT NULL DEFAULT 'TODO',
    `dueAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_workflow_task_instanceId_status_idx`(`instanceId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_document` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `storageRef` TEXT NOT NULL,
    `size` INTEGER NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `uploadedById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_document_caseFileId_idx`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_document_version` (
    `id` CHAR(36) NOT NULL,
    `documentId` CHAR(36) NOT NULL,
    `version` INTEGER NOT NULL,
    `storageRef` TEXT NOT NULL,
    `size` INTEGER NOT NULL,
    `uploadedById` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_document_version_documentId_version_key`(`documentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_signature` (
    `id` CHAR(36) NOT NULL,
    `caseFileId` CHAR(36) NOT NULL,
    `signerId` CHAR(36) NOT NULL,
    `payloadHash` VARCHAR(191) NOT NULL,
    `signedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_signature_caseFileId_idx`(`caseFileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_notification` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `type` ENUM('INFO', 'WARNING', 'SHARE_REQUEST', 'ASSIGNMENT', 'ALERT') NOT NULL DEFAULT 'INFO',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `refType` VARCHAR(191) NULL,
    `refId` VARCHAR(191) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_notification_userId_read_idx`(`userId`, `read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_chat_message` (
    `id` CHAR(36) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `senderId` CHAR(36) NOT NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_chat_message_channel_createdAt_idx`(`channel`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_user_settings` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'system',
    `notifyDispatch` BOOLEAN NOT NULL DEFAULT true,
    `notifyChat` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `s6mdt_user_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_tag` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL DEFAULT 'gray',
    `category` VARCHAR(191) NULL,
    `factionId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `s6mdt_tag_name_factionId_key`(`name`, `factionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_citizen_tag` (
    `id` CHAR(36) NOT NULL,
    `citizenId` CHAR(36) NOT NULL,
    `tagId` CHAR(36) NOT NULL,
    `byUserId` CHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `s6mdt_citizen_tag_citizenId_idx`(`citizenId`),
    UNIQUE INDEX `s6mdt_citizen_tag_citizenId_tagId_key`(`citizenId`, `tagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `s6mdt_audit_log` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NULL,
    `factionId` CHAR(36) NULL,
    `rankName` VARCHAR(191) NULL,
    `action` ENUM('CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE', 'REVOKE', 'LOGIN', 'LOGOUT', 'EXPORT', 'SIGN') NOT NULL,
    `subjectType` VARCHAR(191) NOT NULL,
    `subjectId` VARCHAR(191) NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `prevHash` VARCHAR(191) NULL,
    `hash` VARCHAR(191) NOT NULL,

    INDEX `s6mdt_audit_log_subjectType_subjectId_idx`(`subjectType`, `subjectId`),
    INDEX `s6mdt_audit_log_userId_at_idx`(`userId`, `at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `s6mdt_refresh_token` ADD CONSTRAINT `s6mdt_refresh_token_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_department` ADD CONSTRAINT `s6mdt_department_factionId_fkey` FOREIGN KEY (`factionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_rank` ADD CONSTRAINT `s6mdt_rank_factionId_fkey` FOREIGN KEY (`factionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_faction_membership` ADD CONSTRAINT `s6mdt_faction_membership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_faction_membership` ADD CONSTRAINT `s6mdt_faction_membership_factionId_fkey` FOREIGN KEY (`factionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_faction_membership` ADD CONSTRAINT `s6mdt_faction_membership_rankId_fkey` FOREIGN KEY (`rankId`) REFERENCES `s6mdt_rank`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_faction_membership` ADD CONSTRAINT `s6mdt_faction_membership_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `s6mdt_department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_vehicle` ADD CONSTRAINT `s6mdt_vehicle_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_vehicle_activity` ADD CONSTRAINT `s6mdt_vehicle_activity_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `s6mdt_vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_vehicle_registration` ADD CONSTRAINT `s6mdt_vehicle_registration_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `s6mdt_vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_insurance` ADD CONSTRAINT `s6mdt_insurance_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `s6mdt_vehicle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_property` ADD CONSTRAINT `s6mdt_property_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_case_file` ADD CONSTRAINT `s6mdt_case_file_ownerFactionId_fkey` FOREIGN KEY (`ownerFactionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_case_file` ADD CONSTRAINT `s6mdt_case_file_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `s6mdt_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_case_file` ADD CONSTRAINT `s6mdt_case_file_subjectCitizenId_fkey` FOREIGN KEY (`subjectCitizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_case_file_link` ADD CONSTRAINT `s6mdt_case_file_link_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_case_file_link` ADD CONSTRAINT `s6mdt_case_file_link_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_file_share` ADD CONSTRAINT `s6mdt_file_share_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_forensic_detail` ADD CONSTRAINT `s6mdt_forensic_detail_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_evidence_item` ADD CONSTRAINT `s6mdt_evidence_item_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_custody_event` ADD CONSTRAINT `s6mdt_custody_event_evidenceId_fkey` FOREIGN KEY (`evidenceId`) REFERENCES `s6mdt_evidence_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_patient_record` ADD CONSTRAINT `s6mdt_patient_record_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_patient_record` ADD CONSTRAINT `s6mdt_patient_record_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_medical_incident` ADD CONSTRAINT `s6mdt_medical_incident_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_charge` ADD CONSTRAINT `s6mdt_charge_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_charge` ADD CONSTRAINT `s6mdt_charge_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_charge` ADD CONSTRAINT `s6mdt_charge_penalCodeId_fkey` FOREIGN KEY (`penalCodeId`) REFERENCES `s6mdt_penal_code`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_warrant` ADD CONSTRAINT `s6mdt_warrant_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_warrant` ADD CONSTRAINT `s6mdt_warrant_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_arrest_record` ADD CONSTRAINT `s6mdt_arrest_record_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_arrest_record` ADD CONSTRAINT `s6mdt_arrest_record_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_fine` ADD CONSTRAINT `s6mdt_fine_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_fine` ADD CONSTRAINT `s6mdt_fine_penalCodeId_fkey` FOREIGN KEY (`penalCodeId`) REFERENCES `s6mdt_penal_code`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_court_case` ADD CONSTRAINT `s6mdt_court_case_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_court_case` ADD CONSTRAINT `s6mdt_court_case_defendantId_fkey` FOREIGN KEY (`defendantId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_court_hearing` ADD CONSTRAINT `s6mdt_court_hearing_courtCaseId_fkey` FOREIGN KEY (`courtCaseId`) REFERENCES `s6mdt_court_case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_verdict` ADD CONSTRAINT `s6mdt_verdict_courtCaseId_fkey` FOREIGN KEY (`courtCaseId`) REFERENCES `s6mdt_court_case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_sentence` ADD CONSTRAINT `s6mdt_sentence_courtCaseId_fkey` FOREIGN KEY (`courtCaseId`) REFERENCES `s6mdt_court_case`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_sentence` ADD CONSTRAINT `s6mdt_sentence_verdictId_fkey` FOREIGN KEY (`verdictId`) REFERENCES `s6mdt_verdict`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_inmate` ADD CONSTRAINT `s6mdt_inmate_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_inmate` ADD CONSTRAINT `s6mdt_inmate_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_inmate` ADD CONSTRAINT `s6mdt_inmate_sentenceId_fkey` FOREIGN KEY (`sentenceId`) REFERENCES `s6mdt_sentence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_license` ADD CONSTRAINT `s6mdt_license_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_license` ADD CONSTRAINT `s6mdt_license_issuedByFactionId_fkey` FOREIGN KEY (`issuedByFactionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_customs_declaration` ADD CONSTRAINT `s6mdt_customs_declaration_declarantId_fkey` FOREIGN KEY (`declarantId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_business` ADD CONSTRAINT `s6mdt_business_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_business_employee` ADD CONSTRAINT `s6mdt_business_employee_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_business_employee` ADD CONSTRAINT `s6mdt_business_employee_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_menu_item` ADD CONSTRAINT `s6mdt_menu_item_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_real_estate_listing` ADD CONSTRAINT `s6mdt_real_estate_listing_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_real_estate_listing` ADD CONSTRAINT `s6mdt_real_estate_listing_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `s6mdt_property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_mechanic_job` ADD CONSTRAINT `s6mdt_mechanic_job_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_mechanic_job` ADD CONSTRAINT `s6mdt_mechanic_job_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `s6mdt_vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_security_contract` ADD CONSTRAINT `s6mdt_security_contract_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_news_article` ADD CONSTRAINT `s6mdt_news_article_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `s6mdt_business`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_dispatch_call` ADD CONSTRAINT `s6mdt_dispatch_call_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `s6mdt_sector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_call_note` ADD CONSTRAINT `s6mdt_call_note_callId_fkey` FOREIGN KEY (`callId`) REFERENCES `s6mdt_dispatch_call`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_unit` ADD CONSTRAINT `s6mdt_unit_factionId_fkey` FOREIGN KEY (`factionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_unit` ADD CONSTRAINT `s6mdt_unit_sectorId_fkey` FOREIGN KEY (`sectorId`) REFERENCES `s6mdt_sector`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_radio_member` ADD CONSTRAINT `s6mdt_radio_member_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `s6mdt_radio_channel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_unit_member` ADD CONSTRAINT `s6mdt_unit_member_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `s6mdt_unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_unit_assignment` ADD CONSTRAINT `s6mdt_unit_assignment_callId_fkey` FOREIGN KEY (`callId`) REFERENCES `s6mdt_dispatch_call`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_unit_assignment` ADD CONSTRAINT `s6mdt_unit_assignment_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `s6mdt_unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_shift_log` ADD CONSTRAINT `s6mdt_shift_log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_shift_schedule` ADD CONSTRAINT `s6mdt_shift_schedule_factionId_fkey` FOREIGN KEY (`factionId`) REFERENCES `s6mdt_faction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_shift_assignment` ADD CONSTRAINT `s6mdt_shift_assignment_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `s6mdt_shift_schedule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_state` ADD CONSTRAINT `s6mdt_workflow_state_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `s6mdt_workflow_definition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_transition` ADD CONSTRAINT `s6mdt_workflow_transition_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `s6mdt_workflow_definition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_transition` ADD CONSTRAINT `s6mdt_workflow_transition_fromStateId_fkey` FOREIGN KEY (`fromStateId`) REFERENCES `s6mdt_workflow_state`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_transition` ADD CONSTRAINT `s6mdt_workflow_transition_toStateId_fkey` FOREIGN KEY (`toStateId`) REFERENCES `s6mdt_workflow_state`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_instance` ADD CONSTRAINT `s6mdt_workflow_instance_definitionId_fkey` FOREIGN KEY (`definitionId`) REFERENCES `s6mdt_workflow_definition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_instance` ADD CONSTRAINT `s6mdt_workflow_instance_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_instance` ADD CONSTRAINT `s6mdt_workflow_instance_currentStateId_fkey` FOREIGN KEY (`currentStateId`) REFERENCES `s6mdt_workflow_state`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_workflow_task` ADD CONSTRAINT `s6mdt_workflow_task_instanceId_fkey` FOREIGN KEY (`instanceId`) REFERENCES `s6mdt_workflow_instance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_document` ADD CONSTRAINT `s6mdt_document_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_document_version` ADD CONSTRAINT `s6mdt_document_version_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `s6mdt_document`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_signature` ADD CONSTRAINT `s6mdt_signature_caseFileId_fkey` FOREIGN KEY (`caseFileId`) REFERENCES `s6mdt_case_file`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_signature` ADD CONSTRAINT `s6mdt_signature_signerId_fkey` FOREIGN KEY (`signerId`) REFERENCES `s6mdt_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_notification` ADD CONSTRAINT `s6mdt_notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_user_settings` ADD CONSTRAINT `s6mdt_user_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_citizen_tag` ADD CONSTRAINT `s6mdt_citizen_tag_citizenId_fkey` FOREIGN KEY (`citizenId`) REFERENCES `s6mdt_citizen`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_citizen_tag` ADD CONSTRAINT `s6mdt_citizen_tag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `s6mdt_tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `s6mdt_audit_log` ADD CONSTRAINT `s6mdt_audit_log_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `s6mdt_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

