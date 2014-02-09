'use strict'


server = require _rootDir + '/server'


req = null


describe 'Middleware', ->


  describe '#isValidVersion', ->

    beforeEach ->
      req = request(server).post('/api/stats/new').send {stats: chai.create 'stats'}

    for version in [null, 'whatever']
      do (version) ->
        it 'should reject invalid versions', (done) ->
          req.set 'sizzlingstats', version
            .expect '\nsizzlingstats.com - Error: Unsupported plugin version.\n\n'
            .expect 403, done

    for version in ['v0.1', 'v0.2']
      do (version) ->
        it 'should accept valid versions', (done) ->
          req.set 'sizzlingstats', version
            .expect 'true\n'
            .expect 201, done


  describe '#hasValidGameMode', ->

    beforeEach ->
      req = request(server).post('/api/stats/new').set 'sizzlingstats', 'v0.2'

    for map in [null, 'mvm_coaltown', 'MVM_DECOY']
      do (map) ->
        it 'should reject invalid gamemodes', (done) ->
          req.send { stats: chai.create 'stats', {map: map} }
          .expect '\nsizzlingstats.com - Error: Unsupported gamemode.\n'
          .expect 403, done
