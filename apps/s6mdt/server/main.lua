-- Server-Hauptlogik: Duty-Events, Positions-Streaming, Notruf -> Backend.

local onDutyPlayers = {}

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
                })
            end
        end
    end
end)

print('[aktensystem] Bridge gestartet — Framework: ' .. Config.Framework)
