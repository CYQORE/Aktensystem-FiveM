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

- Discord OAuth → kurzlebiges Access-JWT + rotierende Refresh-Tokens (`RefreshToken`, gehasht).
- Refresh per HttpOnly-Cookie; Token-Reuse-Detection (revoke-Kette).
- FiveM-Bridge: Shared-Secret-Header `x-fivem-token` (`FivemTokenGuard`).
