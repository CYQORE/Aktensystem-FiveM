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

## Auth-Verknüpfung

Identifier = `license:xxx` (oder ESX-`identifier`). Das Backend mappt Identifier → `User`
(`User.fivemIdentifier`) bzw. `Citizen.fivemCharId`. Discord-OAuth-Login im Web verknüpft den
Account; so verbinden sich In-Game-Aktivität (Duty/Position) und Web-Identität (Akten/Rechte).

## Phase 5 (Ausbau)

Persistenz der Events (ShiftLog start/stop, Unit-Position, DispatchCall-Anlage), Sektor-Ableitung
aus Koordinaten, Status-Codes (10-8/10-23/…), Rückkanal Web→Game (Backup entsenden, Marker).
