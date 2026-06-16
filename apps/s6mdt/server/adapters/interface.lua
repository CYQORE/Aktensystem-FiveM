-- IFrameworkAdapter: einheitliche Schnittstelle über alle FiveM-Frameworks.
-- Jeder konkrete Adapter (standalone/qbcore/qbox/esx) implementiert diese Methoden.
-- Auswahl erfolgt in server/bridge.lua anhand Config.Framework.

Adapters = Adapters or {}

-- Vertrag (zur Doku; Lua kennt keine echten Interfaces):
--   getIdentifier(source) -> string         (license:xxx)
--   getFactionInfo(source) -> factionId, rank, onDuty
--   onDutyChanged(cb)                        cb(source, onDuty)
