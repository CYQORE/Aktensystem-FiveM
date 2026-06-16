-- ESX-Adapter. Liest job/grade aus ES_Extended xPlayer.

Adapters.ESX = {
    _esx = nil,

    _get = function(self)
        if not self._esx then
            self._esx = exports['es_extended']:getSharedObject()
        end
        return self._esx
    end,

    getIdentifier = function(self, source)
        local ESX = self:_get()
        local xPlayer = ESX.GetPlayerFromId(source)
        return xPlayer and xPlayer.identifier or ('source:%s'):format(source)
    end,

    getFactionInfo = function(self, source)
        local ESX = self:_get()
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return nil, nil, false end
        local job = xPlayer.getJob()
        -- ESX kennt kein natives Duty -> true wenn Job != unemployed
        return job.name, job.grade_name, job.name ~= 'unemployed'
    end,

    onDutyChanged = function(_self, cb)
        RegisterNetEvent('esx:setJob', function(job)
            cb(source, job and job.name ~= 'unemployed')
        end)
    end,

    -- Geld einziehen (Bußgeld): erst Bank, dann Bargeld. -> ok, errMsg
    chargeMoney = function(self, source, amount)
        local ESX = self:_get()
        local xPlayer = ESX.GetPlayerFromId(source)
        if not xPlayer then return false, 'Spieler offline' end
        local bank = xPlayer.getAccount('bank')
        if bank and bank.money >= amount then
            xPlayer.removeAccountMoney('bank', amount)
            return true
        end
        local cash = xPlayer.getAccount('money')
        if cash and cash.money >= amount then
            xPlayer.removeAccountMoney('money', amount)
            return true
        end
        return false, 'Nicht genug Geld'
    end,

    -- Einsperren: generisches s6mdt-Event (vom Jail-Resource des Servers abonniert)
    -- + bekanntes esx_jail (nur wenn vorhanden). Rückgabe true = Event ausgelöst,
    -- NICHT bestätigt eingesperrt — der Jail-Vollzug liegt beim abonnierenden Resource.
    jailPlayer = function(_self, source, seconds, reason)
        local minutes = math.ceil(seconds / 60)
        TriggerEvent('s6mdt:jail', source, seconds, reason)
        TriggerClientEvent('s6mdt:client:jail', source, seconds, reason)
        if GetResourceState('esx_jail') == 'started' then
            TriggerEvent('esx_jail:sendToJail', source, minutes)
        end
        return true
    end,

    releasePlayer = function(_self, source)
        TriggerEvent('s6mdt:unjail', source)
        TriggerClientEvent('s6mdt:client:unjail', source)
        if GetResourceState('esx_jail') == 'started' then
            TriggerEvent('esx_jail:removeFromJail', source)
        end
        return true
    end,
}
