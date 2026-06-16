-- Client: Notruf-Command + Duty-State-Empfang.

local isOnDuty = false

RegisterNetEvent('aktensystem:dutyState', function(state)
    isOnDuty = state
end)

-- /911 <text>
RegisterCommand('911', function(_source, args)
    local message = table.concat(args, ' ')
    local coords = GetEntityCoords(PlayerPedId())
    TriggerServerEvent('aktensystem:emergencyCall', 'POLICE_911', coords, message)
    if message ~= '' then
        TriggerEvent('chat:addMessage', { args = { '^1Notruf', 'gesendet: ' .. message } })
    end
end, false)

-- /112 <text> (EMS)
RegisterCommand('112', function(_source, args)
    local message = table.concat(args, ' ')
    local coords = GetEntityCoords(PlayerPedId())
    TriggerServerEvent('aktensystem:emergencyCall', 'EMS_112', coords, message)
end, false)

-- Lesbarer Standort (Straße, Zone) — client-seitig, da GetNameOfZone Client-Native.
local function readableZone()
    local c = GetEntityCoords(PlayerPedId())
    local zone = GetLabelText(GetNameOfZone(c.x, c.y, c.z))
    local street = GetStreetNameFromHashKey(GetStreetNameAtCoord(c.x, c.y, c.z))
    if street and street ~= '' then
        return street .. (zone and zone ~= '' and (', ' .. zone) or '')
    end
    return zone or ''
end

-- Panic/Backup an Server (Ort client-ermittelt).
local function sendAlert(kind, message)
    local c = GetEntityCoords(PlayerPedId())
    TriggerServerEvent('aktensystem:alert', kind, { x = c.x, y = c.y }, readableZone(), message)
end

-- Panic-Button (10-99): Notruf Beamter. Default-Taste F10 (in FiveM-Settings änderbar).
RegisterCommand('panic', function()
    sendAlert('PANIC')
    TriggerEvent('chat:addMessage', { color = { 220, 40, 40 }, args = { 'PANIC', '10-99 gesendet!' } })
end, false)
RegisterKeyMapping('panic', 'Panic-Button (10-99 Notruf Beamter)', 'keyboard', 'F10')

-- /backup <text>: Verstärkung anfordern.
RegisterCommand('backup', function(_source, args)
    sendAlert('BACKUP', table.concat(args, ' '))
    TriggerEvent('chat:addMessage', { color = { 220, 140, 40 }, args = { 'Backup', 'Verstärkung angefordert.' } })
end, false)

-- /code <10-Code>: Einheitsstatus setzen (z. B. /code 10-8).
RegisterCommand('code', function(_source, args)
    local code = args[1]
    if not code then
        TriggerEvent('chat:addMessage', { args = { 'Status', 'Nutze: /code 10-8' } })
        return
    end
    TriggerServerEvent('aktensystem:statusCode', code)
end, false)

-- /funk <kanal>: lokaler pma-voice-Funkkanal (best-effort, 0 = verlassen).
RegisterCommand('funk', function(_source, args)
    local ch = tonumber(args[1]) or 0
    if GetResourceState('pma-voice') == 'started' then
        exports['pma-voice']:setRadioChannel(ch)
        TriggerEvent('chat:addMessage', { args = { 'Funk', ch > 0 and ('Kanal ' .. ch) or 'verlassen' } })
    else
        TriggerEvent('chat:addMessage', { args = { 'Funk', 'pma-voice nicht aktiv.' } })
    end
end, false)

-- Alarm-Blip anderer Beamter (Panic/Backup). Dedup je Einheit: neuer Alarm
-- ersetzt den alten Blip derselben Einheit statt zu stapeln.
local alertBlips = {}
RegisterNetEvent('aktensystem:alertBlip', function(data)
    local key = data.callsign or 'unbekannt'
    if alertBlips[key] and DoesBlipExist(alertBlips[key]) then
        RemoveBlip(alertBlips[key])
    end
    local blip = AddBlipForCoord(data.x + 0.0, data.y + 0.0, 0.0)
    alertBlips[key] = blip
    SetBlipSprite(blip, data.kind == 'PANIC' and 161 or 60)
    SetBlipColour(blip, data.kind == 'PANIC' and 1 or 47)
    SetBlipScale(blip, 1.3)
    SetBlipFlashes(blip, true)
    SetBlipAsShortRange(blip, false)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName((data.kind == 'PANIC' and '10-99 ' or 'Backup ') .. (data.callsign or ''))
    EndTextCommandSetBlipName(blip)
    TriggerEvent('chat:addMessage', {
        color = data.kind == 'PANIC' and { 220, 40, 40 } or { 220, 140, 40 },
        args = { data.kind == 'PANIC' and '10-99 PANIC' or 'BACKUP', (data.callsign or 'Einheit') .. ' braucht Hilfe!' },
    })
    SetTimeout(60000, function()
        if DoesBlipExist(blip) then RemoveBlip(blip) end
    end)
end)

-- Zonen-Stream (nur im Dienst): aktuelle Zone für Live-Karte/Units an Server.
CreateThread(function()
    while true do
        Wait(5000)
        if isOnDuty then
            TriggerServerEvent('aktensystem:zone', readableZone())
        end
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        isOnDuty = false
    end
end)
