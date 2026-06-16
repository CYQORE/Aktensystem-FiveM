-- Standalone-Adapter (kein Framework). Default-Fallback.
-- Identifier = rohes FiveM-license. Fraktion/Rang/Duty werden hier nicht
-- vom Framework geliefert, sondern über das Web-Panel zugeordnet.

Adapters.STANDALONE = {
    getIdentifier = function(source)
        for _, id in ipairs(GetPlayerIdentifiers(source)) do
            if string.sub(id, 1, 8) == 'license:' then
                return id
            end
        end
        return ('source:%s'):format(source)
    end,

    getFactionInfo = function(_source)
        return nil, nil, false
    end,

    onDutyChanged = function(_cb)
        -- Standalone: Duty wird über Command /duty (server/main.lua) ausgelöst
    end,
}
