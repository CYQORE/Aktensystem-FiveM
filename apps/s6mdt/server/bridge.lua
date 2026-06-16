-- Bridge: HTTP-Client zum NestJS-Backend + Adapter-Auswahl.

local function selectAdapter()
    local a = Adapters[Config.Framework]
    if not a then
        print(('[aktensystem] Unbekanntes Framework "%s", nutze STANDALONE'):format(Config.Framework))
        return Adapters.STANDALONE
    end
    return a
end

ActiveAdapter = selectAdapter()

-- Generischer POST an die Bridge-Endpunkte
function PostToBackend(path, payload)
    PerformHttpRequest(
        Config.ApiBaseUrl .. path,
        function(status, _body, _headers)
            if status ~= 200 and status ~= 201 then
                print(('[aktensystem] POST %s -> HTTP %s'):format(path, status))
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

-- Adapter-Methoden funktionieren sowohl als a.fn(source) (standalone)
-- als auch a:fn(source) (qbcore/esx mit self). Wrapper vereinheitlicht.
function AdapterCall(method, ...)
    local fn = ActiveAdapter[method]
    if not fn then return nil end
    return fn(ActiveAdapter, ...)
end
