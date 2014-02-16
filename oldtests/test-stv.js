/**
 * tests/test-stv.js
 */

var assert = require('assert')
  , async = require('async')
  , request = require('request')
  , mock = require('./test-api-mocks.js');


var sessionid, matchurl;

var optionsNew = {
  uri: 'http://localhost:8001/api/stats/new'
, method: 'POST'
, timeout: 5000
, headers: mock.statsHeaders1
, json: mock.statsBody1
};

var optionsUpdate = {
  uri: 'http://localhost:8001/api/stats/update'
, method: 'POST'
, timeout: 5000
, headers: mock.statsHeaders4
, json: mock.statsBody4
};

var optionsGameover = {
  uri: 'http://localhost:8001/api/stats/gameover'
, method: 'POST'
, timeout: 5000
, headers: mock.statsHeaders7
, json: mock.statsBody7
};


/**
 * Mock createStats
 */

function createStats (callback) {
  request(optionsNew, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode > 202) {
      return callback(new Error('tests/test-stv.js -createStats Error: ' + res.statusCode));
    }

    sessionid = res.headers.sessionid;
    matchurl = res.headers.matchurl;

    return callback(null, res, body);
  });
}

/**
 * Mock updateStats, endofround=true
 */

function updateStats (callback) {
  optionsUpdate.headers.sessionid = sessionid;
  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode > 202) {
      return callback(new Error('tests/test-stv.js -updateStats Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
}

/**
 * Mock gameover + chats
 */

function gameOver (callback) {
  optionsGameover.headers.sessionid = sessionid;
  request(optionsGameover, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode > 202) {
      return callback(new Error('tests/test-stv.js -gameOver Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
}


function stvUploadFinished (callback) {
  var options = {
    uri: 'http://localhost:8001/api/stats/stvuploadfinished'
  , method: 'POST'
  , timeout: 5000
  , headers: {sessionid: sessionid}
  };
  request(options, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode > 202) {
      return callback(new Error('tests/test-stv.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
}


var now = Date.now();
// Run tests
async.series([

  createStats

, updateStats

, function(callback) {
    gameOver(function (err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(res.headers.stvuploadurl, 'stvuploadurl should be present');
      callback(err);
    });
  }

, function(callback) {
    stvUploadFinished(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

], function(err, results) {
  if (err) {
    console.log(err);
    assert.ok(!err, 'err should not be present (duh)');
  } else {
    console.log('test-stv.js successfully completed in', Date.now() - now, 'ms.');
  }
});
