-- CAD-Zugriff: NUI (in-game) + externer Browser (/cad). Kein manueller Login —
-- der Spieler wird über seine FiveM-Identität automatisch erkannt.

-- /mdt: CAD im Spiel öffnen (NUI). Server stellt One-Time-Code aus.
RegisterCommand('mdt', function()
    TriggerServerEvent('aktensystem:requestNui')
end, false)

-- /cad: Login-Link für den externen Browser (2. Monitor) anfordern.
RegisterCommand('cad', function()
    TriggerServerEvent('aktensystem:requestBrowser')
end, false)

-- Optional: Tastenbelegung F6 für /mdt
RegisterKeyMapping('mdt', 'Aktensystem CAD öffnen', 'keyboard', 'F6')

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
