'use strict'

server = require _rootDir + '/server'

describe 'Server', ->

  it 'responds with 200', (done) ->
    request server
      .get '/'
      .expect 200
      .end done
