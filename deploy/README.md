# S6mdt — Deploy-Paket

Fertiges Paket zum Aufsetzen der **S6mdt**-Plattform (Enterprise CAD/RMS/DMS) auf deinem Server.
Dieser Ordner enthält alles Nötige:

```
deploy/
├─ README.md                     ← diese Anleitung
├─ docker-compose.yml            ← Web + API + Redis + MinIO
├─ .env.example                  ← Konfiguration (nach .env kopieren)
├─ sql/s6mdt_mysql.sql           ← DB-Import (in die FiveM-MySQL)
└─ fivem-resource/s6mdt/         ← FiveM-Lua-Resource (in resources/ legen)
```

> Hinweis: Für den Web-/API-Build wird das **gesamte Repo** als Build-Kontext gebraucht
> (`context: ..` in der compose). Lade also das ganze Projekt auf den Server, nicht nur den
> `deploy/`-Ordner. Der `deploy/`-Ordner ist deine Schaltzentrale.

---

## Überblick — 3 Teile

1. **Datenbank** → `sql/s6mdt_mysql.sql` in die bestehende FiveM-MySQL importieren.
2. **Web-Plattform** (API + Frontend) → per Docker Compose starten.
3. **FiveM-Resource** `s6mdt` → in den Server legen (Bridge: Auth, Duty, Position, Notruf).

---

## 1) Datenbank importieren

Deine `server.cfg`: `mysql://root@localhost/ESXLegacy_E28CCE`. Alle S6mdt-Tabellen haben das
Prefix `s6mdt_` → **keine Kollision** mit ESX (`users`, `owned_vehicles`, `licenses` …).

```bash
# Backup zuerst!
mysqldump -u root ESXLegacy_E28CCE > backup_vor_s6mdt.sql
# Import
mysql -u root ESXLegacy_E28CCE < sql/s6mdt_mysql.sql
```
(oder HeidiSQL/phpMyAdmin: DB öffnen → SQL-Datei ausführen)

---

## 2) Web-Plattform starten (Docker)

**Voraussetzung:** Docker + Docker Compose auf dem Server.

```bash
cp .env.example .env
nano .env          # Secrets + Domain/IP setzen (siehe unten)
docker compose up -d --build
```

Pflicht in `.env`:
- `DATABASE_URL` — auf die FiveM-MySQL. Läuft MySQL auf demselben Host, nutze
  `host.docker.internal` (ist in der compose vorbereitet):
  `mysql://root@host.docker.internal:3306/ESXLegacy_E28CCE`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FIVEM_BRIDGE_TOKEN` — lange Zufallswerte
  (Prod verweigert sonst den Start). z.B. `openssl rand -hex 32`.
- `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL` — auf deine Domain/IP zeigen.

Danach:
- Frontend: `http://DEINE_IP:3000`
- API-Health: `http://DEINE_IP:4000/api/v1/health`

Stammdaten laden (Fraktionen, Penal Code, Sektoren, Status-Codes …):
```bash
docker compose exec api pnpm --filter @aktensystem/database db:seed
```

Logs / Stop:
```bash
docker compose logs -f api
docker compose down
```

---

## 3) FiveM-Resource installieren

1. Ordner `fivem-resource/s6mdt` in den `resources/`-Ordner deines FiveM-Servers kopieren
   (z.B. nach `resources/[s6mdt]/s6mdt`).
2. In die `server.cfg` (vor/zwischen den ensures):
   ```cfg
   set s6mdt_api_url "http://DEINE_IP:4000/api/v1"
   set s6mdt_bridge_token "GLEICHER_WERT_WIE_FIVEM_BRIDGE_TOKEN_IN_.env"
   set s6mdt_framework "ESX"          # dein Server = ESX Legacy
   ensure s6mdt
   ```
3. Server neu starten (oder `refresh; ensure s6mdt`).

In-Game:
- `/mdt` (oder Taste **F6**) → CAD öffnet sich im Spiel (NUI), Spieler wird automatisch erkannt.
- `/cad` → Login-Link für den Browser (2. Monitor) in die Zwischenablage.

---

## 4) Ersten Admin festlegen

Es gibt **keinen** vorgesetzten Admin. Der **erste** Spieler, der in-game `/s6mdtadmin` ausführt,
wird einmalig zum Plattform-Admin — danach ist der Befehl gesperrt. Discord-OAuth ist nur ein
optionaler Fallback-Login.

---

## Ports / Firewall

| Port | Dienst |
|------|--------|
| 3000 | Web-Frontend |
| 4000 | API + WebSocket |
| 9000/9001 | MinIO (Storage / Konsole) |

3000 und 4000 müssen von den Nutzern (bzw. vom FiveM-Server für die Bridge) erreichbar sein.
Empfehlung: einen Reverse-Proxy (Nginx/Traefik/Caddy) mit HTTPS davorsetzen.

---

## Ohne Docker (manuell)

Voraussetzung: Node 22 + pnpm 10 auf dem Server.
```bash
pnpm install
# DATABASE_URL etc. in der Umgebung/.env setzen (Repo-Root .env)
pnpm --filter @aktensystem/database db:generate
pnpm build                         # baut Pakete + API + Web
pnpm --filter @aktensystem/database db:deploy   # legt s6mdt_-Tabellen an (alternativ SQL-Import)
pnpm --filter @aktensystem/database db:seed
# Starten (z.B. mit pm2):
node apps/api/dist/main.js                       # API :4000
pnpm --filter @aktensystem/web start             # Web :3000
```

---

## Troubleshooting

- **API startet nicht / "Produktion mit Default-Secrets verweigert"** → echte `JWT_*` und
  `FIVEM_BRIDGE_TOKEN` in `.env` setzen.
- **DB-Verbindungsfehler** → `DATABASE_URL`-Host prüfen (`host.docker.internal` vs. IP),
  MySQL-User/Rechte, Port 3306 erreichbar.
- **Login klappt nicht (FiveM)** → `s6mdt_bridge_token` (server.cfg) muss exakt
  `FIVEM_BRIDGE_TOKEN` (.env) entsprechen; `s6mdt_api_url` muss vom FiveM-Server erreichbar sein.
- **Frontend zeigt "Failed to fetch"** → `NEXT_PUBLIC_API_URL` falsch gesetzt (muss die von außen
  erreichbare API-URL sein) — Web nach Änderung neu bauen (`docker compose up -d --build web`).

Details zur Architektur: siehe `../docs/`.
