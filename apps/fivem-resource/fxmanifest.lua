fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aktensystem-bridge'
author 'CYQORE'
description 'Bridge zwischen FiveM und der Aktensystem-Plattform (Auth, Duty, Position, Notruf)'
version '0.2.0'

ui_page 'nui/index.html'

shared_scripts {
    'config.lua',
}

client_scripts {
    'client/main.lua',
    'client/nui.lua',
}

server_scripts {
    'server/adapters/interface.lua',
    'server/adapters/standalone.lua',
    'server/adapters/qbcore.lua',
    'server/adapters/qbox.lua',
    'server/adapters/esx.lua',
    'server/bridge.lua',
    'server/auth.lua',
    'server/main.lua',
}

files {
    'nui/index.html',
}
