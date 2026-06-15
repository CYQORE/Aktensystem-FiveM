/**
 * Zentrale Enums der Plattform. Spiegeln die Prisma-Enums in
 * packages/database/prisma/schema.prisma — Single Source of Truth für FE↔BE.
 */

/** Sicherheitsstufen einer Akte/Dokument (Level 1..5). */
export enum SecurityLevel {
  INTERN = "INTERN", // Level 1
  VERTRAULICH = "VERTRAULICH", // Level 2
  BEHOERDENINTERN = "BEHOERDENINTERN", // Level 3
  GEHEIM = "GEHEIM", // Level 4
  HOCHGEHEIM = "HOCHGEHEIM", // Level 5
}

export const SECURITY_LEVEL_RANK: Record<SecurityLevel, number> = {
  [SecurityLevel.INTERN]: 1,
  [SecurityLevel.VERTRAULICH]: 2,
  [SecurityLevel.BEHOERDENINTERN]: 3,
  [SecurityLevel.GEHEIM]: 4,
  [SecurityLevel.HOCHGEHEIM]: 5,
};

/** Aktenart (Discriminator der polymorphen CaseFile-Basis). */
export enum CaseFileType {
  PERSONENAKTE = "PERSONENAKTE",
  ERMITTLUNGSAKTE = "ERMITTLUNGSAKTE",
  STRAFAKTE = "STRAFAKTE",
  FORENSIKAKTE = "FORENSIKAKTE",
  OBDUKTIONSBERICHT = "OBDUKTIONSBERICHT",
  PATIENTENAKTE = "PATIENTENAKTE",
  GERICHTSAKTE = "GERICHTSAKTE",
  STAATSANWALTSCHAFTSAKTE = "STAATSANWALTSCHAFTSAKTE",
  GEFAENGNISAKTE = "GEFAENGNISAKTE",
  UNTERNEHMENSAKTE = "UNTERNEHMENSAKTE",
  VERWALTUNGSAKTE = "VERWALTUNGSAKTE",
}

/** Lebenszyklus-Status einer Akte. */
export enum CaseFileStatus {
  ENTWURF = "ENTWURF",
  OFFEN = "OFFEN",
  IN_BEARBEITUNG = "IN_BEARBEITUNG",
  GESCHLOSSEN = "GESCHLOSSEN",
  ARCHIVIERT = "ARCHIVIERT",
}

/** Freigabe-Workflow-Status (fraktionsübergreifende Aktenfreigabe). */
export enum ShareStatus {
  PRIVAT = "PRIVAT",
  BEANTRAGT = "BEANTRAGT",
  IN_PRUEFUNG = "IN_PRUEFUNG",
  TEILFREIGEGEBEN = "TEILFREIGEGEBEN",
  VOLLSTAENDIG_FREIGEGEBEN = "VOLLSTAENDIG_FREIGEGEBEN",
  ABGELEHNT = "ABGELEHNT",
  WIDERRUFEN = "WIDERRUFEN",
}

/** Ziel-Typ einer Freigabe. */
export enum ShareTargetType {
  PERSON = "PERSON",
  ROLLE = "ROLLE",
  ABTEILUNG = "ABTEILUNG",
  FRAKTION = "FRAKTION",
  BEHOERDE = "BEHOERDE",
}

/** Notruf-Kanäle. */
export enum EmergencyLine {
  POLICE_911 = "POLICE_911",
  NON_EMERGENCY_311 = "NON_EMERGENCY_311",
  EMS_112 = "EMS_112",
  BEHOERDENTELEFON = "BEHOERDENTELEFON",
}

/** Einsatz-Prioritäten. */
export enum DispatchPriority {
  P1 = "P1",
  P2 = "P2",
  P3 = "P3",
  P4 = "P4",
}

/** Einsatz-Status (CAD). */
export enum DispatchStatus {
  OFFEN = "OFFEN",
  DISPATCHED = "DISPATCHED",
  UNTERWEGS = "UNTERWEGS",
  VOR_ORT = "VOR_ORT",
  TRANSPORT = "TRANSPORT",
  ABGESCHLOSSEN = "ABGESCHLOSSEN",
}

/** Live-Status einer Einheit (Leitstellenblatt). */
export enum UnitStatus {
  FREI = "FREI",
  STREIFE = "STREIFE",
  VERKEHRSKONTROLLE = "VERKEHRSKONTROLLE",
  EINSATZ = "EINSATZ",
  VERFOLGUNG = "VERFOLGUNG",
  KRANKENHAUS = "KRANKENHAUS",
  PAUSE = "PAUSE",
  AUSSER_DIENST = "AUSSER_DIENST",
}

/** Schichttypen (Workforce). */
export enum ShiftType {
  FRUEH = "FRUEH",
  SPAET = "SPAET",
  NACHT = "NACHT",
  SONDERDIENST = "SONDERDIENST",
}

/** Patienten-Sichtbarkeit für externe Behörden (EMS-Datenschutz). */
export enum PatientPoliceVisibility {
  STATUS = "STATUS",
  TRANSPORTIERT = "TRANSPORTIERT",
  ENTLASSEN = "ENTLASSEN",
  VERSTORBEN = "VERSTORBEN",
}

/** Unterstützte FiveM-Frameworks (Adapter). */
export enum FrameworkAdapter {
  STANDALONE = "STANDALONE",
  QBCORE = "QBCORE",
  QBOX = "QBOX",
  ESX = "ESX",
}

/** Audit-Aktionstypen. */
export enum AuditAction {
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  SHARE = "SHARE",
  REVOKE = "REVOKE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  SIGN = "SIGN",
}
