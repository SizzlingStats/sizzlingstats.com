/**
 * Serve JSON to our AngularJS client
 */

var uuid = require('node-uuid')
  , request = require('request')
  , cfg = require('config').cfg
  , Stats = require('../models/stats')
  , Player = require('../models/player');

module.exports = function(app) {
  // JSON API
  app.get('/api/stats/:id', statsShow);
  app.get('/api/matches/:limit', matches);
  app.get('/api/player/:id', player);
  app.get('/api/player/:id/matches', playerMatches);
  app.get('/api/playersearch', playerSearch);

  app.get('/api/settings', isLoggedIn, settingsShow);
  app.get('/api/generateKey', isLoggedIn, generateKey);

  app.put('/api/stats/:id', isLoggedIn, statsUpdate);
  app.delete('/api/stats/:id', isLoggedIn, statsDestroy);

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
  var id = parseInt(req.params.id,10);
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
      if (req.user &&
          (stats.owner.numericid === req.user.numericid ||
              req.user.privileges > 10) ) {
        statsObj.iHaveOwnership = true;
      }

      res.json({ stats: statsObj });
    });


  });
};

var matches = function(req, res) {
  var limitCount = req.params.limit;
  if (limitCount < 1 || limitCount == null) {
    limitCount = 12; //Default Value if one is not specified
  }
  limitCount = Math.min(limitCount, 100); //Limits Count to a Maximum of 100
  Stats.find({})
  .sort({_id:-1})
  .limit(limitCount)
  .select('hostname redname bluname redCountry bluCountry isLive')
  .lean()
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
    Stats.findMatchesBySteamIdRanged(steamid, {$gt: current}, 1, -skip-10, 10
                                   , function(err, matches) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.json({ matches: [] });
      }

      res.json({ matches: matches.reverse() });
    });
  } else {
    Stats.findMatchesBySteamIdRanged(steamid, {$lt: current}, -1, skip-1, 10
                                   , function(err, matches) {
      if (err) {
        console.log(err);
        console.trace(err);
        return res.json({ matches: [] });
      }

      res.json({ matches: matches });
    });
  }
};

var playerSearch = function(req, res) {
  var query = req.query.q;

  var options = {
    uri: cfg.elasticsearch_url + '/player/_search'
  , method: 'GET'
  , qs: {pretty: 'true'}
  , json: {
      query: {
        match: {
          'previousNames._id': {
            query: query
          }
        }
      }
    }
  };

  request(options, function(err, resp, body) {
    if (err) {
      console.log('playerSearch Error: ', err);
      return res.json([]);
    }
    if (!body.hits) {
      return res.json([]);
    }
    var dataset = [];
    for (var i=0; i<body.hits.hits.length; i++) {

      dataset.push({
        value: body.hits.hits[i]._source.name
      , numericid: body.hits.hits[i]._source.numericid
      // , tokens: ['some', 'thing']
      // , name: body.hits.hits[i]._source.name
      , names: body.hits.hits[i]._source.previousNames.reduce(function(a,b) {
                                                a.push(b._id); return a; }, [])
      , avatar: body.hits.hits[i]._source.avatar
      });
      // console.log(body.hits.hits[i]._source.previousNames);
    }

    return res.json(dataset);
  });
};

var settingsShow = function(req, res) {
  Player.findById(req.user._id, function(err, player) {
    if (err) {
      console.log(err);
      console.trace(err);
    }
    if (err || !player) {
      return res.send(404);
    }

    // Don't hide apikey since we are showing this user his own apikey
    return res.send( player.toJSON({ transform: true, showFields: ['apikey'] }) );

  });
};

var generateKey = function(req, res) {
  var newKey = uuid.v4();

  Player.findByIdAndUpdate(req.user._id, {$set: {apikey: newKey}}
                                       , function(err, player, numupdated) {
    if (err) {
      console.log(err);
      console.trace(err);
    }
    if (err || !player) {
      return res.send(500);
    }

    return res.send(player.apikey);
  });
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
