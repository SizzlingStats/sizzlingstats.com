var mongoose = require('mongoose')
  , async = require('async')
  , cfg = require('../../cfg/cfg')
  , Player = require('../../models/player');
mongoose.connect(cfg.mongo_url);

// This is a really lazy way to do it, using the pre-save middleware!

Player.find({}, function(err, players) {
  if (err) {
    console.log(err);
    console.trace(err);
    return false;
  }

  var savePlayer = function(player, callback) {
    player.save(callback);
  };

  async.each(players, savePlayer, function(err) {
    mongoose.disconnect();

    if (err) {
      console.log(err);
      console.trace(err);
      return false;
    }
    console.log('Done.');
  });
});
