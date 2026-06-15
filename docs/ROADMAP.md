# Roadmap

Arbeitsweise: 7 Phasen, nach jeder Phase Freigabe abwarten.

## Phase 1 — Systemarchitektur + Scaffold ✅ (dieser Stand)
- Turborepo+pnpm-Monorepo, lauffähig (`pnpm install`/`pnpm dev`/`docker compose up`).
- Architektur-Doku (`docs/`), Kern-Prisma-Schema, Enums/Zod/RBAC-Pakete.
- NestJS-Bootstrap (Health, Prisma, Realtime-Gateway, FiveM-Bridge-Skelett).
- Next.js Dark-Mode-Shell. FiveM-Lua-Bridge inkl. Adapter (standalone/QBCore/QBox/ESX).

## Phase 2 — Datenbankdesign
- Vollständiges Prisma-Schema aller 36 Module, ERD komplett.
- Migrations + erweiterte Seeds (Gesetzesdatenbank, Sektoren, Status-Codes).

## Phase 3 — Backend
- Auth (Discord OAuth, JWT/Refresh), RBAC-Guard (CASL), Audit-Interceptor (hash-chained).
- Module: casefiles, sharing, forensics, justice, dispatch, workforce, documents (MinIO), PDF.
- WS-Redis-Adapter, Benachrichtigungen, Workflow-Engine.

## Phase 4 — Frontend
- CAD-UI (Notion/Linear/Jira-Designsprache), Akten-Editor, Dispatch-Board (Drag&Drop).
- Live-GTA-V-Karte (WS < 2 s), Leitstellenblatt, Dashboards/Analytics.

## Phase 5 — FiveM-Integration
- Event-Persistenz (ShiftLog/Unit/DispatchCall), Sektor-Ableitung, Status-Codes.
- Rückkanal Web→Game, Adapter-Tests gegen QBCore/QBox/ESX.

## Phase 6 — Tests
- Unit/E2E (Jest/Vitest, Playwright), RBAC-/Security-Tests, WS-Lasttest.

## Phase 7 — Deployment
- Prod-Docker, K8s-Manifeste, CI/CD, Observability (Logs/Metrics/Tracing).
