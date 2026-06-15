fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'aktensystem-bridge'
author 'CYQORE'
description 'Bridge zwischen FiveM und der Aktensystem-Plattform (Duty, Position, Notruf)'
version '0.1.0'

shared_scripts {
    'config.lua',
}

client_scripts {
    'client/main.lua',
}

server_scripts {
    'server/adapters/interface.lua',
    'server/adapters/standalone.lua',
    'server/adapters/qbcore.lua',
    'server/adapters/qbox.lua',
    'server/adapters/esx.lua',
    'server/bridge.lua',
    'server/main.lua',
}
