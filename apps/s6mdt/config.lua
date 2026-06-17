Config = {}

-- Backend-Basis-URL (NestJS API) + Shared-Secret (muss FIVEM_BRIDGE_TOKEN entsprechen)
Config.ApiBaseUrl = GetConvar('s6mdt_api_url', 'http://localhost:4000/api/v1')
Config.BridgeToken = GetConvar('s6mdt_bridge_token', 'change_me_fivem_shared_secret')

-- Framework: 'STANDALONE' | 'QBCORE' | 'QBOX' | 'ESX'
Config.Framework = GetConvar('s6mdt_framework', 'STANDALONE')

-- Positions-Streaming-Intervall in ms (Spec: < 2000ms)
Config.PositionInterval = 1500

-- Nur Spieler in Dienst tracken
Config.TrackOnDutyOnly = true

-- Vollzugs-Polling: wie oft offene Geld-/Haft-Befehle vom Backend geholt werden (ms)
Config.EnforceInterval = 5000

-- Server-Sync (Spieler + Fahrzeuge aus der Game-DB an S6mdt schicken). Nur ESX + oxmysql.
-- Läuft lokal auf dem Game-Server, daher keine offenen DB-Ports nötig.
Config.SyncOnStart = false        -- beim Resource-Start einmal syncen
Config.SyncIntervalMinutes = 0    -- periodisch syncen (0 = nur manuell via Konsole `s6sync`)
Config.SyncChunkCitizens = 500    -- Bürger pro HTTP-Chunk
Config.SyncChunkVehicles = 1000   -- Fahrzeuge pro HTTP-Chunk
