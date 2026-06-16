-- CAD-Zugriff: NUI (in-game) + externer Browser (/cad). Kein manueller Login —
-- der Spieler wird über seine FiveM-Identität automatisch erkannt.

-- /s6mdt: CAD im Spiel öffnen (NUI). Server stellt One-Time-Code aus.
-- (eigener Name, damit es nicht mit anderen MDT-Resources wie nn_mdt kollidiert)
RegisterCommand('s6mdt', function()
    TriggerServerEvent('aktensystem:requestNui')
end, false)

-- /cad bzw. /s6cad: Login-Link für den externen Browser (2. Monitor) anfordern.
-- (zwei Namen, falls /cad von einer anderen Resource belegt ist)
local function askBrowserLogin()
    TriggerEvent('chat:addMessage', {
        color = { 180, 180, 60 },
        args = { 'CAD', 'Login-Link wird angefordert…' },
    })
    TriggerServerEvent('aktensystem:requestBrowser')
end
RegisterCommand('cad', askBrowserLogin, false)
RegisterCommand('s6cad', askBrowserLogin, false)

-- Fehler beim Anfordern (Backend nicht erreichbar / Token)
RegisterNetEvent('aktensystem:linkError', function(status)
    local hint
    if status == 0 or status == -1 or status == nil then
        hint = 'Backend nicht erreichbar — s6mdt_api_url / Port 4000 prüfen.'
    elseif status == 401 then
        hint = 'Token falsch — s6mdt_bridge_token = FIVEM_BRIDGE_TOKEN?'
    else
        hint = ('HTTP %s'):format(tostring(status))
    end
    TriggerEvent('chat:addMessage', { color = { 220, 60, 60 }, args = { 'CAD', 'Fehler: ' .. hint } })
end)

-- /s6mdtadmin: einmaliger Bootstrap — erster Nutzer wird Plattform-Admin.
RegisterCommand('s6mdtadmin', function()
    TriggerEvent('chat:addMessage', {
        color = { 180, 180, 60 },
        args = { 'CAD', 'Admin-Anfrage gesendet…' },
    })
    TriggerServerEvent('aktensystem:claimAdmin')
end, false)

RegisterNetEvent('aktensystem:adminClaimResult', function(claimed, reason, status)
    if claimed then
        TriggerEvent('chat:addMessage', {
            color = { 0, 200, 120 },
            args = { 'CAD', 'Du bist jetzt Plattform-Admin. Öffne das CAD mit /mdt.' },
        })
    elseif reason == 'already_claimed' then
        TriggerEvent('chat:addMessage', {
            color = { 220, 60, 60 },
            args = { 'CAD', 'Admin ist bereits vergeben.' },
        })
    else
        local hint
        if status == 0 or status == -1 or status == nil then
            hint = 'Backend nicht erreichbar — läuft die API? s6mdt_api_url prüfen.'
        elseif status == 401 then
            hint = 'Token falsch — s6mdt_bridge_token muss = FIVEM_BRIDGE_TOKEN sein.'
        else
            hint = ('HTTP %s'):format(tostring(status))
        end
        TriggerEvent('chat:addMessage', {
            color = { 220, 60, 60 },
            args = { 'CAD', 'Admin-Claim fehlgeschlagen: ' .. hint },
        })
    end
end)

-- Optional: Tastenbelegung F7 für /s6mdt (in den FiveM-Settings änderbar)
RegisterKeyMapping('s6mdt', 'S6mdt CAD öffnen', 'keyboard', 'F7')

-- Server liefert die Login-URL (NUI)
RegisterNetEvent('aktensystem:openNui', function(url)
    SetNuiFocus(true, true)
    SendNUIMessage({ action = 'open', url = url })
end)

-- Server liefert den Browser-Link
RegisterNetEvent('aktensystem:browserLink', function(url)
    SetClipboard(url)
    TriggerEvent('chat:addMessage', {
        color = { 0, 200, 120 },
        args = { 'CAD', 'Login-Link in Zwischenablage kopiert — im Browser einfügen: ' .. url },
    })
end)

-- NUI schließt sich (ESC) -> Fokus freigeben
RegisterNUICallback('close', function(_, cb)
    SetNuiFocus(false, false)
    cb({ ok = true })
end)

-- Sicherheits-Fokusreset bei Resource-Stop
AddEventHandler('onResourceStop', function(resource)
    if resource == GetCurrentResourceName() then
        SetNuiFocus(false, false)
    end
end)
