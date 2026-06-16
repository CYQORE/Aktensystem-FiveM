import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from "@casl/ability";
import { SECURITY_LEVEL_RANK, SecurityLevel } from "@aktensystem/shared";

/**
 * RBAC-Kern — eine Quelle für Rechte, geteilt zwischen NestJS (Guard) und
 * Frontend (UI-Gating). Rechte ergeben sich aus:
 *   Fraktion -> Abteilung -> Rang -> User (+ individuelle Grants)
 *
 * Subjects = Domänen-Entitäten, Actions = CRUD + Domänen-Verben.
 */

export type AppAction =
  | "manage" // wildcard
  | "create"
  | "read"
  | "update"
  | "delete"
  | "share" // Akte freigeben
  | "approve" // Freigabe genehmigen
  | "revoke" // Freigabe widerrufen
  | "sign" // digitale Signatur
  | "dispatch"; // Einsatz zuweisen

export type AppSubject =
  | "CaseFile"
  | "FileShare"
  | "Citizen"
  | "Vehicle"
  | "Property"
  | "DispatchCall"
  | "Unit"
  | "ShiftLog"
  | "Document"
  | "AuditLog"
  | "PatientRecord"
  | "EvidenceItem"
  | "CourtCase"
  | "PenalCode"
  | "Warrant"
  | "Bolo"
  | "Fine"
  | "Inmate"
  | "RadioChannel"
  | "PlatformModule"
  | "Faction"
  | "User"
  | "all";

export type AppAbility = MongoAbility<[AppAction, AppSubject]>;

/** Rang-Tier bestimmt maximale Freigabe-Reichweite (Officer..Chief). */
export enum RankTier {
  OFFICER = 0, // keine externe Freigabe
  SERGEANT = 1, // interne Freigaben
  LIEUTENANT = 2, // behördenübergreifende Freigaben
  CAPTAIN = 3, // vertrauliche Freigaben
  CHIEF = 4, // vollständige Freigaben
}

export interface ActorContext {
  userId: string;
  factionId: string | null;
  departmentIds: string[];
  rankTier: RankTier;
  /** Höchste Sicherheitsfreigabe des Nutzers. */
  clearance: SecurityLevel;
  /** Einzelne, explizit gewährte Rechte (override). */
  extraGrants?: Array<{ action: AppAction; subject: AppSubject }>;
  isPlatformAdmin?: boolean;
}

/**
 * Baut die CASL-Ability für einen Actor.
 * Field-/Record-Level-Bedingungen (z.B. ownerFactionId) werden über CASL
 * `conditions` ausgedrückt und in NestJS gegen den Datensatz geprüft.
 */
export function defineAbilityFor(ctx: ActorContext): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(
    createMongoAbility,
  );

  if (ctx.isPlatformAdmin) {
    can("manage", "all");
    return build();
  }

  // Lesen eigener Fraktionsakten bis zur eigenen Clearance
  can("read", "CaseFile", {
    ownerFactionId: ctx.factionId,
    securityLevelRank: { $lte: SECURITY_LEVEL_RANK[ctx.clearance] },
  } as never);
  can("create", "CaseFile", { ownerFactionId: ctx.factionId } as never);
  can("update", "CaseFile", { ownerFactionId: ctx.factionId } as never);

  // Freigabe-Reichweite nach Rang
  if (ctx.rankTier >= RankTier.SERGEANT) {
    can("share", "CaseFile", {
      ownerFactionId: ctx.factionId,
      securityLevelRank: { $lte: SECURITY_LEVEL_RANK[SecurityLevel.INTERN] },
    } as never);
  }
  if (ctx.rankTier >= RankTier.LIEUTENANT) {
    can("share", "CaseFile", {
      securityLevelRank: {
        $lte: SECURITY_LEVEL_RANK[SecurityLevel.BEHOERDENINTERN],
      },
    } as never);
  }
  if (ctx.rankTier >= RankTier.CAPTAIN) {
    can("share", "CaseFile", {
      securityLevelRank: { $lte: SECURITY_LEVEL_RANK[SecurityLevel.GEHEIM] },
    } as never);
    can("approve", "FileShare");
  }
  if (ctx.rankTier >= RankTier.CHIEF) {
    can("share", "CaseFile");
    can("revoke", "FileShare");
  }

  // Dispatch-Recht (Leitstelle) — typischerweise via Department-Grant
  can("read", "DispatchCall");
  can("read", "Unit");
  can("update", "Unit"); // Status/Sektor/Funk setzen
  can("create", "DispatchCall");
  // Funk (Radio-Kanäle): lesen + Kanäle beitreten/verlassen für alle Mitglieder;
  // Kanäle anlegen/löschen bleibt Admin (manage all).
  can("read", "RadioChannel");
  can("update", "RadioChannel"); // join/leave

  // Allgemeine Lese-/Workforce-Rechte für authentifizierte Mitglieder
  can("read", "ShiftLog");
  can("read", "Citizen");
  can("create", "Citizen");
  can("update", "Citizen");
  can("read", "Vehicle");
  can("create", "Vehicle");
  can("update", "Vehicle");
  can("read", "Property");
  can("read", "Document");
  can("create", "Document");
  can("update", "Document");
  can("read", "FileShare");
  // Forensik (Beweismittel + Chain-of-Custody)
  can("read", "EvidenceItem");
  can("create", "EvidenceItem");
  can("update", "EvidenceItem");
  // Justiz / Gericht
  can("read", "CourtCase");
  can("create", "CourtCase");
  can("update", "CourtCase");
  // Strafkatalog: lesen alle; Pflege (create/update/delete) nur Admin (manage all)
  can("read", "PenalCode");
  // Haftbefehle + Fahndung
  can("read", "Warrant");
  can("create", "Warrant");
  can("update", "Warrant");
  can("read", "Bolo");
  can("create", "Bolo");
  can("update", "Bolo");
  can("delete", "Bolo");
  // Bußgelder + Haft (Vollzug läuft in-game über die Lua-Bridge).
  // Bewusst NICHT fraktionsgebunden: Fine/Inmate tragen kein ownerFactionId —
  // Strafvollzug ist eine behördenübergreifende, gemeinsame Ressource (z. B. DOC
  // lässt Insassen anderer Behörden frei). Jede authentifizierte Mitgliedschaft darf
  // verwalten; die Aktionen sind nicht-vertraulich (nur Status + Lua-Befehl).
  can("read", "Fine");
  can("create", "Fine");
  can("update", "Fine");
  can("read", "Inmate");
  can("create", "Inmate");
  can("update", "Inmate");
  // Modul-Registry (lesen für dynamische Nav; Schalten nur Admin)
  can("read", "PlatformModule");

  // Audit ist niemals schreib-/löschbar (append-only, Backend-seitig)
  cannot("update", "AuditLog");
  cannot("delete", "AuditLog");

  // Individuelle Grants zuletzt (höchste Priorität)
  for (const g of ctx.extraGrants ?? []) {
    can(g.action, g.subject);
  }

  return build();
}

/** Liefert true, wenn `actorClearance` Stufe `level` einsehen darf. */
export function canViewSecurityLevel(
  actorClearance: SecurityLevel,
  level: SecurityLevel,
): boolean {
  return SECURITY_LEVEL_RANK[actorClearance] >= SECURITY_LEVEL_RANK[level];
}
