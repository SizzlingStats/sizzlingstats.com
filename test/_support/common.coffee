'use strict'

path = require 'path'

# global._ = require 'underscore'
global.request = require 'supertest'
global.assert = require 'assert'
global.sinon = require 'sinon'
chai = global.chai = require 'chai'
global.should = chai.should()
global.expect = chai.expect
global.AssertionError = chai.AssertionError
# chai.Assertion.includeStack = true

global.swallow = (thrower) ->
  try
    thrower()
  catch e
    console.error e

chai.use require 'sinon-chai'
chai.use require 'chai-changes'
chai.use require 'chai-factories'


global._rootDir = path.resolve __dirname + '/../../'
global._helper = (name) -> _rootDir + '/test/_support/' + name + '-helper'
