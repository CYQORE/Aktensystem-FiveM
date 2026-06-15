# Roadmap

Arbeitsweise: 7 Phasen, nach jeder Phase Freigabe abwarten.

## Phase 1 — Systemarchitektur + Scaffold ✅ (dieser Stand)
- Turborepo+pnpm-Monorepo, lauffähig (`pnpm install`/`pnpm dev`/`docker compose up`).
- Architektur-Doku (`docs/`), Kern-Prisma-Schema, Enums/Zod/RBAC-Pakete.
- NestJS-Bootstrap (Health, Prisma, Realtime-Gateway, FiveM-Bridge-Skelett).
- Next.js Dark-Mode-Shell. FiveM-Lua-Bridge inkl. Adapter (standalone/QBCore/QBox/ESX).

## Phase 2 — Datenbankdesign ✅
- Vollständiges Prisma-Schema (~55 Modelle, alle 36 Module), Domänen-ERDs in DATA-MODEL.md.
- Baseline-Migration (`20260615000000_init`), erweiterte Seeds (Penal Code, Sektoren,
  Status-Codes, Gesetze, Business, Lizenz, Verhaftungs-Workflow).
- Verifiziert: prisma format/generate, typecheck 6/6.

## Phase 3 — Backend ✅
- Auth (Discord OAuth, JWT/Refresh rotierend), RBAC-Guard (CASL, Actor-Context),
  Audit-Service (hash-chained + Ketten-Verifikation).
- Module: casefiles (RBAC+Clearance+Sharing-aware), sharing (Statusmaschine+Rang),
  dispatch (Einsätze/Einheiten/Zuweisung+WS), workforce (Dienstzeit+Stats),
  documents (MinIO presigned), reports (PDF), notifications.
- FiveM-Bridge verdrahtet (Duty→ShiftLog, Position→Unit, Notruf→DispatchCall).
- Verifiziert: typecheck 6/6, build (nest+next) grün. DB-Integration offen (kein lokaler Docker).
- Offen für Phase 6/7: WS-Redis-Adapter (Multi-Instanz), Workflow-Engine-Execution, Forensik/Justice-Controller.

## Phase 4 — Frontend ✅
- Foundation: API-Client (Silent-Refresh), Auth-Store (Discord/JWT), WS-Hook,
  UI-Primitives, App-Shell (Sidebar+Topbar), TanStack-Query-Hooks + Types.
- Seiten: Dashboard (KPIs), Akten-Liste + Detail/Editor (PDF-Export, Freigaben),
  Dispatch-Board (Drag&Drop + WS), Leitstellenblatt, Live-GTA-V-Karte (WS-Marker),
  Dienstzeit-Statistik, Audit-Trail (Ketten-Status). Discord-OAuth-Callback.
- Verifiziert: typecheck 6/6, build (12 Routen) grün, Seiten rendern (Preview-Screenshots).
- Offen: Daten erst mit laufender API/DB sichtbar (Seiten zeigen Loading/Empty/Error ohne Backend).

## Phase 5 — FiveM-Integration
- Event-Persistenz (ShiftLog/Unit/DispatchCall), Sektor-Ableitung, Status-Codes.
- Rückkanal Web→Game, Adapter-Tests gegen QBCore/QBox/ESX.

## Phase 6 — Tests
- Unit/E2E (Jest/Vitest, Playwright), RBAC-/Security-Tests, WS-Lasttest.

## Phase 7 — Deployment
- Prod-Docker, K8s-Manifeste, CI/CD, Observability (Logs/Metrics/Tracing).
