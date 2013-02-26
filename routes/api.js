/*
 * Serve JSON to our AngularJS client
 */

// var crypto = require('crypto');
// var util = require('util');
// var async = require('async');
// var cfg = require('../cfg/cfg');
// var STATS_SECRET = process.env.STATS_SECRET || require('../cfg/secrets').stats_secret;
var Stats = require('../models/stats');
// var Counter = require('../models/counter');
// var Session = require('../models/session');
var Player = require('../models/player');
// var statsEmitter = require('../emitters').statsEmitter;


module.exports = function(app) {
  // JSON API
  app.get('/api/stats/:id', statsShow);
  app.get('/api/matches', matches);
  app.get('/api/player/:id', player);
  app.get('/api/player/:id/matches', playerMatches);

  app.put('/api/stats/:id', isLoggedIn, statsUpdate);
  app.del('/api/stats/:id', isLoggedIn, statsDestroy);

  // all others
  app.all('/api/*', function(req, res) { res.send(404); } );
};

// Helpers

var isLoggedIn = function(req, res, next) {
  if (req.loggedIn && req.user) {
    return next();
  }
  res.send(401);
};

// GET

var statsShow = function(req, res) {
  var id = req.params.id;
  Stats.findByIdAndUpdate(id, {$inc: {viewCount: 1}}, function(err, stats) {
    if (err) {
      console.log(err);
      console.trace(err);
      return res.send(500);
    }
    if (!stats) {
      return res.send(404);
    }

    stats.getPlayerData(function(err, playerData) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.json(false);
      }

      // Transform stats with playerData
      var statsObj = stats.toObject({ transform: true, playerData: playerData });
      
      // Determine if the requester has ownership privileges on this document
      if (req.user && (stats.owner.numericid === req.user.numericid || req.user.privileges > 10) ) {
        statsObj.iHaveOwnership = true;
      }

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
    res.json({ matches: matches });
  });
};

var player = function(req, res) {
  var id = req.params.id;
  Player.findOne({numericid: id}, function(err, player) {
    if (err) {
      console.log(err);
      console.trace(err);
    }
    if (err || !player) {
      return res.send(404);
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
        return res.json({ matches: [] });
      }

      res.json({ matches: matches.reverse() });
    });
  } else {
    Stats.findMatchesBySteamIdRanged(steamid, {$lt: current}, -1, skip-1, 10, function(err, matches) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.json({ matches: [] });
      }

      res.json({ matches: matches });
    });
  }
};


// PUT

var statsUpdate = function(req, res) {
  Stats.findById(req.params.id, function(err, stats) {
    if (err || !stats) { return res.send(404); }

    // Determine if the requester has ownership privileges on this document
    if (stats.owner.numericid !== req.user.numericid && req.user.privileges <= 10) {
      console.log(req.user.privileges);
      return res.send(401);
    }

    stats.redname = req.body.redname;
    stats.bluname = req.body.bluname;
    stats.save(function(err) {
      if (err) {return res.send(400); }
      res.send(200);
    });
  });
};

var statsDestroy = function(req, res) {
  Stats.findById(req.params.id, function(err, stats) {
    if (err || !stats) { return res.send(404); }

    // Determine if the requester has ownership privileges on this document
    if (stats.owner.numericid !== req.user.numericid && req.user.privileges <= 10) {
      return res.send(401);
    }
    
    stats.remove(function(err) {
      if (err) {return res.send(500); }
      res.send(200);
    });
  });
};
