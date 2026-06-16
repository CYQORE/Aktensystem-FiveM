-- Server-Hauptlogik: Duty-Events, Positions-Streaming, Notruf, Alarme -> Backend.

local onDutyPlayers = {}
local playerZone = {} -- src -> lesbarer Zonenname (vom Client gestreamt)

local function sendDuty(source, onDuty)
    local identifier = AdapterCall('getIdentifier', source)
    local factionId, rank = AdapterCall('getFactionInfo', source)
    onDutyPlayers[source] = onDuty or nil
    PostToBackend('/fivem/duty', {
        identifier = identifier,
        factionId = factionId,
        rank = rank,
        onDuty = onDuty,
        timestamp = os.time(),
    })
end

-- Standalone-/Test-Command
RegisterCommand('duty', function(source, args)
    local onDuty = (args[1] ~= 'off')
    sendDuty(source, onDuty)
    TriggerClientEvent('aktensystem:dutyState', source, onDuty)
end, false)

-- Framework-Duty-Hook (qbcore/qbox/esx)
AdapterCall('onDutyChanged', function(source, onDuty)
    sendDuty(source, onDuty)
end)

-- Disconnect -> automatischer Dienstabschluss (Spec)
AddEventHandler('playerDropped', function()
    local source = source
    if onDutyPlayers[source] then
        sendDuty(source, false)
    end
    playerZone[source] = nil
end)

-- Notruf vom Client
RegisterNetEvent('aktensystem:emergencyCall', function(line, coords, message)
    local identifier = AdapterCall('getIdentifier', source)
    PostToBackend('/fivem/dispatch', {
        identifier = identifier,
        line = line,
        x = coords.x,
        y = coords.y,
        message = message,
    })
end)

-- Panic/Backup: Backend-DispatchCall + In-Game-Blip an alle im Dienst.
-- Koordinaten werden server-seitig aus der echten Ped-Position abgeleitet
-- (nicht dem Client vertrauen). zone/message bleiben untrusted Anzeigetext.
RegisterNetEvent('aktensystem:alert', function(kind, _coords, zone, message)
    local src = source
    if kind ~= 'PANIC' and kind ~= 'BACKUP' then return end

    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then return end
    local pc = GetEntityCoords(ped)
    local x, y = pc.x, pc.y

    PostToBackend('/fivem/alert', {
        identifier = AdapterCall('getIdentifier', src),
        kind = kind,
        x = x,
        y = y,
        zone = type(zone) == 'string' and zone or nil,
        message = type(message) == 'string' and message or nil,
    })
    local name = GetPlayerName(src) or 'Einheit'
    for s in pairs(onDutyPlayers) do
        TriggerClientEvent('aktensystem:alertBlip', s, {
            x = x, y = y, kind = kind, callsign = name,
        })
    end
end)

-- Status-Code (10-Code) -> Backend setzt Einheitsstatus.
RegisterNetEvent('aktensystem:statusCode', function(code)
    PostToBackend('/fivem/status', {
        identifier = AdapterCall('getIdentifier', source),
        code = code,
    })
end)

-- Zonen-Stream vom Client merken (wird an Position gehängt).
RegisterNetEvent('aktensystem:zone', function(zone)
    playerZone[source] = zone
end)

-- Positions-Streaming (nur OnDuty wenn konfiguriert)
CreateThread(function()
    while true do
        Wait(Config.PositionInterval)
        for _, source in ipairs(GetPlayers()) do
            local src = tonumber(source)
            if not Config.TrackOnDutyOnly or onDutyPlayers[src] then
                local ped = GetPlayerPed(src)
                local coords = GetEntityCoords(ped)
                local heading = GetEntityHeading(ped)
                PostToBackend('/fivem/position', {
                    identifier = AdapterCall('getIdentifier', src),
                    x = coords.x,
                    y = coords.y,
                    z = coords.z,
                    heading = heading,
                    zone = playerZone[src],
                })
            end
        end
    end
end)

print('[aktensystem] Bridge gestartet — Framework: ' .. Config.Framework)
