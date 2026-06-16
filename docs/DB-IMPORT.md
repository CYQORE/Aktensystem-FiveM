# Datenbank-Import in die FiveM-Server-DB (MySQL/MariaDB)

S6mdt läuft auf **derselben Datenbank wie dein FiveM-Server** (ESX/oxmysql). Alle S6mdt-Tabellen
tragen das Prefix **`s6mdt_`** → keine Kollision mit ESX-Tabellen (`users`, `owned_vehicles`,
`licenses`, `jobs` …).

Beispiel aus deiner `server.cfg`:
```
set mysql_connection_string "mysql://root@localhost/ESXLegacy_E28CCE?charset=utf8mb4"
```
→ DB-Name `ESXLegacy_E28CCE`, User `root`, Host `localhost`, ohne Passwort.

## ⚠️ Vorher: Backup

```bash
mysqldump -u root ESXLegacy_E28CCE > backup_vor_s6mdt.sql
```

## Variante A — SQL-Datei importieren (empfohlen)

Die fertige DDL liegt in [`packages/database/sql/s6mdt_mysql.sql`](../packages/database/sql/s6mdt_mysql.sql)
(65 Tabellen, alle `s6mdt_`-prefixed).

**CLI:**
```bash
mysql -u root ESXLegacy_E28CCE < packages/database/sql/s6mdt_mysql.sql
```

**HeidiSQL / phpMyAdmin / DBeaver:** Datenbank `ESXLegacy_E28CCE` öffnen → Import/Datei
ausführen → `s6mdt_mysql.sql` wählen → ausführen.

## Variante B — über Prisma (wenn Node/pnpm auf dem DB-Host verfügbar)

```bash
# .env: DATABASE_URL="mysql://root@localhost:3306/ESXLegacy_E28CCE"
pnpm install
pnpm db:generate
pnpm --filter @aktensystem/database exec prisma migrate deploy   # legt s6mdt_-Tabellen an
pnpm db:seed                                                     # Stammdaten (s.u.)
```

## Stammdaten (Seed)

Nach dem Tabellen-Import optional die Stammdaten laden:
```bash
pnpm db:seed
```
Füllt: Fraktionen + Ränge (LSPD/BCSO/EMS/…), Penal Code, Sektoren, 10-Status-Codes, Gesetze,
Demo-Bürger/Business/Lizenz, Verhaftungs-Workflow. **Kein** Admin wird vorab gesetzt — der erste
Spieler mit `/s6mdtadmin` in-game wird Admin.

## Wichtige Hinweise

- **Zeichensatz:** `utf8mb4` (wie in deiner Server-Config). Die DDL ist dafür ausgelegt.
- **IDs:** `CHAR(36)`-UUIDs, von der App erzeugt — keine Kollision mit ESX-IDs.
- **Entfernen:** alle S6mdt-Tabellen lassen sich gezielt über das Prefix droppen
  (`DROP TABLE` aller `s6mdt_%`-Tabellen) ohne ESX zu berühren.
- **App-Verbindung:** Backend (`apps/api`) liest `DATABASE_URL` aus `.env` — auf die ESX-DB zeigen.
  S6mdt nutzt nur eigene `s6mdt_`-Tabellen; ESX-Tabellen werden nicht verändert.
