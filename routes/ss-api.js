/*
 * Serve JSON to our AngularJS client
 */
var crypto = require('crypto');
var util = require('util');
var async = require('async');
var cfg = require('../cfg/cfg');
var Stats = require('../models/stats');
var Counter = require('../models/counter');
var Session = require('../models/session');
var Player = require('../models/player');
var Analytics = require('../models/analytics');
var statsEmitter = require('../emitters').statsEmitter;


module.exports = function(app) {
  app.post('/api/stats/new', isValidVersion, hasValidStats, hasValidGameMode, ssCreateStats);
  app.post('/api/stats/update', hasValidStats, hasValidSessionId, ssUpdateStats);
  app.post('/api/stats/gameover', hasValidSessionId, ssGameOver);
};

// Middleware

var isValidVersion = function(req, res, next) {
  // For debugging
  // console.log('SS-API headers:', req.headers);
  // console.log('SS-API body:', util.inspect(req.body, false, null, false));
  // Check header for api version
  if (req.get('sizzlingstats') === 'v0.1' || req.get('sizzlingstats') === 'v0.2') {
    next();
  } else {
    res.send(403, '\nsizzlingstats.com - Error: Unsupported plugin version.\n\n');
  }
};

var hasValidSessionId = function(req, res, next) {
  if ( !req.get('sessionid') ) {
    return res.send(401, '\nsizzlingstats.com - Error: No sessionid.\n');
  }

  // Validate sessionid and update the timeout
  Session.findByIdAndUpdate(req.get('sessionid')
                          , { timeout: Date.now()+cfg.stats_session_timeout }
                          , function(err, session) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500, '\nsizzlingstats.com - Error: Unable to find sessionid\n');
    }
    if (!session || req.ip !== session.ip) {
      return res.send(401, '\nsizzlingstats.com - Error: Invalid sessionid.\n');
    }
    req.matchId = session.matchId;
    req.statsSession = session;
    next();
  });
};

var hasValidStats = function(req, res, next) {
  // Make sure the POST contains necessary info
  if (req.body.stats && req.body.stats.players && req.body.stats.players.length) {
    return next();
  }
  res.send(403, '\nsizzlingstats.com - Error: No stats received.\n');
};

var hasValidGameMode = function(req, res, next) {
  // Reject MVM
  if (typeof req.body.stats.map === 'string' && req.body.stats.map.toLowerCase().split('_')[0] !== 'mvm') {
    return next();
  }
  res.send(403, '\nsizzlingstats.com - Error: Unsupported gamemode.\n');
};

// POST

var ssCreateStats = function(req, res) {
  // Analytics
  Analytics.trackIp(req.ip, 'tf2servers');

  // Generate sessionid
  var sessionId
    , date = Date.now()
    , ip = req.ip;
  crypto.randomBytes(32, function(ex, buf) {
    sessionId = buf.toString('base64');
  });

  // Save stats to database
  async.waterfall([
      // Check for valid API Key
      function(callback) {
        var apikey = req.body.stats.apikey;
        if (!apikey) { return callback(null); }
        Player.findOne({apikey: apikey}, 'name numericid', function(err, player) {
          if (err) {
            // TODO: do something
          }
          if (player) {
            req.body.stats.owner = player.toObject();
          } else {
            req.body.stats.owner = {};
          }
          callback(null);
        });
      }
      // Get matchId (matchCounter.next)
    , function(callback) {
        Counter.findOneAndUpdate({ "counter" : "matches" }, { $inc: {next:1} }
                                                          , callback);
      }
      // Create new session document
    , function(matchCounter, callback) {
        if (!matchCounter) {
          return callback(new Error('createStats() -- No matchCounter'));
        }
        req.body.stats._id = matchCounter.next;
        new Session({
          _id: sessionId
        , matchId: matchCounter.next
        , ip: ip
        , timeout: date + cfg.stats_session_timeout
        }).save(callback);
      }
      // Create new stats document
    , async.apply(Stats.createStats, req.body.stats, req.get('sizzlingstats'))
    ]
    // async.waterfall callback
  , function(err, stats) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.send(500, '\nsizzlingstats.com - Error: Unable to save stats.\n');
      }
      // Success! Respond to the gameserver with relevant info
      res.set('matchurl', cfg.address + '/stats/' + stats._id + '?ingame');
      res.set('sessionid', sessionId);
      res.send(201, 'true\n');
    });
};

var ssUpdateStats = function(req, res) {
  var isEndOfRound = (req.get('endofround') === 'true');
  // Append the new data to the old
  Stats.appendStats(req.body.stats, req.matchId, isEndOfRound, false, function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500, '\nsizzlingstats.com - Error: Unable to update stats.\n');
    }
    res.send(202, 'true\n');
  });
};

var ssGameOver = function(req, res) {
  if ( !req.get('matchduration') ) {
    return res.send(403, '\nsizzlingstats.com - Error: Missing matchduration.\n');
  }
  var matchDuration = parseInt(req.get('matchduration'), 10);
  var newChats = req.body.chats || [];

  Stats.setGameOver(req.matchId, matchDuration, newChats, function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500, '\nsizzlingstats.com - Error: Unable to set gameover.\n');
    }

    // If all went well, expire the sessionkey and send HTTP response

    // delay for 4 seconds in case the logparser is parsing more stuff
    setTimeout(function () {
      req.statsSession.expireSessionKey(function(err) {
        if (err) {
          console.log(err);
          console.trace(err);
        }
      });
    }, 4000);

    res.send(202, 'true\n');
  });
};
