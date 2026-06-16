# Sicherheitsmodell

## Sicherheitsstufen (Level 1–5)

| Level | Enum | Bedeutung |
|---|---|---|
| 1 | `INTERN` | Intern |
| 2 | `VERTRAULICH` | Vertraulich |
| 3 | `BEHOERDENINTERN` | Behördenintern |
| 4 | `GEHEIM` | Geheim |
| 5 | `HOCHGEHEIM` | Hochgeheim |

Jede Akte/Dokument trägt eine Stufe. Sichtbarkeit: `clearance(actor) ≥ level(resource)`.
Denormalisiert als `securityLevelRank` (1..5) für indexiertes Filtering.

## RBAC — Vererbung

```
Fraktion ──► Abteilung ──► Rang ──► User  (+ individuelle Grants)
```

Modelliert mit **CASL** in [`packages/rbac`](../packages/rbac/src/index.ts), geteilt FE↔BE.
Rechte auf **Modul / Datensatz / Akte / Dokument / Feld** via CASL `conditions`
(z.B. `ownerFactionId`, `securityLevelRank`). Individuelle Grants (`FactionMembership.extraGrants`)
überschreiben zuletzt mit höchster Priorität.

### Actions × Subjects
`create · read · update · delete · share · approve · revoke · sign · dispatch · manage`
über `CaseFile · FileShare · Citizen · Vehicle · Property · DispatchCall · Unit · ShiftLog ·
Document · AuditLog · PatientRecord · Faction · User`.

## Rangabhängige Freigaben (Share-Tier)

| Rang | Tier | Freigabe-Reichweite |
|---|---|---|
| Officer | 0 | keine externe Freigabe |
| Sergeant | 1 | interne Freigaben (Level 1) |
| Lieutenant | 2 | behördenübergreifend (bis Level 3) |
| Captain | 3 | vertraulich/geheim (bis Level 4) + `approve` |
| Chief | 4 | vollständig + `revoke` |

Jede Fraktion definiert eigene Ränge (`Rank.shareTier`, `Rank.clearance`) — datengetrieben.

## EMS-Datenschutz (Sonderrechte)

`PatientRecord` trennt **öffentlichen Status** (`publicStatus`: Status/Transportiert/Entlassen/
Verstorben) von **geschützten Feldern** (`diagnoses`, `medications`, `psychNotes`).
Police sieht standardmäßig nur den Status. Vollzugriff nur über Gerichtsbeschluss / DOJ-Freigabe /
Medical Director — abgebildet als `FileShare` mit Feld-Whitelist + `approve` durch berechtigte Rolle.

## Audit (unveränderlich)

`AuditLog` ist **append-only** und **hash-verkettet**: jede Zeile speichert `prevHash`
(Hash der Vorzeile) + `hash` (über Inhalt + prevHash). Manipulation einer Zeile bricht die Kette.
Geloggt: Benutzer, Rang, Fraktion, Aktion, Zeitpunkt, vorher/nachher, IP, Gerät.

**Härtung (Phase 3):** separate DB-Rolle (`AUDIT_DATABASE_URL`) mit nur `INSERT`/`SELECT`,
kein `UPDATE`/`DELETE`; CASL verbietet `update`/`delete` auf `AuditLog` zusätzlich app-seitig.

## Auth-Sicherheit

- **Primär: FiveM-Identitäts-Login** (automatische Spielererkennung, siehe
  [`FIVEM-INTEGRATION.md`](FIVEM-INTEGRATION.md)). Discord OAuth nur als Admin-/Fallback.
- Access-JWT (kurzlebig) + rotierende Refresh-Tokens (`RefreshToken`, sha256-gehasht).
  Rotation **atomar** (`updateMany` mit `revokedAt: null`-Guard) → kein Reuse durch Race.
- Refresh + `oauth_state` per HttpOnly-Cookie, `secure` in Prod, eng auf Auth-Pfad gescoped.
- **AuthTicket (FiveM-Login-Code):** nur der **Hash** des 192-bit-Codes wird gespeichert;
  TTL 90 s; single-use **atomar** (`updateMany` mit `usedAt: null`); stündlicher Cleanup-Job;
  Code sofort aus der Browser-History entfernt. Exchange-Endpoint **throttled** (10/min/IP)
  und strikt validiert (48 hex).
- **Konfliktsicheres Linking:** license und Discord aus verschiedenen Accounts → Abbruch
  (kein Auto-Merge); Discord-ID wird an bestehende Accounts nie aus der Bridge gehängt
  (nur via OAuth) → verhindert Admin-Account-Takeover über (schwächere) license.
- FiveM-Bridge: Shared-Secret `x-fivem-token` (`FivemTokenGuard`, **timing-safe** Vergleich);
  Default-/Leersecrets werden in Produktion beim Boot abgelehnt. Helmet + Throttler aktiv.
