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
}
