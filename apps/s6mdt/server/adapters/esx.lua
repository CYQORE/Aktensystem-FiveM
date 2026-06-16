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
}
