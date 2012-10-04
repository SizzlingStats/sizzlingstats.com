var mongoose = require('mongoose');
var Player = require('../models/player');
var statsEmitter = require('../emitters').statsEmitter;

// Mongoose Bullshit
var statsSchema = new mongoose.Schema({
  _id: { type: Number, required: true }, // matchid
  bluname: String,
  redname: String,
  bluscore: { type: [Number], required: true },
  redscore: { type: [Number], required: true },
  hostname: String,
  map: { type: String, required: true },
  round: { type: Number, min: 0, required: true },
  players: [{
    steamid: { type: String, required: true },
    team: { type: Number, required: true },
    name: String,
    kills: [Number],
    killassists: [Number],
    deaths: [Number],
    captures: [Number],
    defenses: [Number],
    suicides: [Number],
    dominations: [Number],
    revenge: [Number],
    buildingsbuilt: [Number],
    buildingsdestroyed: [Number],
    headshots: [Number],
    backstabs: [Number],
    healpoints: [Number],
    invulns: [Number],
    teleports: [Number],
    damagedone: [Number],
    crits: [Number],
    resupplypoints: [Number],
    bonuspoints: [Number],
    points: [Number],
    healsreceived: [Number],
    ubersdropped: [Number],
    medpicks: [Number]
  }],
  created: { type: Date }
});


statsSchema.pre('save', function(next) {
  var stats = this;

  // Notify Players collection that new stats have come in
  steamids = [];
  stats.players.forEach(function(player) {
    steamids.push(player.steamid);
  });
  Player.updateSteamInfo(steamids);

  // Push the new stats to subscribed clients on websockets.
  stats.getPlayerData(function(err, playerdata) {
    statsEmitter.emit('newStats', { stats: stats, playerdata: playerdata }, stats._id);
  });

  next();

});


statsSchema.statics.appendStats = function(newStats, matchid, cb) {
  Stats.findById(matchid, function(err, stats) {
    if (err) return cb(err);
    if (!stats) return cb(new Error('Stats not found'));

    var round = stats.round += 1;
    stats.bluscore.push(newStats.bluscore);
    stats.redscore.push(newStats.redscore);

    newStats.players.forEach(function(player) {
      var isNewPlayer = true;

      // look for the oldPlayer with a matching steamid
      // and add new values to the stat arrays
      stats.players.forEach(function(oldPlayer) {
        if (oldPlayer.steamid === player.steamid) {
          isNewPlayer = false;
          
          for (var field in player) {
            if (field !== "steamid" && field !== "team" && field !== "name") {
              if (oldPlayer[field]) oldPlayer[field][round] = player[field];
            }
          }

          return;
        }
      });

      // If a matching oldPlayer can't be found, then
      // push newPlayer into the existing document
      if (isNewPlayer) {
        
        var newPlayer = {
          steamid: player.steamid,
          team: player.team,
          name: player.name
        };

        for (var field in player) {
          if (field !== "steamid" && field !== "team" && field !== "name") {
            newPlayer[field] = [];
            newPlayer[field][round] = player[field];
          }
        }

        stats.players.push(newPlayer);
      }

    });

    // Update Stats document
    // Stats.update({_id:stats._id},
    //              {$set: {
    //                 bluscore: stats.bluscore,
    //                 redscore: stats.redscore,
    //                 round: round,
    //                 players: stats.players}
    //              },
    //              cb);

    
    // Need to set markModified if you don't use
    //  Array.push() to set array elements
    stats.markModified('players');
    // Use Save instead of Update in order to run the
    //  pre 'save' middleware.
    stats.save(cb);

  }); // end Stats.findById()
};

statsSchema.methods.getPlayerData = function(cb) {
  var steamids = [];
  this.players.forEach(function(player) {
    steamids.push(player.steamid);
  });

  Player.find( { _id: { $in : steamids } }).exec(function(err, players) {
    if (err) {
      return cb(err, {});
    }

    var playerdata = {};
    players.forEach(function(player) {
      playerdata[player._id] = {
        avatar: player.avatar,
        numericid: player.numericid,
        country: player.country
      };
    });

    return cb(null, playerdata);
  });
};

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;