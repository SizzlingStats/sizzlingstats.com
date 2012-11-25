/*
 * Serve JSON to our AngularJS client
 */
var crypto = require('crypto');
var util = require('util');
var cfg = require('../cfg/cfg');
var STATS_SECRET = process.env.STATS_SECRET || require('../cfg/secrets').stats_secret;
var Stats = require('../models/stats');
var Match = require('../models/match');
var Counter = require('../models/counter');
var Session = require('../models/session');
var Player = require('../models/player');
var statsEmitter = require('../emitters').statsEmitter;


module.exports = function(app) {
  // JSON API
  app.get('/api/stats/:id', stats);
  app.get('/api/matches', matches);

  app.post('/api/stats/new', createStats);
  app.post('/api/stats/update', updateStats);
  app.post('/api/stats/gameover', gameOver);
};


// GET

var stats = function(req, res) {
  var id = req.params.id;
  Stats.findById(id, function(err, stats) {
    if (err) {
      console.log(err);
      return res.json(false);
    }
    if (!stats) {
      return res.json(false);
    }

    stats.getPlayerData(function(err, playerdata) {
      if (err) {
        console.log(err);
        return res.json(false);
      }
      res.json({ stats: stats, playerdata: playerdata });
    });
    

  });
};

var matches = function(req, res) {
  Match.find({}).sort({_id:-1}).limit(15).exec(function(err, matches) {
    if (err) {
      console.log(err);
      return res.json(false);
    }
    if (!matches) {
      return res.json(false);
    }
    res.json({ matches: matches });
  });
};

// POST

var createStats = function(req, res) {
  // For debugging
  console.log('createStats headers:', req.headers);
  console.log('createStats body:', util.inspect(req.body, false, null, true));

  // 1. Check header for api version
  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }
  
  // 2. Generate sessionid.
  var sessionId, matchId;
  var ip = req.connection.remoteAddress;

  // We probably need some more/better information in the hmac
  var date = Date.now();
  var hmac = crypto.createHmac('sha1',STATS_SECRET);
  hmac.update(ip + date);
  sessionId = hmac.digest('hex');

  // 3. Then insert stats into database.
  // Get matchId
  Counter.findOneAndUpdate({ "counter" : "matches" },
                           { $inc: {next:1} },
                           function(err, matchCounter) {
    if (err) {
      console.log(err);
      return res.end('false\n');
    }
    if (!matchCounter) {
      return res.end('false\n');
    }
    matchId = matchCounter.next;

    // 3. Create new session, match, and stats documents
    new Session({
      _id: sessionId,
      matchId: matchId,
      ip: ip,
      timeout: date + cfg.stats_session_timeout }).save(function(e) {
      if (e) {
        console.log(e);
        return res.end('false\n');
      }

      matchData = {
        _id: matchId,
        hostname: req.body.stats.hostname,
        bluname: req.body.stats.bluname,
        redname: req.body.stats.redname,
        isLive: true
      };
      var match = new Match(matchData);
      match.save(function(e) {
        if (e) {
          console.log(e);
          return res.end('false\n');
        }

        var statsData = req.body.stats;
        statsData.round = 0;
        statsData.redscore = 0;
        statsData.bluscore = 0;
        statsData.roundduration = 0;
        statsData._id = matchId;
        statsData.isLive = true;
        statsData.created = new Date();
        statsData.updated = statsData.created;

        var stats = new Stats(statsData);
        stats.save(function(e) {
          if (e) {
            console.log(e);
            return res.end('false\n');
          }
          statsEmitter.emit('newMatch', match);

          res.setHeader('matchurl', cfg.hostname + 'stats?id=' + matchId + '&ingame');
          res.setHeader('sessionid', sessionId);
          res.end('true\n');

          // See if you can update the match with the countrycode info etc.
          match.updateWithPlayerData(stats, function(err) {
            if (err) {
              console.log(err);
              // do something
            }
          });

        }); // End Stats.save()
      }); // End Match.save()
    }); // End Session.save()
  }); // End Counter.findOneAndUpdate()
};

var updateStats = function(req, res) {
  // For debugging
  console.log('updateStats headers:', req.headers);
  console.log('updateStats body:', util.inspect(req.body, false, null, true));

  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }

  var sessionId = req.headers.sessionid;
  if (!sessionId) {
    return res.end('false\n');
  }

  var isEndOfRound = (req.headers.endofround === 'true');
  var ip = req.connection.remoteAddress;
  var matchId;

  // Validate sessionid and update the timeout
  Session.findByIdAndUpdate(sessionId, {$set:{timeout: Date.now()+cfg.stats_session_timeout}}, function(err, session) {
    if (err) {
      console.log(err);
      return res.end('false\n');
    }
    if (!session || ip !== session.ip) return res.end('false\n');

    // The request is validated, now we have to append the new data to the old
    matchId = session.matchId;
    Stats.appendStats(req.body.stats, matchId, isEndOfRound, function(err) {
      if (err) {
        console.log(err);
        return res.end('false\n');
      }
      res.end('true\n');
    });
    
  }); // end Session.findById()
};

var gameOver = function(req, res) {
  // For debugging
  console.log('gameOver headers:', req.headers);
  console.log('gameOver body:', util.inspect(req.body, false, null, true));

  if (!req.headers.matchduration || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }

  var newChats = [];
  if (req.body.chats) { newChats = req.body.chats; }
  
  var sessionId = req.headers.sessionid;
  var matchDuration = parseInt(req.headers.matchduration, 10);
  var ip = req.connection.remoteAddress;

  // Validate sessionid
  Session.findById(sessionId, function(err, session) {
    if (err) {
      console.log(err);
      return res.end('false\n');
    }
    if (!session || ip !== session.ip) return res.end('false\n');

    // The request is validated, now set game over
    var matchId = session.matchId;

    Stats.setGameOver(matchId, matchDuration, newChats, function(err) {
      if (err) {
        console.log(err);
        return res.end('false\n');
      }

      Match.setGameOver(session.matchId, null, function(err) {
        if (err) { console.log(err); }
      });

      // If all went well, expire the sessionkey and send HTTP response
      session.expireSessionKey(function(err) {
        if (err) {
          console.log(err);
          return res.end('false\n');
        }
        res.end('true\n');
      });
    });
    
  }); // end Session.findById()
};
