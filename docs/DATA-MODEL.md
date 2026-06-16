# Datenmodell (Vollmodell, Phase 2)

Quelle: [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma)
(65 Tabellen). **DB-Engine: MySQL/MariaDB** (dieselbe DB wie der FiveM-Server) — alle Tabellen
mit Prefix **`s6mdt_`** (keine Kollision mit ESX). IDs = `CHAR(36)`-UUID, Langtext = `TEXT`,
Listen = `JSON` (MySQL kennt keine Scalar-Arrays). Import-SQL:
[`packages/database/sql/s6mdt_mysql.sql`](../packages/database/sql/s6mdt_mysql.sql) — Anleitung
in [`DB-IMPORT.md`](DB-IMPORT.md).

## Modell-Inventar nach Domäne

| Domäne | Modelle |
|---|---|
| Identity/Auth | User, RefreshToken |
| RBAC | Faction, Department, Rank, FactionMembership |
| Register | Citizen, Vehicle, VehicleRegistration, Insurance, Property |
| Aktensystem | CaseFile, CaseFileLink, FileShare |
| Forensik | ForensicDetail, EvidenceItem, CustodyEvent |
| Medical | PatientRecord, MedicalIncident, FireIncident |
| Justice | PenalCode, Charge, Warrant, Bolo, ArrestRecord, Fine, CourtCase, CourtHearing, Verdict, Sentence |
| Corrections | Inmate |
| Government/DMV/Customs | License, GovLaw, CustomsDeclaration |
| Business | Business, BusinessEmployee, MenuItem, RealEstateListing, MechanicJob, SecurityContract, NewsArticle |
| Dispatch/CAD | DispatchCall, CallNote, Sector, StatusCode, Unit, UnitMember, UnitAssignment |
| Workforce | ShiftLog, ShiftSchedule, ShiftAssignment, LeaveRequest |
| Workflow-Engine | WorkflowDefinition, WorkflowState, WorkflowTransition, WorkflowInstance, WorkflowTask |
| Dokumente | Document, DocumentVersion, Signature |
| Platform | Notification, AuditLog |

## Designprinzip Actor-Referenzen

Domänen-Relationen (Citizen↔Register, CourtCase↔Hearing/Verdict/Sentence, Business↔Employee,
Workflow↔State/Transition) sind echte Prisma-Relationen mit Back-Refs. **Actor-Felder**
(officer/issuedBy/judge/prosecutor/author/assignee …) sind denormalisierte `@db.Uuid`-Strings
**ohne FK** — verhindert Relation-Explosion auf `User`; Auflösung im Backend-Service.

## Designentscheidung: polymorphe Akte

Eine `CaseFile`-Basis trägt alle gemeinsamen Felder (UUID, `ownerFaction`, `creator`,
`securityLevel`, `status`, `shareStatus`, Audit-Bezug). Der `type`-Discriminator unterscheidet
die Aktenart. Typ-spezifische Daten liegen in 1:1-Detailtabellen (`ForensicDetail`,
`PatientRecord`, …). Vorteile: fraktionsübergreifende Verknüpfung (`CaseFileLink`) und
Freigabe (`FileShare`) ohne pro-Typ-Duplikatlogik; `securityLevelRank` (1..5) ist
denormalisiert für effizientes RBAC-Filtering.

## ERD (Kern)

```mermaid
erDiagram
  User ||--o{ FactionMembership : has
  Faction ||--o{ FactionMembership : has
  Faction ||--o{ Department : has
  Faction ||--o{ Rank : defines
  FactionMembership }o--|| Rank : at
  FactionMembership }o--o| Department : in

  User ||--o{ RefreshToken : owns
  User ||--o{ CaseFile : creates
  Faction ||--o{ CaseFile : owns
  Citizen ||--o{ CaseFile : subjectOf
  Citizen ||--o{ Vehicle : owns
  Citizen ||--o{ Property : owns

  CaseFile ||--o{ FileShare : shared
  CaseFile ||--o{ Document : attaches
  CaseFile ||--o{ Signature : signed
  CaseFile ||--o{ EvidenceItem : holds
  CaseFile ||--o{ CaseFileLink : linksFrom
  CaseFile ||--o| ForensicDetail : detail
  CaseFile ||--o| PatientRecord : detail
  EvidenceItem ||--o{ CustodyEvent : custody

  DispatchCall ||--o{ UnitAssignment : assigns
  Unit ||--o{ UnitAssignment : on
  Unit ||--o{ UnitMember : crew
  Faction ||--o{ Unit : operates

  User ||--o{ ShiftLog : logs
  User ||--o{ AuditLog : actor
```

