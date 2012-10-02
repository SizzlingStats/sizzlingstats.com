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
    // avatar: String,
    team: { type: Number, required: true },
    name: String,
    kills: [Number],
    deaths: [Number],
    damage: [Number],
    heals: [Number],
    medkills: [Number],
    assists: [Number]
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
        
        oldPlayer.kills[round] = player.kills;
        oldPlayer.assists[round] = player.assists;
        oldPlayer.deaths[round] = player.deaths;
        oldPlayer.damage[round] = player.damage;
        oldPlayer.heals[round] = player.heals;
        oldPlayer.medkills[round] = player.medkills;

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