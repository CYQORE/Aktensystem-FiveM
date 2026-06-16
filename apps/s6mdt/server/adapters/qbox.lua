-- QBox-Adapter. Moderner QBCore-Fork; nutzt qbx_core-Exports/State-Bags.

Adapters.QBOX = {
    getIdentifier = function(_self, source)
        local player = exports.qbx_core:GetPlayer(source)
        return player and player.PlayerData.license or ('source:%s'):format(source)
    end,

    getFactionInfo = function(_self, source)
        local player = exports.qbx_core:GetPlayer(source)
        if not player then return nil, nil, false end
        local job = player.PlayerData.job
        return job.name, job.grade and job.grade.name, job.onduty == true
    end,

    onDutyChanged = function(_self, cb)
        RegisterNetEvent('QBCore:Server:SetDuty', function(onDuty)
            cb(source, onDuty == true)
        end)
    end,

    -- QBox: Geld-Funktionen sind Exports (player.Functions existiert hier NICHT).
    chargeMoney = function(_self, source, amount)
        local p = exports.qbx_core:GetPlayer(source)
        if not p then return false, 'Spieler offline' end
        if (p.PlayerData.money['bank'] or 0) >= amount then
            local removed = exports.qbx_core:RemoveMoney(source, 'bank', amount, 's6mdt-fine')
            return removed == true, removed ~= true and 'Geldeinzug fehlgeschlagen' or nil
        end
        if (p.PlayerData.money['cash'] or 0) >= amount then
            local removed = exports.qbx_core:RemoveMoney(source, 'cash', amount, 's6mdt-fine')
            return removed == true, removed ~= true and 'Geldeinzug fehlgeschlagen' or nil
        end
        return false, 'Nicht genug Geld'
    end,

    jailPlayer = function(_self, source, seconds, reason)
        local minutes = math.ceil(seconds / 60)
        TriggerEvent('s6mdt:jail', source, seconds, reason)
        TriggerClientEvent('s6mdt:client:jail', source, seconds, reason)
        TriggerClientEvent('police:client:SendToJail', source, minutes)
        return true
    end,

    releasePlayer = function(_self, source)
        TriggerEvent('s6mdt:unjail', source)
        TriggerClientEvent('s6mdt:client:unjail', source)
        return true
    end,
}