## Schlüssel-Entitäten

| Entität | Zweck |
|---|---|
| `User` / `RefreshToken` | Auth, Discord-Verknüpfung, persönliche Clearance |
| `Faction` / `Department` / `Rank` / `FactionMembership` | RBAC-Hierarchie, datengetriebene Rangstrukturen |
| `Citizen` / `Vehicle` / `Property` | Register |
| `CaseFile` (+ `CaseFileLink`) | polymorphe Akte, Verknüpfungen |
| `FileShare` | Freigabe-Workflow (Status, Ziel-Typ, Feld-Whitelist) |
| `ForensicDetail` / `EvidenceItem` / `CustodyEvent` | Forensik + Chain-of-Custody |
| `PatientRecord` | EMS mit geschützten Feldern |
| `Document` / `Signature` | DMS, digitale Signatur (Hash) |
| `DispatchCall` / `Unit` / `UnitMember` / `UnitAssignment` | CAD/Leitstelle |
| `ShiftLog` | Workforce / Dienstzeit |
| `AuditLog` | append-only, hash-verkettet |

## ERD — Justice

```mermaid
erDiagram
  Citizen ||--o{ Charge : charged
  PenalCode ||--o{ Charge : basis
  CaseFile ||--o{ Charge : contains
  Citizen ||--o{ Warrant : subject
  Citizen ||--o{ ArrestRecord : arrested
  Citizen ||--o{ Fine : fined
  Citizen ||--o{ CourtCase : defendant
  CourtCase ||--o{ CourtHearing : schedules
  CourtCase ||--o{ Verdict : delivers
  CourtCase ||--o{ Sentence : imposes
  Verdict ||--o{ Sentence : basis
  Sentence ||--o| Inmate : incarcerates
  Citizen ||--o{ Inmate : booked
```

## ERD — Business & Workflow

```mermaid
erDiagram
  Citizen ||--o{ Business : owns
  Business ||--o{ BusinessEmployee : employs
  Citizen ||--o{ BusinessEmployee : worksAs
  Business ||--o{ MenuItem : offers
  Business ||--o{ RealEstateListing : lists
  Property ||--o{ RealEstateListing : listed
  Business ||--o{ MechanicJob : jobs
  WorkflowDefinition ||--o{ WorkflowState : has
  WorkflowDefinition ||--o{ WorkflowTransition : has
  WorkflowDefinition ||--o{ WorkflowInstance : runs
  WorkflowState ||--o{ WorkflowTransition : from
  WorkflowInstance ||--o{ WorkflowTask : tracks
  CaseFile ||--o{ WorkflowInstance : drives
```

## Migrations / Seed

- Baseline-Migration unter `prisma/migrations/20260615000000_init/` (per `migrate diff`
  ohne laufende DB generiert). Anwenden: `pnpm db:migrate` (dev) bzw. `prisma migrate deploy` (prod).
- `pnpm db:seed` — Fraktionen (LSPD/BCSO/EMS/LSFD/DOJ/COURT/DA/DOC/FOR/DMV/CBP/GOV),
  Rang-Template Officer→Chief, Plattform-Admin, Demo-Bürger, **Penal Code** (7 Delikte),
  **Sektoren** (Downtown…Paleto), **Status-Codes** (10-8/10-23…), **Gesetze**, Demo-Business
  (Burger Shot + Menü), Demo-Führerschein, **Verhaftungs-Workflow** (Verhaftung→DA→Gericht→
  Gefängnis→Archiv).
