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

AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        isOnDuty = false
    end
end)
