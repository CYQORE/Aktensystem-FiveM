fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 's6mdt'
author 'CYQORE'
description 'S6mdt — Bridge zwischen FiveM und der S6mdt-Plattform (Auth, Duty, Position, Notruf)'
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
    'server/enforcement.lua',
    'server/sync.lua',
}

files {
    'nui/index.html',
}
