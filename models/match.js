var mongoose = require('mongoose');
var statsEmitter = require('../emitters').statsEmitter;

// Mongoose Bullshit
var matchSchema = new mongoose.Schema({
  _id: Number, //matchid
  hostname: String,
  redname: String,
  redCountry: String,
  bluname: String,
  bluCountry: String,
  isLive: { type: Boolean, default: false }
});

matchSchema.pre('save', function(next) {

  // Push the new match to subscribed clients on websockets.
  statsEmitter.emit('updateMatch', this);

  next();

});

matchSchema.methods.updateWithPlayerData = function(stats, cb) {
  var match = this;
  stats.getPlayerData(function(err, playerData) {
    if (err) { cb(err); }
    if (!playerData) { return; }
    console.log(playerData);
    var redCountries = [];
    var bluCountries = [];
    // Fill out the team info for all the players
    for (var i=0,player; player=stats.players[i]; i++) {
      var steamid = player.steamid;
      if (playerData[steamid]) {
        playerData[steamid].team = player.team;
      }
    }
    // Push the country info into the arrays
    for (var steamid in playerData) {
      if (playerData[steamid].country) {
        if (playerData[steamid].team === 2) { redCountries.push(playerData[steamid].country); }
        else if (playerData[steamid].team === 3) { bluCountries.push(playerData[steamid].country); }
      }
    }
    // Find the most-occuring country for each team
    var mode = function(array) {
      if (array.length === 0)
        return null;
      var modeMap = {};
      var maxEl = array[0], maxCount = 1;
      for (var i = 0; i < array.length; i++)
      {
        var el = array[i];
        if (modeMap[el] === null) {
          modeMap[el] = 1;
        }
        else {
          modeMap[el]++;
        }
        if (modeMap[el] > maxCount) {
          maxEl = el;
          maxCount = modeMap[el];
        }
      }
      return maxEl;
    };
    match.redCountry = mode(redCountries);
    match.bluCountry = mode(bluCountries);
    stats.update({$set:{redCountry: match.redCountry, bluCountry: match.bluCountry}}, function(err) {
      if (err) {console.log(err);} // do something
    });
    match.save(cb);
  });

};

matchSchema.statics.setGameOver = function(matchId, cb) {
  Match.findById(matchId, function(err, match) {
    if (err) {
      return cb(err);
    }
    if (!match) {
      return cb(new Error('setGameOver() - Match not found'));
    }

    match.isLive = false;
    match.save(cb);

  });
};



var Match = mongoose.model('Match', matchSchema);

module.exports = Match;