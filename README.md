# S6mdt

**S6mdt** — Enterprise **RMS / CAD / DMS / Case-Management / Government**-Plattform für
GTA-V/FiveM Roleplay. Vereint alle Behörden, Unternehmen und Organisationen eines Servers auf
einer gemeinsamen Plattform — funktional über Sonoran/Axiom/CDE CAD hinaus. **Kein MDT.**
(FiveM-Resource-Name: `s6mdt`.)

Herzstück: fraktionsübergreifendes **Aktensystem** mit 5 Sicherheitsstufen, Freigabe-Workflows,
rangabhängigen Rechten und unveränderlichem Audit-Trail.

## Architektur (Kurz)

Externe **Web-Plattform** (Browser-CAD) + schlanke **FiveM-Lua-Bridge**. Die Bridge liefert nur
In-Game-Daten (Live-Positionen, Duty, Notrufe) an das Backend. Die gesamte Logik liegt im Backend.

```
apps/web (Next.js)  ──HTTP/WS──►  apps/api (NestJS)  ──►  MySQL/MariaDB / Redis / MinIO
                                        ▲
apps/s6mdt (Lua-Resource) ──REST/WS────┘  (Bridge: Auth, Duty, Position, /911)
```

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, ShadCN, Zustand, TanStack Query |
| Backend | NestJS 11, MySQL/MariaDB (FiveM-DB, Prisma), Redis, WebSockets (socket.io) |
| Storage | MinIO / S3 |
| Auth | Discord OAuth, JWT, Refresh-Tokens |
| FiveM | REST + WS-Bridge, Adapter: standalone / QBCore / QBox / ESX |
| Monorepo | Turborepo + pnpm |

## Monorepo

```
apps/        web · api · s6mdt (FiveM-Lua-Resource)
packages/    database (Prisma) · shared (Enums/Zod) · rbac (CASL) · ui · config
infra/       docker-compose · docker · k8s
docs/        Architektur-Dokumentation
```

## Quickstart (Dev)

```bash
pnpm install
cp .env.example .env                 # Werte anpassen
docker compose -f infra/docker-compose.yml up -d   # postgres/redis/minio
pnpm db:generate && pnpm db:migrate && pnpm db:seed
pnpm dev                             # web :3000, api :4000
```

Health-Check: `GET http://localhost:4000/api/v1/health`

## Phasen

1. ✅ **Systemarchitektur + Scaffold** (dieser Stand)
2. Datenbankdesign (alle 36 Module)
3. Backend
4. Frontend
5. FiveM-Integration
6. Tests
7. Deployment

Details: [`docs/`](docs/). Roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md).
