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
