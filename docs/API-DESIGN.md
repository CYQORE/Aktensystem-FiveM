# API-Design

## Konventionen

- Basis-Prefix: **`/api/v1`** (versioniert). Breaking Changes → `/api/v2`.
- REST, JSON. Ressourcen im Plural (`/case-files`, `/dispatch-calls`).
- Validierung an der Grenze via **Zod** (`packages/shared`) — selbe Schemas im FE.
- Auth: `Authorization: Bearer <access-jwt>` außer Auth- und FiveM-Bridge-Routen.
- Fehler: einheitliches `{ statusCode, message, error }` (Nest-Exception-Filter).
- Pagination: `?page=&pageSize=` (`PaginationSchema`).

## Kern-Endpunkte (Phase 3 implementiert ✅)

| Methode | Pfad | Zweck | Status |
|---|---|---|---|
| GET | `/health` | Liveness + DB-Status | ✅ |
| GET | `/auth/discord` · `/auth/discord/callback` | OAuth-Login | ✅ |
| POST | `/auth/refresh` · `/auth/logout` · GET `/auth/me` | Token-Rotation / Profil | ✅ |
| GET/POST | `/case-files` | Akten auflisten/erstellen (RBAC + Clearance-Filter) | ✅ |
| GET/PATCH | `/case-files/:id` | Akte lesen/ändern (Audit) | ✅ |
| GET | `/case-files/:id/report.pdf` | PDF-Export | ✅ |
| POST | `/case-files/:id/share` | Freigabe beantragen | ✅ |
| GET | `/case-files/:id/shares` | Freigaben einer Akte | ✅ |
| POST | `/file-shares/:id/approve` · `/reject` · `/revoke` | Freigabe entscheiden (Rang) | ✅ |
| GET/POST | `/dispatch-calls` | Einsätze | ✅ |
| POST | `/dispatch-calls/:id/assign` · PATCH `/status` | Einheit zuweisen / Status | ✅ |
| GET | `/units` · PATCH `/units/:id/status` | Leitstellenblatt | ✅ |
| POST | `/documents/upload` · GET `/documents/:id/download` | DMS (MinIO, presigned) | ✅ |
| GET | `/workforce/stats` | Dienstzeit-Statistik | ✅ |
| GET | `/notifications` · POST `/:id/read` | Benachrichtigungen | ✅ |
| GET | `/audit` · `/audit/verify` | Audit-Trail + Ketten-Integrität | ✅ |

Schutz: alle außer `/health`, `/auth/*` (Login) und `/fivem/*` via `JwtAuthGuard` +
`PoliciesGuard` (CASL). Record-Level (ownerFaction/Clearance/Share) im Service.

## WebSocket (socket.io)

Event-Namen zentral in [`packages/shared/src/ws-events.ts`](../packages/shared/src/ws-events.ts).

| Richtung | Event | Payload |
|---|---|---|
| C→S | `subscribe:sector` / `unsubscribe:sector` | `sector: string` |
| C→S | `unit:set-status` | `{ unitId, status }` |
| S→C | `unit:position` | `FiveMPosition` |
| S→C | `unit:status` | `{ unitId, status }` |
| S→C | `dispatch:created` / `dispatch:updated` / `dispatch:assigned` | DispatchCall |
| S→C | `casefile:shared` / `notification` | … |

Fan-out über Instanzen: Redis-Channels `ch:positions` / `ch:dispatch` / `ch:notifications`.

## FiveM-Bridge (Shared-Secret)

Header `x-fivem-token: <FIVEM_BRIDGE_TOKEN>` (`FivemTokenGuard`). Payloads Zod-validiert.

| Methode | Pfad | Payload | Phase-1 |
|---|---|---|---|
| POST | `/fivem/duty` | `FiveMDutyEvent` | ✅ Skelett |
| POST | `/fivem/position` | `FiveMPosition` | ✅ Skelett |
| POST | `/fivem/dispatch` | `FiveMEmergencyCall` | ✅ Skelett |
