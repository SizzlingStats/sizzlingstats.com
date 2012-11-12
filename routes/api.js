/*
 * Serve JSON to our AngularJS client
 */
var crypto = require('crypto');
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

  app.post('/api/stats', addStats);
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
  Match.find({}).sort({_id:-1}).limit(10).exec(function(err, matches) {
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

var addStats = function(req, res) {
  // For debugging
  console.log(req.body);

  // Control flow:
  // 1. Check header for api version
  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }
  
  // 2. Check header for sessionid, generate session if needed.
  // If sessionid is supplied, validate it.
  // 3. Then insert stats into database.
  var sessionid = req.headers.sessionid;
  var ip = req.connection.remoteAddress;
  var matchId;
  if (!sessionid) {
    // We probably need some more/better information in the hmac
    var date = Date.now();
    var hmac = crypto.createHmac('sha1',STATS_SECRET);
    hmac.update(ip + date);
    sessionid = hmac.digest('hex');

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
      // res.setHeader('matchurl', cfg.hosturl + 'match/' +matchId);
      // res.setHeader('sessionid', sessionid);

      // 3. Create new session, match, and stats documents
      new Session({
        _id: sessionid,
        matchId: matchId,
        ip: ip,
        timeout: date + cfg.statsSessionTimeout }).save(function(e) {
        if (e) {
          console.log(e);
          return res.end('false\n');
        }

        newMatch = {
          _id: matchId,
          hostname: req.body.stats.hostname,
          bluname: req.body.stats.bluname,
          redname: req.body.stats.redname,
          isLive: true
        };
        new Match(newMatch).save(function(e) {
          if (e) {
            console.log(e);
            return res.end('false\n');
          }

          var stats = req.body.stats;
          stats.round = 0;
          stats._id = matchId;
          stats.isLive = true;
          stats.created = new Date();

          new Stats(stats).save(function(e) {
            if (e) {
              console.log(e);
              return res.end('false\n');
            }
            statsEmitter.emit('newMatch', newMatch);

            res.setHeader('matchurl', cfg.hosturl + 'match/' +matchId);
            res.setHeader('sessionid', sessionid);
            return res.end('true\n');
          }); // End Stats.save()
        }); // End Match.save()
      }); // End Session.save()
    }); // End Counter.findOneAndUpdate()
  } else {
    // Validate sessionid
    Session.findById(sessionid, function(err, session) {
      if (err) {
        console.log(err);
        return res.end('false\n');
      }
      if (!session || ip !== session.ip) return res.end('false\n');

      // The request is validated, now we have to append the new data to the old
      matchId = session.matchId;
      Stats.appendStats(req.body.stats, matchId, function(err) {
        if (err) {
          console.log(err);
          return res.end('false\n');
        }
        res.setHeader('matchurl', cfg.hosturl + 'match/' +matchId);
        res.setHeader('sessionid', sessionid);
        res.end('true\n');
      });
      
    }); // end Session.findById()
  } // end else
};

var gameOver = function(req, res) {
  // For debugging
  console.log('gameOver headers:', req.headers);

  if (!req.headers.matchduration || req.headers.sizzlingstats !== 'v0.1') {
    return res.end('false\n');
  }
  
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
    console.log('matchId:', matchId);

    Stats.setGameOver(matchId, matchDuration, function(err) {
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
