var mongoose = require('mongoose')
  , request = require('request')
  , async = require('async')
  , cfg = require('../../config/cfg')
  , Player = require('../../models/player');
mongoose.connect(cfg.mongo_url);

// This is not a very good way to do it

Player.find({}, function(err, players) {
  if (err) {
    console.log(err);
    console.trace(err);
    return false;
  }

  var indexPlayer = function(player, callback) {
    var options = {
      uri: 'http://localhost:9200/sizzlingstats/player/' + player._id
    , method: 'PUT'
    , timeout: 10000 // 10s
    , json: player
    };
    request(options, function(err, res, body) {
      if (err) { return callback(err); }
      if (res.statusCode >= 200 && res.statusCode <300) {
        callback(null);
      } else {
        callback(res.statusCode);
      }
    });
  };

  async.eachLimit(players, 10, indexPlayer, function(err) {
    mongoose.disconnect();

    if (err) {
      console.log(err);
      console.trace(err);
      return false;
    }
    console.log('Done.');
  });
});
