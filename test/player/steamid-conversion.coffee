'use strict'

Player = require _rootDir + '/models/player'


steamIdToNumericId = Player.steamIdToNumericId
numericIdToSteamId = Player.numericIdToSteamId

describe 'Player', ->

  describe '::steamIdToNumericId and ::numericIdToSteamId', ->

    it 'should convert correctly', ->
      # dy/dx
      expect( steamIdToNumericId('[U:1:35980414]'   ) ).to.eq '76561197996246142'
      expect( numericIdToSteamId('76561197996246142') ).to.eq '[U:1:35980414]'

      # gaben
      expect( steamIdToNumericId('[U:1:22202]'      ) ).to.eq '76561197960287930'
      expect( numericIdToSteamId('76561197960287930') ).to.eq '[U:1:22202]'

      # Some guy
      expect( steamIdToNumericId('[U:1:121032190]'  ) ).to.eq '76561198081297918'
      expect( numericIdToSteamId('76561198081297918') ).to.eq '[U:1:121032190]'

      # Some guy
      expect( steamIdToNumericId('[U:1:111818179]'  ) ).to.eq '76561198072083907'
      expect( numericIdToSteamId('76561198072083907') ).to.eq '[U:1:111818179]'


  describe '::steamId2ToSteamId3 and ::steamId3ToSteamId2', ->

    it 'should convert correctly', ->
      # dy/dx
      expect( Player.steamId2ToSteamId3('STEAM_0:0:17990207') ).to.eq '[U:1:35980414]'
      expect( Player.steamId3ToSteamId2('[U:1:35980414]'    ) ).to.eq 'STEAM_0:0:17990207'

      # gaben
      expect( Player.steamId2ToSteamId3('STEAM_0:0:11101') ).to.eq '[U:1:22202]'
      expect( Player.steamId3ToSteamId2('[U:1:22202]'    ) ).to.eq 'STEAM_0:0:11101'

      expect( Player.steamId2ToSteamId3('STEAM_0:0:60516095') ).to.eq '[U:1:121032190]'
      expect( Player.steamId3ToSteamId2('[U:1:121032190]'   ) ).to.eq 'STEAM_0:0:60516095'

      expect( Player.steamId2ToSteamId3('STEAM_0:1:55909089') ).to.eq '[U:1:111818179]'
      expect( Player.steamId3ToSteamId2('[U:1:111818179]'   ) ).to.eq 'STEAM_0:1:55909089'

      expect( Player.steamId2ToSteamId3('STEAM_0:1:99668934') ).to.eq '[U:1:199337869]'
      expect( Player.steamId3ToSteamId2('[U:1:199337869]'   ) ).to.eq 'STEAM_0:1:99668934'
