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
var statsEmitter = require('../emitters').statsEmitter;


module.exports = function(app) {
  app.post('/api/stats/new', ssCreateStats);
  app.post('/api/stats/update', ssUpdateStats);
  app.post('/api/stats/gameover', ssGameOver);
};

// POST

var ssCreateStats = function(req, res) {
  // For debugging
  // console.log('createStats headers:', req.headers);
  // console.log('createStats body:', util.inspect(req.body, false, null, false));

  // 1. Check header for api version
  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }

  // 2. Check if POST body contains the necessary info
  if (Object.keys(req.body).length === 0) {
    return res.end('false\n');
  }
  if (!req.body.stats || !req.body.stats.players || !req.body.stats.players.length) {
    return res.end('false\n');
  }

  // 3. Generate sessionid.
  var sessionId
    , date = Date.now()
    , ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  crypto.randomBytes(32, function(ex, buf) {
    sessionId = buf.toString('base64');
  });

  // 4. Then save stats to database.
  async.waterfall([
      // Check for valid API Key
      function(callback) {
        if (!req.headers.apikey) { return callback(null); }
        Player.findOne({apikey: req.headers.apikey}, 'name numericid'
                                                   , function(err, player) {
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
    , async.apply(Stats.createStats, req.body.stats)
    ]
    // async.waterfall callback
  , function(err, stats) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.end('false\n');
      }
      // Success! Respond to the gameserver with relevant info
      res.setHeader('matchurl', cfg.hostname + '/stats/' + stats._id + '?ingame');
      res.setHeader('sessionid', sessionId);
      res.end('true\n');
    });
};

var ssUpdateStats = function(req, res) {
  // For debugging
  // console.log('updateStats headers:', req.headers);
  // console.log('updateStats body:', util.inspect(req.body, false, null, false));

  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }

  var sessionId = req.headers.sessionid;
  if (!sessionId) {
    return res.end('false\n');
  }

  var isEndOfRound = (req.headers.endofround === 'true');
  var matchId;
  var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

  // Validate sessionid and update the timeout
  Session.findByIdAndUpdate(sessionId
                          , { timeout: Date.now()+cfg.stats_session_timeout }
                          , function(err, session) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.end('false\n');
    }
    if (!session || ip !== session.ip) return res.end('false\n');

    // The request is validated, now we have to append the new data to the old
    matchId = session.matchId;
    Stats.appendStats(req.body.stats, matchId, isEndOfRound, function(err) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.end('false\n');
      }
      res.end('true\n');
    });

  }); // end Session.findById()
};

var ssGameOver = function(req, res) {
  // For debugging
  // console.log/('gameOver headers:', req.headers);
  // console.log('gameOver body:', util.inspect(req.body, false, null, true));

  if (!req.headers.matchduration || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }

  var newChats = [];
  if (req.body.chats) { newChats = req.body.chats; }

  var sessionId = req.headers.sessionid;
  var matchDuration = parseInt(req.headers.matchduration, 10);
  var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;

  // Validate sessionid
  Session.findById(sessionId, function(err, session) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.end('false\n');
    }
    if (!session || ip !== session.ip) return res.end('false\n');

    // The request is validated, now set game over
    var matchId = session.matchId;

    Stats.setGameOver(matchId, matchDuration, newChats, function(err) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.end('false\n');
      }

      // If all went well, expire the sessionkey and send HTTP response
      session.expireSessionKey(function(err) {
        if (err) {
          console.log(err);
          console.trace(err);
          return res.end('false\n');
        }
        res.end('true\n');
      });
    });

  }); // end Session.findById()
};
