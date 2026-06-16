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
    local license = AdapterCall('getIdentifier', source)
    local payload = {
        license = license,
        discord = discordOf(source),
        name = GetPlayerName(source),
        source = sourceType, -- 'NUI' | 'BROWSER'
    }

    PerformHttpRequest(
        Config.ApiBaseUrl .. '/fivem/auth',
        function(status, body)
            if status ~= 200 and status ~= 201 then
                print(('[aktensystem] /fivem/auth -> HTTP %s'):format(status))
                return
            end
            local ok, data = pcall(json.decode, body)
            if not ok or not data or not data.loginUrl then return end
            if sourceType == 'NUI' then
                TriggerClientEvent('aktensystem:openNui', source, data.loginUrl)
            else
                TriggerClientEvent('aktensystem:browserLink', source, data.loginUrl)
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
