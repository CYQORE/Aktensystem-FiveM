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
}
