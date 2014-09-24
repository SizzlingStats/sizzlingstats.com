'use strict'

Player = require _rootDir + '/models/player'


steamIdToNumericId = Player.steamIdToNumericId
numericIdToSteamId = Player.numericIdToSteamId

describe 'Player', ->

  describe '::steamIdToNumericId and ::numericIdToSteamId', ->

    it 'should convert correctly', ->
      # dy/dx
      expect( steamIdToNumericId('STEAM_0:0:17990207') ).to.eq '76561197996246142'
      expect( numericIdToSteamId('76561197996246142' ) ).to.eq 'STEAM_0:0:17990207'

      # gaben
      expect( steamIdToNumericId('STEAM_0:0:11101'  ) ).to.eq '76561197960287930'
      expect( numericIdToSteamId('76561197960287930') ).to.eq 'STEAM_0:0:11101'

      # Some guy
      expect( steamIdToNumericId('STEAM_0:0:60516095') ).to.eq '76561198081297918'
      expect( numericIdToSteamId('76561198081297918' ) ).to.eq 'STEAM_0:0:60516095'

      # Some guy
      expect( steamIdToNumericId('STEAM_0:1:55909089') ).to.eq '76561198072083907'
      expect( numericIdToSteamId('76561198072083907' ) ).to.eq 'STEAM_0:1:55909089'


