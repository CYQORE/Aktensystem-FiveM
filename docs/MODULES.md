# Module → Bounded Contexts

Die 36 Module der Spezifikation, gruppiert in Domänen-Kontexte. Jeder Kontext wird ein
NestJS-Modul (`apps/api/src/<context>`). Phase-1-Skelett: Health, Prisma, Realtime, FiveM.

| Kontext (Nest-Modul) | Module aus Spec |
|---|---|
| **identity** | Bürgerregister, Fahrzeugregister, Immobilienregister |
| **law-enforcement** | Polizeisystem, Ermittlungsmanagement, Fahndungssystem |
| **forensics** | Forensiksystem, Obduktion, Chain-of-Custody, Evidence |
| **justice** | DOJ-System, Gerichtssystem, Staatsanwaltschaft, Gesetzesdatenbank |
| **corrections** | Gefängnissystem |
| **medical** | EMS-System, Fire Department, Patientenakten (Datenschutz) |
| **dispatch** | Dispatch/CAD, Leitstellenblatt, Streifeneinteilung, Sektoren, Notrufe, Status |
| **mapping** | Live-GTA-V-Karte, GPS-Tracking, taktische Karte |
| **workforce** | Dienstzeiterfassung, Schichtplanung, Aktivitätsstatistik |
| **government** | Government System, Verwaltung |
| **business** | Unternehmensverwaltung, Gastro, Real Estate, Mechanics, Security, News |
| **casefiles** | Aktensystem (Kern), fraktionsübergreifende Freigabe, Verknüpfung |
| **documents** | DMS, PDF-Generator, Versionierung, digitale Signaturen |
| **workflow** | Workflow-Engine (Jira-artig) |
| **platform** | RBAC, Audit, Benachrichtigungen, Dashboards/Analytics, API-Gateway |
| **ai** (optional) | Berichtszusammenfassung, Dokumentensuche, Aktenverknüpfung, Deliktvorschläge |

## Querschnitt

- **`packages/shared`** — Enums + Zod-Verträge (FE↔BE↔FiveM).
- **`packages/rbac`** — CASL-Ability, Rang-Tiers, Clearance-Check.
- **`packages/database`** — Prisma-Schema (Single Source der Persistenz).

## Modul-Priorisierung (für Phasen 3–4)

1. platform (RBAC/Audit) · identity · casefiles → Fundament.
2. law-enforcement · forensics · justice → Kern-Use-Cases.
3. dispatch · mapping · workforce → Leitstelle/CAD.
4. medical · government · business · documents · workflow → Breite.
5. ai → optional, zuletzt.
