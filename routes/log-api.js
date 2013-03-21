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

  app.post('/api/log/stats/update', isLocalhost, logUpdateStats);
  app.post('/api/log/stats/roundover', isLocalhost, hasValidSessionId, logRoundOver);
  app.post('/api/log/stats/gameover', isLocalhost, hasValidSessionId, logGameOver);
};

// Middleware

var isLocalhost = function(req, res, next) {
  if ( req.ip !== '127.0.0.1' ) {
    return res.send(401, '\nsizzlingstats.com - Error: Get outta here\n');
  }
  next();
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

// POST

var logUpdateStats = function(req, res) {
  // Don't save, just send to clients
  statsEmitter.emit('updateLiveStats', req.body.stats);
  res.send(202, 'true\n');
};

var logRoundOver = function(req, res) {
  // var isEndOfRound = (req.get('endofround') === 'true');
  // Append the new data to the old
  Stats.appendStats(req.body.stats, req.matchId, true, function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500, '\nsizzlingstats.com - Error: Unable to update stats.\n');
    }
    res.send(202, 'true\n');
  });
};

var logGameOver = function(req, res) {
  if ( !req.get('matchduration') ) {
    return res.send(403, '\nsizzlingstats.com - Error: Missing matchduration.\n');
  }
  var matchDuration = parseInt(req.get('matchduration'), 10);
  // var newChats = req.body.chats || [];

  Stats.setGameOver(req.matchId, matchDuration, req.body.chats, function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500, '\nsizzlingstats.com - Error: Unable to set gameover.\n');
    }

    // If all went well, expire the sessionkey and send HTTP response
    req.statsSession.expireSessionKey(function(err) {
      if (err) {
        console.log(err);
        console.trace(err);
      }
      res.send(202, 'true\n');
    });
  });
};
