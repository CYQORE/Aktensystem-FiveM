# Datenmodell (Kern, Phase 1)

Quelle: [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma).
Phase 1 deckt das Fundament ab; alle 36 Module folgen in Phase 2.

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

## Migrations / Seed

- `pnpm db:migrate` — erstellt Schema.
- `pnpm db:seed` — Kern-Fraktionen (LSPD/BCSO/EMS/LSFD/DOJ/FOR/GOV), Rang-Template
  Officer→Chief inkl. `shareTier`/`clearance`, Plattform-Admin, Demo-Bürger.
