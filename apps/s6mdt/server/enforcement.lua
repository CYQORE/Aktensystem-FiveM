-- Vollzug: pollt offene Geld-/Haft-Befehle vom Backend und führt sie in-game
-- über den Framework-Adapter aus. Geld und Haft passieren ausschließlich hier.
--
-- Ablauf je Tick:
--   1. Identifier aller online Spieler sammeln (identifier -> source).
--   2. POST /fivem/commands/pending { identifiers } -> { commands: [...] }.
--   3. Jeden Befehl per Adapter ausführen (FINE/JAIL/RELEASE).
--   4. POST /fivem/commands/ack { commandId, success, error }.

-- POST mit Auswertung des Response-Bodys (PostToBackend ignoriert den Body).
local function PostJson(path, payload, cb)
    PerformHttpRequest(
        Config.ApiBaseUrl .. path,
        function(status, body, _headers)
            if status ~= 200 and status ~= 201 then
                print(('[s6mdt] POST %s -> HTTP %s'):format(path, tostring(status)))
                if cb then cb(nil) end
                return
            end
            if not cb then return end
            local ok, data = pcall(json.decode, body or '')
            cb(ok and data or nil)
        end,
        'POST',
        json.encode(payload or {}),
        {
            ['Content-Type'] = 'application/json',
            ['x-fivem-token'] = Config.BridgeToken,
        }
    )
end

-- claimId wird mitgesendet: das Backend verwirft verspätete Acks (Stale-Token).
local function ackCommand(cmd, success, err)
    PostJson('/fivem/commands/ack', {
        commandId = cmd.id,
        claimId = cmd.claimId,
        success = success,
        error = err,
    })
end

-- Einen Befehl auf den zugehörigen Spieler anwenden.
local function executeCommand(cmd, source)
    if cmd.type == 'FINE' then
        local ok, err = AdapterCall('chargeMoney', source, cmd.amount or 0)
        ackCommand(cmd, ok == true, ok ~= true and (err or 'Geldeinzug fehlgeschlagen') or nil)
    elseif cmd.type == 'JAIL' then
        local ok = AdapterCall('jailPlayer', source, cmd.jailSeconds or 0, cmd.reason)
        ackCommand(cmd, ok == true, ok ~= true and 'Einsperren fehlgeschlagen' or nil)
    elseif cmd.type == 'RELEASE' then
        local ok = AdapterCall('releasePlayer', source)
        ackCommand(cmd, ok == true, ok ~= true and 'Freilassen fehlgeschlagen' or nil)
    else
        ackCommand(cmd, false, 'Unbekannter Befehlstyp: ' .. tostring(cmd.type))
    end
end

local polling = false

CreateThread(function()
    while true do
        Wait(Config.EnforceInterval)

        -- Überlappende Polls vermeiden: läuft ein Request noch (langsames HTTP),
        -- diesen Tick überspringen. Sonst könnten Befehle doppelt verarbeitet werden.
        if not polling then
            -- identifier -> source der aktuell online Spieler
            local byIdentifier = {}
            local identifiers = {}
            for _, p in ipairs(GetPlayers()) do
                local src = tonumber(p)
                local id = AdapterCall('getIdentifier', src)
                if id then
                    byIdentifier[id] = src
                    identifiers[#identifiers + 1] = id
                end
            end

            if #identifiers > 0 then
                polling = true
                PostJson('/fivem/commands/pending', { identifiers = identifiers }, function(data)
                    polling = false
                    if not data or not data.commands then return end
                    for _, cmd in ipairs(data.commands) do
                        local src = byIdentifier[cmd.targetIdentifier]
                        -- Liveness erneut prüfen: Spieler kann zwischen Poll und
                        -- Ausführung disconnectet sein. GetPlayerName(src) == nil -> weg.
                        if src and GetPlayerName(src) ~= nil then
                            executeCommand(cmd, src)
                        end
                        -- Spieler offline -> NICHT acken. Befehl bleibt DELIVERED, das
                        -- Backend stellt ihn per reclaimStale wieder auf PENDING und
                        -- liefert ihn beim nächsten Connect erneut aus.
                    end
                end)
            end
        end
    end
end)

print('[s6mdt] Vollzug-Polling aktiv (Intervall ' .. Config.EnforceInterval .. 'ms)')
