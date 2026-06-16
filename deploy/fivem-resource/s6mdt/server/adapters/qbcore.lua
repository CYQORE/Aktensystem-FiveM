-- QBCore-Adapter. Liest Job/Grade/Duty aus QBCore-Player-Data.

Adapters.QBCORE = {
    _core = nil,

    _get = function(self)
        if not self._core then
            self._core = exports['qb-core']:GetCoreObject()
        end
        return self._core
    end,

    getIdentifier = function(self, source)
        local QBCore = self:_get()
        local p = QBCore.Functions.GetPlayer(source)
        return p and p.PlayerData.license or ('source:%s'):format(source)
    end,

    getFactionInfo = function(self, source)
        local QBCore = self:_get()
        local p = QBCore.Functions.GetPlayer(source)
        if not p then return nil, nil, false end
        local job = p.PlayerData.job
        return job.name, job.grade and job.grade.name, job.onduty == true
    end,

    onDutyChanged = function(_self, cb)
        RegisterNetEvent('QBCore:Server:SetDuty', function(onDuty)
            cb(source, onDuty == true)
        end)
    end,

    chargeMoney = function(self, source, amount)
        local QBCore = self:_get()
        local p = QBCore.Functions.GetPlayer(source)
        if not p then return false, 'Spieler offline' end
        if (p.PlayerData.money['bank'] or 0) >= amount then
            local removed = p.Functions.RemoveMoney('bank', amount, 's6mdt-fine')
            return removed == true, removed ~= true and 'Geldeinzug fehlgeschlagen' or nil
        end
        if (p.PlayerData.money['cash'] or 0) >= amount then
            local removed = p.Functions.RemoveMoney('cash', amount, 's6mdt-fine')
            return removed == true, removed ~= true and 'Geldeinzug fehlgeschlagen' or nil
        end
        return false, 'Nicht genug Geld'
    end,

    jailPlayer = function(_self, source, seconds, reason)
        local minutes = math.ceil(seconds / 60)
        TriggerEvent('s6mdt:jail', source, seconds, reason)
        TriggerClientEvent('s6mdt:client:jail', source, seconds, reason)
        -- qb-policejob / qb-jail (Best-Effort):
        TriggerClientEvent('police:client:SendToJail', source, minutes)
        return true
    end,

    releasePlayer = function(_self, source)
        TriggerEvent('s6mdt:unjail', source)
        TriggerClientEvent('s6mdt:client:unjail', source)
        return true
    end,
}
