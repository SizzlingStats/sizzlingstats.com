/*
 * Serve JSON to our AngularJS client
 */
var mongoose = require('mongoose');
var crypto = require('crypto');
var cfg = require('../cfg/cfg');
var secrets = require('../cfg/secrets');
var Stats = require('../models/stats');
var Match = require('../models/match');
var Counter = require('../models/counter');
var Session = require('../models/session');

// GET

exports.stats = function(req, res) {
  var id = req.params.id;
  // Maybe change this to findById
  Stats.findById(id, function(err, stats) {
    if (err || !stats) {
      return res.json(false);
    }
    res.json({ stats: stats });
  });
};

exports.matches = function(req, res) {
  Match.find({}).sort({_id:-1}).limit(10).exec(function(err, matches) {
    if (err || !matches) {
      return res.json(false);
    }
    res.json({ matches: matches });
  });
};

// POST

exports.addStats = function(req, res) {
  // Change this later to reject requests that
  // exceed a certain size

  // Control flow:
  // 1. Check header for api version
  if (!req.body.stats || req.headers.sizzlingstats !== 'v0.1') {
    return res.json(false);
  }
  
  // 2. Check header for sessionid, generate session if needed.
  // If sessionid is supplied, validate it.
  // 3. Then insert stats into database.
  var sessionid = req.headers.sessionid;
  var ip = req.connection.remoteAddress;
  var matchid;
  if (!sessionid) {
    // We probably need some more/better information in the hmac
    var date = Date.now();
    var hmac = crypto.createHmac('sha1',secrets.statssession);
    hmac.update(ip + date);
    sessionid = hmac.digest('hex');

    // Get matchid
    Counter.findOneAndUpdate({ "counter" : "matches" },
                             { $inc: {next:1} },
                             function(err, matchCounter) {
      // not sure how to handle err here, fix it later
      if (err || !matchCounter) {
        console.log(err);
        return res.json(false);
      }
      matchid = matchCounter.next;
      res.setHeader('matchurl', cfg.hosturl + 'match/' +matchid);
      res.setHeader('sessionid', sessionid);

      // 3. Create new session, match, and stats documents
      new Session({
        _id: sessionid,
        matchid: matchid,
        ip: ip,
        timeout: cfg.statstimeout }).save(function(e) {
        // not sure how to handle err here, fix it later
        if (e) console.log(e);
      });

      new Match({
        _id: matchid,
        hostname: req.body.stats.hostname,
        bluname: req.body.stats.bluname,
        redname:req.body.stats.redname }).save(function(e) {
        // not sure how to handle err here, fix it later
        if (e) console.log(e);
      });

      // Massage JSON into a form that we like
      var stats = req.body.stats;
      stats.round = 0;
      stats.bluscore = [stats.bluscore];
      stats.redscore = [stats.redscore];
      stats.players.forEach(function (player) {
        for (var field in player) {
          if (field !== "steamid" && field !== "team" && field !== "name") {
            player[field] = [player[field]];
          }
        }
      });
      stats._id = matchid;

      new Stats(stats).save(function(e) {
        // not sure how to handle err here, fix it later
        if (e) {
          console.log(e);
          return res.json(false);
        }
        res.json(true);
      });
    });
  } else {
    // Validate sessionid
    Session.findById(sessionid, function(err, session) {
      if (err) console.log(err); //do something
      if (!session || ip !== session.ip) return res.json(false);

      // The request is validated, now we have to massage the new data into the old
      matchid = session.matchid;
      Stats.findById(matchid, function(err, stats) {
        if (err || !stats) {
          console.log(err);
          return res.json(false);
        }

        var newstats = req.body.stats;
        var round = stats.round += 1;

        stats.bluscore[round] = newstats.bluscore;
        stats.redscore[round] = newstats.redscore;
        newstats.players.forEach(function(player) {
          var isNewPlayer = true;

          // look for the oldPlayer with a matching steamid
          // and add new values to the stat arrays
          stats.players.forEach(function(oldPlayer) {
            if (oldPlayer.steamid === player.steamid) {
              isNewPlayer = false;
              
              oldPlayer.kills[round] = player.kills;
              oldPlayer.assists[round] = player.assists;
              oldPlayer.deaths[round] = player.deaths;
              oldPlayer.damage[round] = player.damage;
              oldPlayer.heals[round] = player.heals;
              oldPlayer.medkills[round] = player.medkills;

              return;
            }
          });


          // If a matching oldPlayer can't be found, then we
          // need to turn newPlayer's stats into arrays, and
          // then push newPlayer into the existing document
          if (isNewPlayer) {
            
            var newPlayer = {
              steamid: player.steamid,
              team: player.team,
              name: player.name
            };

            newPlayer.kills = [];
            newPlayer.kills[round] = player.kills;
            newPlayer.assists = [];
            newPlayer.assists[round] = player.assits;
            newPlayer.deaths = [];
            newPlayer.deaths[round] = player.deaths;
            newPlayer.damage = [];
            newPlayer.damage[round] = player.damage;
            newPlayer.heals = [];
            newPlayer.heals[round] = player.heals;
            newPlayer.medkills = [];
            newPlayer.medkills[round] = player.medkills;


            stats.players.push(newPlayer);
          }

        });

        // Update Stats document

        Stats.update({_id:matchid},
                     {$set: {
                        bluscore: stats.bluscore,
                        redscore: stats.redscore,
                        round: round,
                        players: stats.players}},
                     function(err) {
          if (err) {
            console.log(err);
            return res.json(false);
          }
          res.json(true);
        });

      });
    });

  } // end else

};