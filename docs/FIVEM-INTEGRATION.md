# FiveM-Integration

## Prinzip

Die Lua-Resource (`apps/fivem-resource`) ist eine **dünne Bridge**, kein Spiel-MDT. Sie
übersetzt In-Game-Events in REST-Calls ans Backend und empfängt Status-Pushes. Frameworks
werden über ein **Adapter-Pattern** entkoppelt.

## Adapter-Pattern

```
server/adapters/interface.lua   -- Vertrag (getIdentifier/getFactionInfo/onDutyChanged)
server/adapters/standalone.lua  -- Default (rohes license:)
server/adapters/qbcore.lua      -- qb-core
server/adapters/qbox.lua        -- qbx_core
server/adapters/esx.lua         -- es_extended
server/bridge.lua               -- Auswahl via Config.Framework + HTTP-Client
```

Auswahl per Convar `aktensystem_framework` (`STANDALONE`|`QBCORE`|`QBOX`|`ESX`).

## Gebrückte Events

| In-Game | → Backend | Trigger |
|---|---|---|
| Dienstbeginn | `POST /fivem/duty {onDuty:true}` | Framework-Duty-Event / `/duty` |
| Dienstende | `POST /fivem/duty {onDuty:false}` | Framework-Event / `/duty off` |
| Disconnect | `POST /fivem/duty {onDuty:false}` | `playerDropped` (Auto-Abschluss) |
| Live-Position | `POST /fivem/position` | Thread, alle `Config.PositionInterval` ms |
| Notruf | `POST /fivem/dispatch` | `/911`, `/112` |

## Konfiguration (server.cfg Convars)

```cfg
set aktensystem_api_url "http://localhost:4000/api/v1"
set aktensystem_bridge_token "change_me_fivem_shared_secret"   # = FIVEM_BRIDGE_TOKEN
set aktensystem_framework "QBCORE"                              # STANDALONE|QBCORE|QBOX|ESX
ensure aktensystem-bridge
```

## Auth — automatische Spielererkennung (kein manueller Login)

Der bedienende Spieler wird über seine **FiveM-Identität** automatisch erkannt. Discord-OAuth
bleibt nur als Admin-/Fallback-Login (ohne laufendes Spiel).

**Ticket-Flow (One-Time-Code):**
1. Spieler öffnet CAD: `/mdt` (In-Game-NUI) oder `/cad` (externer Browser, 2. Monitor).
2. Lua-**Server** ruft `POST /fivem/auth` (bridge-authed, `x-fivem-token`) mit
   `{license, discord?, name, source}`. Die Identifier sind vertrauenswürdig (vom FiveM-Server).
3. Backend verknüpft/erstellt `User` (license = Schlüssel, Discord-ID nur bei Neuanlage),
   legt ein **AuthTicket** an (Code-Hash, TTL 90 s, single-use) und gibt `loginUrl` mit `#code` zurück.
4. NUI lädt die `loginUrl` automatisch / `/cad` kopiert den Link in die Zwischenablage.
5. Web (`/auth/fivem`) tauscht den Code via `POST /auth/fivem/exchange` (public, throttled)
   gegen Access-JWT + Refresh-Cookie. Code wird sofort aus der History entfernt.

**Identitäts-Verknüpfung:** `license:xxx` = primärer Schlüssel (`User.fivemIdentifier`),
Discord-ID für Rollen/Admin — aber Discord wird an bestehende Accounts **nur** über den
verifizierten OAuth-Flow gehängt, nie aus der Bridge (verhindert Account-Takeover via license).
`Citizen.fivemCharId` verbindet In-Game-Charakter mit Registerdaten.

Sicherheit des Flows: siehe [`SECURITY.md`](SECURITY.md) (atomares single-use, Code-Hash,
Throttling, konfliktsicheres Linking).

## Phase 5 (Ausbau)

Persistenz der Events (ShiftLog start/stop, Unit-Position, DispatchCall-Anlage), Sektor-Ableitung
aus Koordinaten, Status-Codes (10-8/10-23/…), Rückkanal Web→Game (Backup entsenden, Marker).
