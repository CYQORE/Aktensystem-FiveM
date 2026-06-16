-- Standalone-Adapter (kein Framework). Default-Fallback.
-- Identifier = rohes FiveM-license. Fraktion/Rang/Duty werden hier nicht
-- vom Framework geliefert, sondern über das Web-Panel zugeordnet.

-- AdapterCall ruft jede Methode als fn(ActiveAdapter, ...) -> erster Slot ist self.
Adapters.STANDALONE = {
    getIdentifier = function(_self, source)
        for _, id in ipairs(GetPlayerIdentifiers(source)) do
            if string.sub(id, 1, 8) == 'license:' then
                return id
            end
        end
        return ('source:%s'):format(source)
    end,

    getFactionInfo = function(_self, _source)
        return nil, nil, false
    end,

    onDutyChanged = function(_self, _cb)
        -- Standalone: Duty wird über Command /duty (server/main.lua) ausgelöst
    end,

    -- Ohne Framework kein Konto/Jail-System. Befehle werden als generische
    -- s6mdt-Events ausgelöst (für eigene Resourcen), Geldeinzug schlägt fehl.
    chargeMoney = function(_self, _source, _amount)
        return false, 'Standalone: kein Geldsystem'
    end,

    jailPlayer = function(_self, source, seconds, reason)
        TriggerEvent('s6mdt:jail', source, seconds, reason)
        TriggerClientEvent('s6mdt:client:jail', source, seconds, reason)
        return true
    end,

    releasePlayer = function(_self, source)
        TriggerEvent('s6mdt:unjail', source)
        TriggerClientEvent('s6mdt:client:unjail', source)
        return true
    end,
}
