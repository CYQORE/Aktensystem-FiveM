-- Server-Sync: liest die Game-DB (ESX `users` + `owned_vehicles`) lokal via
-- oxmysql und schickt die Zeilen in Chunks an die S6mdt-Bridge (/fivem/sync/*).
-- Läuft auf dem Game-Server selbst -> keine offenen DB-Ports nötig.
-- Nur ESX (oxmysql). Manuell via Konsole `s6sync` oder optional automatisch.

-- Chunk-Größen hart auf die Backend-Zod-Limits clampen (sonst HTTP 400 -> Drop).
local CHUNK_CITIZENS = math.min(Config.SyncChunkCitizens or 500, 1000)
local CHUNK_VEHICLES = math.min(Config.SyncChunkVehicles or 1000, 2000)
local SYNC_TIMEOUT_MS = 15 * 60000 -- Watchdog: nach 15 min gilt ein Lauf als hängend

local function oxmysqlReady()
    return GetResourceState('oxmysql') == 'started'
end

-- POST eines Chunks; loggt die Backend-Antwort (count) und ruft danach onDone.
local function postChunk(path, rows, label, onDone)
    PerformHttpRequest(
        Config.ApiBaseUrl .. path,
        function(status, body)
            if status == 200 or status == 201 then
                local n = 0
                if body then
                    local ok, decoded = pcall(json.decode, body)
                    if ok and type(decoded) == 'table' and decoded.count then n = decoded.count end
                end
                print(('[s6mdt][sync] %s-Chunk: %d übernommen'):format(label, n))
            else
                print(('[s6mdt][sync] %s-Chunk: HTTP %s'):format(label, tostring(status)))
            end
            if onDone then onDone() end
        end,
        'POST',
        json.encode({ rows = rows }),
        {
            ['Content-Type'] = 'application/json',
            ['x-fivem-token'] = Config.BridgeToken,
        }
    )
end

-- Tabelle sequentiell in Chunks posten (nächster Chunk erst nach Antwort).
local function postInChunks(path, allRows, chunkSize, label, onComplete)
    local total = #allRows
    if total == 0 then
        print(('[s6mdt][sync] %s: keine Zeilen'):format(label))
        if onComplete then onComplete() end
        return
    end
    local i = 1
    local function sendNext()
        if i > total then
            print(('[s6mdt][sync] %s: fertig (%d gesendet)'):format(label, total))
            if onComplete then onComplete() end
            return
        end
        local chunk = {}
        while i <= total and #chunk < chunkSize do
            chunk[#chunk + 1] = allRows[i]
            i = i + 1
        end
        postChunk(path, chunk, label, sendNext)
    end
    sendNext()
end

-- vehicle-JSON -> nur Modellname (Klartext, kein numerischer Hash).
local function vehiclesToRows(vehicles)
    local out = {}
    for _, v in ipairs(vehicles) do
        local model = nil
        if v.vehicle then
            local ok, dec = pcall(json.decode, v.vehicle)
            if ok and type(dec) == 'table' and type(dec.model) == 'string'
                and dec.model ~= '' and not dec.model:match('^%d+$') then
                model = string.sub(dec.model, 1, 80)
            end
        end
        out[#out + 1] = { owner = v.owner, plate = v.plate, model = model }
    end
    return out
end

local syncing = false
local syncStartedAt = 0

function RunServerSync()
    if Config.Framework ~= 'ESX' then
        print('[s6mdt][sync] Nur für ESX verfügbar (Config.Framework=ESX setzen).')
        return
    end
    if not oxmysqlReady() then
        print('[s6mdt][sync] oxmysql nicht gestartet — Sync nicht möglich.')
        return
    end
    -- Watchdog: ein hängender Vorperlauf blockiert nicht ewig.
    if syncing and (GetGameTimer() - syncStartedAt) < SYNC_TIMEOUT_MS then
        print('[s6mdt][sync] Läuft bereits.')
        return
    end
    syncing = true
    syncStartedAt = GetGameTimer()
    print('[s6mdt][sync] Starte Server-Sync (Spieler + Fahrzeuge)…')

    -- p_image nur mitschicken, wenn kurz (URL); überlange Data-URLs weglassen.
    exports.oxmysql:query(
        "SELECT identifier, firstname, lastname, dateofbirth, sex, phone_number, " ..
        "CASE WHEN CHAR_LENGTH(p_image) <= 2048 THEN p_image ELSE NULL END AS p_image " ..
        "FROM users WHERE firstname IS NOT NULL AND firstname <> '' ORDER BY identifier LIMIT 10000",
        {},
        function(users)
            postInChunks('/fivem/sync/citizens', users or {}, CHUNK_CITIZENS, 'Bürger', function()
                exports.oxmysql:query(
                    "SELECT owner, plate, vehicle FROM owned_vehicles ORDER BY plate LIMIT 50000",
                    {},
                    function(vehicles)
                        local rows = vehiclesToRows(vehicles or {})
                        postInChunks('/fivem/sync/vehicles', rows, CHUNK_VEHICLES, 'Fahrzeuge', function()
                            syncing = false
                            print('[s6mdt][sync] Server-Sync abgeschlossen.')
                        end)
                    end
                )
            end)
        end
    )
end

-- Konsolen-Befehl. source 0 = Server-Konsole; Spieler braucht Ace-Recht s6mdt.sync.
RegisterCommand('s6sync', function(source)
    if source ~= 0 and not IsPlayerAceAllowed(source, 's6mdt.sync') then
        return
    end
    RunServerSync()
end, true)

-- Optionaler Auto-Sync (Start-Sync + periodisch).
CreateThread(function()
    if Config.SyncOnStart then
        Wait(8000) -- DB/Framework warmlaufen lassen
        RunServerSync()
    end
    local mins = tonumber(Config.SyncIntervalMinutes) or 0
    if mins > 0 then
        while true do
            Wait(mins * 60000)
            RunServerSync()
        end
    end
end)
