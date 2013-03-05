// var request = require('request');
var Player = require('../../models/player');

// This is a really lazy way to do it, using the pre-save middleware!

Player.find({}, function(err, players) {
  var cb = function(err) {
    if (err) {
      console.log(err);
      console.trace(err);
      return false;
    }
    return true;
  };
  if ( !cb(err) ) { return false; }
  for (var i=0, len=players.length; i<len; i++) {
    player.save(cb);
  }
});
