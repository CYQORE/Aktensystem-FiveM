# API-Design

## Konventionen

- Basis-Prefix: **`/api/v1`** (versioniert). Breaking Changes → `/api/v2`.
- REST, JSON. Ressourcen im Plural (`/case-files`, `/dispatch-calls`).
- Validierung an der Grenze via **Zod** (`packages/shared`) — selbe Schemas im FE.
- Auth: `Authorization: Bearer <access-jwt>` außer Auth- und FiveM-Bridge-Routen.
- Fehler: einheitliches `{ statusCode, message, error }` (Nest-Exception-Filter).
- Pagination: `?page=&pageSize=` (`PaginationSchema`).

## Kern-Endpunkte (Zielbild, Phasen 3–4)

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/health` | Liveness + DB-Status (Phase 1 ✅) |
| GET | `/auth/discord` · `/auth/discord/callback` | OAuth-Login |
| POST | `/auth/refresh` · `/auth/logout` | Token-Rotation |
| GET/POST | `/case-files` | Akten auflisten/erstellen (RBAC-gefiltert) |
| GET/PATCH | `/case-files/:id` | Akte lesen/ändern |
| POST | `/case-files/:id/share` | Freigabe beantragen |
| POST | `/file-shares/:id/approve` · `/revoke` | Freigabe entscheiden |
| GET/POST | `/dispatch-calls` | Einsätze |
| POST | `/dispatch-calls/:id/assign` | Einheit zuweisen |
| GET | `/units` · `/units/:id` | Einheiten/Leitstellenblatt |
| GET | `/audit` | Audit-Trail (read-only) |

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
