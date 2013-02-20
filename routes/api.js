/*
 * Serve JSON to our AngularJS client
 */
var crypto = require('crypto');
var util = require('util');
var async = require('async');
var cfg = require('../cfg/cfg');
var STATS_SECRET = process.env.STATS_SECRET || require('../cfg/secrets').stats_secret;
var Stats = require('../models/stats');
var Counter = require('../models/counter');
var Session = require('../models/session');
var Player = require('../models/player');
var statsEmitter = require('../emitters').statsEmitter;


module.exports = function(app) {
  // JSON API
  app.get('/api/stats/:id', stats);
  app.get('/api/matches', matches);
  app.get('/api/player/:id', player);
  app.get('/api/player/:id/matches', playerMatches);

  app.post('/api/stats/new', createStats);
  app.post('/api/stats/update', updateStats);
  app.post('/api/stats/gameover', gameOver);
};


// GET

var stats = function(req, res) {
  var id = req.params.id;
  Stats.findByIdAndUpdate(id, {$inc: {viewCount: 1}}, function(err, stats) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.json(false);
    }
    if (!stats) {
      return res.json(false);
    }

    stats.getPlayerData(function(err, playerdata) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.json(false);
      }

      // Turn the players array into an "associative array" using steamid as key
      //  and also add the metadata properties.
      statsObj = stats.toObject();
      statsObj.players = statsObj.players.reduce(function(reduced, item) {
        if (playerdata[item.steamid]) {
          item.avatar = playerdata[item.steamid].avatar;
          item.numericid = playerdata[item.steamid].numericid;
          item.country = playerdata[item.steamid].country;
        }
        reduced[item.steamid] = item;
        return reduced;
      }, {});

      res.json({ stats: statsObj });
    });
    

  });
};

var matches = function(req, res) {
  Stats.find({})
  .sort({_id:-1})
  .limit(12)
  .select('hostname redname bluname redCountry bluCountry isLive')
  .exec(function(err, matches) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.json(false);
    }
    if (!matches) {
      return res.json(false);
    }
    res.json({ matches: matches });
  });
};

var player = function(req, res) {
  var id = req.params.id;
  Player.findOne({numericid: id}, function(err, player) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.json(false);
    }
    if (!player) {
      return res.json(false);
    }

    Stats.findMatchesBySteamId(player._id, 0, 10, function(err, matches, count) {
      if (err) {
        console.log(err);
        console.trace(err);
        // return res.json(false);
      }

      res.json({ player: player, matches: matches, count: count });
    });

  });
};

var playerMatches = function(req, res) {
  var steamid = req.params.id;
  var current = parseInt(req.query['currentmatch'], 10);
  var skip = parseInt(req.query['skip'], 10);

  if (skip < 0) {
    Stats.findMatchesBySteamIdRanged(steamid, {$gt: current}, 1, -skip-10, 10, function(err, matches) {
      if (err) {
        console.log(err);
        console.trace(err);
        // return res.json(false);
      }

      res.json({ matches: matches.reverse() });
    });
  } else {
    Stats.findMatchesBySteamIdRanged(steamid, {$lt: current}, -1, skip-1, 10, function(err, matches) {
      if (err) {
        console.log(err);
        console.trace(err);
        // return res.json(false);
      }

      res.json({ matches: matches });
    });
  }
};


// POST

var createStats = function(req, res) {
  // For debugging
  console.log('createStats headers:', req.headers);
  console.log('createStats body:', util.inspect(req.body, false, null, false));

  // 1. Check header for api version
  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') { return res.end('false\n'); }

  // 2. Check if POST body contains the necessary info
  if (Object.keys(req.body).length === 0) { return res.end('false\n'); }
  if (!req.body.stats || !req.body.stats.players || req.body.stats.players.length === 0) { return res.end('false\n'); }
  
  // 3. Generate sessionid.
  var sessionId, match;
  // I'm putting matchId inside matchInfo so I can pass it by reference
  //  because I am a fucking idiot
  var matchInfo = {matchId: 0};

  // TODO: Use forwarded ip address from header, because this is behind a proxy
  var ip = req.connection.remoteAddress;

  // TODO: use some more/better information in the hmac
  var date = Date.now();
  var hmac = crypto.createHmac('sha1',STATS_SECRET);
  hmac.update(ip + date);
  sessionId = hmac.digest('hex');

  // 4. Then save stats to database.
  async.waterfall([
    // Get matchId (matchCounter.next)
    function(callback) {
      Counter.findOneAndUpdate({ "counter" : "matches" }, { $inc: {next:1} }, callback);
    },
    // Create new session document
    function(matchCounter, callback) {
      if (!matchCounter) { callback(new Error('createStats() -- No matchCounter')); }
      new Session({
        _id: sessionId,
        matchId: matchInfo.matchId = matchCounter.next,
        ip: ip,
        timeout: date + cfg.stats_session_timeout
      }).save(callback);
    },
    // Create new stats document
    async.apply(Stats.createStats, matchInfo, req.body.stats)
  // async.waterfall callback
  ], function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.end('false\n');
    }
    // Success! Respond to the gameserver with relevant info
    res.setHeader('matchurl', cfg.hostname + '/stats?id=' + matchInfo.matchId + '&ingame');
    res.setHeader('sessionid', sessionId);
    res.end('true\n');
  });
};

var updateStats = function(req, res) {
  // For debugging
  console.log('updateStats headers:', req.headers);
  console.log('updateStats body:', util.inspect(req.body, false, null, false));

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
