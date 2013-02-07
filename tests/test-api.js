/**
 * tests/test-api.js
 */

var assert = require('assert')
  , async = require('async')
  , request = require('request')
  , mock = require('./test-api-mocks.js');


var sessionid, matchurl;

var optionsNew = {
  uri: 'http://localhost:8001/api/stats/new',
  method: 'POST',
  timeout: 7000
};

var optionsUpdate = {
  uri: 'http://localhost:8001/api/stats/update',
  method: 'POST',
  timeout: 7000
};

var optionsGameover = {
  uri: 'http://localhost:8001/api/stats/gameover',
  method: 'POST',
  timeout: 7000
};


/**
 * Test 1: Mock createStats
 */

var test1 = function(callback) {

  optionsNew.headers = mock.statsHeaders1;
  optionsNew.json = mock.statsBody1;

  request(optionsNew, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    sessionid = res.headers.sessionid;
    matchurl = res.headers.matchurl;

    return callback(null, res, body);
  });
};

/**
 * Test 2: Mock updateStats, endofround=false
 */

var test2 = function(callback) {

  mock.statsHeaders2.sessionid = sessionid;
  optionsUpdate.headers = mock.statsHeaders2;
  optionsUpdate.json = mock.statsBody2;

  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};

/**
 * Test 3: Mock updateStats, endofround=false, new player added (Jay)
 */

var test3 = function(callback) {

  mock.statsHeaders3.sessionid = sessionid;
  optionsUpdate.headers = mock.statsHeaders3;
  optionsUpdate.json = mock.statsBody3;

  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};

/**
 * Test 4: Mock updateStats, endofround=true
 */

var test4 = function(callback) {

  mock.statsHeaders4.sessionid = sessionid;
  optionsUpdate.headers = mock.statsHeaders4;
  optionsUpdate.json = mock.statsBody4;

  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};

/**
 * Test 5: Mock updateStats, endofround=true, new player added (b4nny)
 */

var test5 = function(callback) {

  mock.statsHeaders5.sessionid = sessionid;
  optionsUpdate.headers = mock.statsHeaders5;
  optionsUpdate.json = mock.statsBody5;

  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};

/**
 * Test 6: Mock updateStats, endofround=true, old player reappeared (Jay)
 */

var test6 = function(callback) {

  mock.statsHeaders6.sessionid = sessionid;
  optionsUpdate.headers = mock.statsHeaders6;
  optionsUpdate.json = mock.statsBody6;

  request(optionsUpdate, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};

/**
 * Test 7: Mock gameover + chats
 */

var test7 = function(callback) {

  mock.statsHeaders7.sessionid = sessionid;
  optionsGameover.headers = mock.statsHeaders7;
  optionsGameover.json = mock.statsBody7;

  request(optionsGameover, function(err, res, body) {
    // Error checking
    if (err) {
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('tests/test-api.js -API Error: ' + res.statusCode));
    }

    return callback(null, res, body);
  });
};



// Run tests
async.series([
  function(callback) {
    test1(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(res.headers.matchurl, 'matchurl should be present');
      assert.ok(res.headers.sessionid, 'sessionid should be present');
      callback(err);
    });
  }

, function(callback) {
    test2(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

, function(callback) {
    test3(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

, function(callback) {
    test4(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

, function(callback) {
    test5(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

, function(callback) {
    test6(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

  , function(callback) {
    test7(function(err, res, body) {
      assert.ok(body, 'body should return true');
      assert.ok(!res.headers.matchurl, 'matchurl should not be present');
      assert.ok(!res.headers.sessionid, 'sessionid should not be present');
      callback(err);
    });
  }

], function(err, results) {
  if (err) {
    console.log(err);
    console.trace(err);
  } else {
    console.log('test-api.js successfully completed.');
  }
});
