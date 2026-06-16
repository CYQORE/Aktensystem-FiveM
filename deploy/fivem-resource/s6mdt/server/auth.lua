-- Login-Code-Anforderung beim Backend. Läuft server-seitig (vertrauenswürdig):
-- die FiveM-Identifier (license/discord) kommen vom Server, nicht vom Client.

local function discordOf(source)
    for _, id in ipairs(GetPlayerIdentifiers(source)) do
        if string.sub(id, 1, 8) == 'discord:' then
            return id
        end
    end
    return nil
end

local function requestLogin(source, sourceType)
    local src = source
    local license = AdapterCall('getIdentifier', src)
    local payload = {
        license = license,
        discord = discordOf(src),
        name = GetPlayerName(src),
        source = sourceType, -- 'NUI' | 'BROWSER'
    }

    PerformHttpRequest(
        Config.ApiBaseUrl .. '/fivem/auth',
        function(status, body)
            print(('[s6mdt] /fivem/auth (%s) -> HTTP %s %s'):format(sourceType, tostring(status), tostring(body)))
            if status ~= 200 and status ~= 201 then
                TriggerClientEvent('aktensystem:linkError', src, status)
                return
            end
            local ok, data = pcall(json.decode, body)
            if not ok or not data or not data.loginUrl then
                TriggerClientEvent('aktensystem:linkError', src, status)
                return
            end
            if sourceType == 'NUI' then
                TriggerClientEvent('aktensystem:openNui', src, data.loginUrl)
            else
                TriggerClientEvent('aktensystem:browserLink', src, data.loginUrl)
            end
        end,
        'POST',
        json.encode(payload),
        {
            ['Content-Type'] = 'application/json',
            ['x-fivem-token'] = Config.BridgeToken,
        }
    )
end

RegisterNetEvent('aktensystem:requestNui', function()
    requestLogin(source, 'NUI')
end)

RegisterNetEvent('aktensystem:requestBrowser', function()
    requestLogin(source, 'BROWSER')
end)

-- Bootstrap-Admin-Claim: erster Spieler mit /s6mdtadmin wird Plattform-Admin.
RegisterNetEvent('aktensystem:claimAdmin', function()
    local src = source
    print(('[s6mdt] Admin-Claim von %s -> %s/fivem/admin-claim'):format(GetPlayerName(src), Config.ApiBaseUrl))
    PerformHttpRequest(
        Config.ApiBaseUrl .. '/fivem/admin-claim',
        function(status, body)
            print(('[s6mdt] admin-claim -> HTTP %s %s'):format(tostring(status), tostring(body)))
            local claimed, reason = false, nil
            if status == 200 or status == 201 then
                local ok, data = pcall(json.decode, body)
                if ok and data then claimed = data.claimed; reason = data.reason end
            end
            TriggerClientEvent('aktensystem:adminClaimResult', src, claimed, reason, status)
        end,
        'POST',
        json.encode({
            license = AdapterCall('getIdentifier', src),
            discord = discordOf(src),
            name = GetPlayerName(src),
            source = 'NUI',
        }),
        {
            ['Content-Type'] = 'application/json',
            ['x-fivem-token'] = Config.BridgeToken,
        }
    )
end)
