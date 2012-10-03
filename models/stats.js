var mongoose = require('mongoose');
var Player = require('../models/player');

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
  next();

  // Notify Players collection that new stats have come in
  steamids = [];
  this.players.forEach(function(player) {
    if (player.steamid !== 'BOT')
      steamids.push(player.steamid);
  });

  Player.updateSteamInfo(steamids);

});


statsSchema.methods.appendStats = function(newStats, cb) {
  var round = this.round + 1;
  var stats = this;

  stats.bluscore[round] = newStats.bluscore;
  stats.redscore[round] = newStats.redscore;
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
  Stats.update({_id:this._id},
               {$set: {
                  bluscore: stats.bluscore,
                  redscore: stats.redscore,
                  round: round,
                  players: stats.players}
               },
               cb);
};

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;