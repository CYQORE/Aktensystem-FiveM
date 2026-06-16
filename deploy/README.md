# S6mdt — Deploy-Paket

S6mdt ist ein **2-teiliges System**:

```
┌─ FiveM-Server (Windows) ─┐        ┌─ Backend (Docker, z.B. Hostinger-VPS) ─┐
│  resources/s6mdt         │ ─REST→ │  API + Web (CAD-UI) + MariaDB + Redis  │
│  (nur Brücke)            │ ←WS──  │  + MinIO                               │
└──────────────────────────┘        └────────────────────────────────────────┘
```

- **`fivem-resource/s6mdt`** → in `resources/` deines FiveM-Servers (nur die Brücke).
- **Backend** (API + CAD-Oberfläche + DB) → läuft als **eigener Dienst auf einem Docker-Host**
  (z.B. dein Hostinger-VPS). **Kommt NICHT in `resources/`.**

> Ohne laufendes Backend macht `/s6mdtadmin` & Co. nichts — die Brücke hat dann nichts zum Reden.

---

## Was ist `s6mdt-deploy.zip`?

Diese Datei = **Konfiguration + SQL + diese Anleitung + die FiveM-Resource**. Sie ist deine
Schaltzentrale, aber **nicht** der komplette Quellcode.

**Wichtig:** Der Docker-Build von API/Web braucht den **ganzen Repo-Quellcode**. Deshalb auf
dem Backend-Host nicht die zip entpacken, sondern das **ganze Repo klonen** (siehe unten).
Die zip nutzt du nur als Referenz / für die `.env`-Werte / die FiveM-Resource.

---

## Backend auf dem Hostinger-VPS starten (Docker)

Auf dem VPS (SSH):

```bash
# 1) Repo klonen (privat -> mit deinem GitHub-Login/Token)
git clone https://github.com/CYQORE/Aktensystem-FiveM.git
cd Aktensystem-FiveM/deploy

# 2) Konfiguration
cp .env.example .env
nano .env            # DB_ROOT_PASSWORD, JWT_*, FIVEM_BRIDGE_TOKEN, URLs setzen
#   WICHTIG: WEB_ORIGIN / NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL auf die
#   ÖFFENTLICHE VPS-IP zeigen, z.B. http://72.60.36.206:4000/api/v1

# 3) Starten (baut Images, startet MariaDB+API+Web+Redis+MinIO)
docker compose up -d --build

# 4) Stammdaten laden (Fraktionen, Penal Code, Sektoren ...)
docker compose exec api pnpm --filter @aktensystem/database db:seed
```

Die mitgelieferte **MariaDB** importiert die `sql/s6mdt_mysql.sql` beim ersten Start automatisch
(s6mdt_-Tabellen). Du musst die FiveM-DB **nicht** anfassen oder freigeben.

Prüfen:
- API-Health: `http://DEINE_VPS_IP:4000/api/v1/health`
- Frontend: `http://DEINE_VPS_IP:3000`

Logs / Stop:
```bash
docker compose logs -f api
docker compose down
```

> Hinweis Hostinger: Läuft dort schon ein Traefik (Reverse-Proxy), kannst du S6mdt später hinter
> eine Subdomain mit HTTPS hängen (z.B. cad.cyqore.de). Für den ersten Test reichen die Ports
> 3000/4000 direkt — in der VPS-Firewall freigeben.

---

## FiveM-Resource (auf dem Windows-Server)

1. Ordner `fivem-resource/s6mdt` in `resources/` (z.B. `resources/[s6mdt]/s6mdt`).
2. `server.cfg`:
   ```cfg
   set s6mdt_api_url "http://DEINE_VPS_IP:4000/api/v1"
   set s6mdt_bridge_token "GLEICHER_WERT_WIE_FIVEM_BRIDGE_TOKEN_IN_.env"
   set s6mdt_framework "ESX"
   ensure s6mdt
   ```
3. Server neu starten.

In-Game: `/mdt` (oder F6) öffnet das CAD. `/cad` gibt einen Browser-Login-Link.

---

## Ersten Admin festlegen

`/s6mdtadmin` in-game → der **erste** Spieler wird Plattform-Admin (danach gesperrt).
Bei „fehlgeschlagen" zeigt die Meldung jetzt die Ursache (Backend nicht erreichbar / Token falsch).
Im FiveM-Server-Konsolenlog steht `[s6mdt] admin-claim -> HTTP …`.

---

## Ports / Firewall (VPS)

| Port | Dienst |
|------|--------|
| 3000 | Web-Frontend |
| 4000 | API + WebSocket (muss vom FiveM-Server erreichbar sein) |
| 9000/9001 | MinIO |

---

## Troubleshooting

- **/s6mdtadmin „Backend nicht erreichbar"** → Backend läuft nicht, oder `s6mdt_api_url` falsch /
  Port 4000 nicht offen. `curl http://VPS_IP:4000/api/v1/health` vom FiveM-Server testen.
- **„Token falsch" (401)** → `s6mdt_bridge_token` (server.cfg) ≠ `FIVEM_BRIDGE_TOKEN` (.env).
- **API startet nicht / „Default-Secrets verweigert"** → echte `JWT_*` + `FIVEM_BRIDGE_TOKEN` setzen.
- **Frontend „Failed to fetch"** → `NEXT_PUBLIC_API_URL` falsch → nach Änderung neu bauen:
  `docker compose up -d --build web`.

Architektur-Details: `../docs/`.
