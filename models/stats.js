var mongoose = require('mongoose');
var Player = require('./player');
var statsEmitter = require('../emitters').statsEmitter;

// Mongoose Bullshit
var statsSchema = new mongoose.Schema({
  _id: { type: Number, required: true }, // matchId
  redname: String,
  bluname: String,
  redscore: { type: [Number], required: true },
  bluscore: { type: [Number], required: true },
  redCountry: String,
  bluCountry: String,
  hostname: String,
  // Duration of round, in seconds. Playable time only (humiliation time doesn't count)
  roundduration: { type: [Number], required: true },
  // Duration of match, in seconds. Only exists after gameover event is sent
  matchDuration: Number,
  map: { type: String, lowercase: true, required: true },
  round: { type: Number, min: 0, required: true },
  players: [{
    steamid: { type: String, required: true },
    team: { type: Number, required: true },
    name: String,
    mostplayedclass: [Number],
    playedclasses: [Number],
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
  chats: [{
    steamid: { type: String, required: true },
    isTeam: Boolean,
    time: { type: Number, required: true },
    message: String
  }],
  created: { type: Date },
  updated: { type: Date },
  isLive: { type: Boolean, default: false }
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


statsSchema.statics.appendStats = function(newStats, matchId, isEndOfRound, cb) {
  Stats.findById(matchId, function(err, stats) {
    if (err) return cb(err);
    if (!stats) return cb(new Error('Stats not found'));

    var round = stats.round;

    // if (isEndOfRound) {
      stats.bluscore[round] = newStats.bluscore;
      stats.redscore[round] = newStats.redscore;
    // }

    newStats.players.forEach(function(player) {
      var isNewPlayer = true;

      // look for the oldPlayer with a matching steamid
      // and add new values to the stat arrays
      stats.players.forEach(function(oldPlayer) {
        if (oldPlayer.steamid === player.steamid) {
          isNewPlayer = false;
          
          for (var field in player) {
            if (field === "mostplayedclass" || field === "playedclasses") {
              if (oldPlayer[field]) {
                oldPlayer[field][round] = player[field];
              }
            } else if (field !== "steamid" && field !== "team" && field !== "name") {
              if (oldPlayer[field]) {
                if (oldPlayer[field][round]) {
                  oldPlayer[field][round] += player[field];
                } else {
                  oldPlayer[field][round] = player[field];
                }
              }
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
            // Mongoose doesn't like 'undefined' in number arrays, so push 'null'
            for (var i=0; i<round; i++) {
              newPlayer[field].push(null);
            }
            newPlayer[field][round] = player[field];
          }
        }

        stats.players.push(newPlayer);
      }

    });

    // Need to set markModified if you don't use
    //  Array.push() to set array elements
    stats.markModified('players');

    stats.roundduration[round] = newStats.roundduration;
    stats.markModified('roundduration');
    stats.markModified('redscore');
    stats.markModified('bluscore');

    stats.chats = appendChats(newStats.chats, stats.chats);
    if (isEndOfRound) { stats.round += 1; }

    stats.updated = new Date();
    
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

statsSchema.statics.setGameOver = function(matchId, matchDuration, newChats, cb) {
  Stats.findById(matchId, function(err, stats) {
    if (err) {
      return cb(err);
    }
    if (!stats) {
      return cb(new Error('setGameOver() - Stats not found'));
    }

    if (matchDuration) { stats.matchDuration = matchDuration; }
    stats.isLive = false;
    stats.chats = appendChats(newChats, stats.chats);
    stats.save(cb);

  });
};

// Helpers
var appendChats = function(newChats, oldChats) {
  // Strip the beginning/end quotations from new chat messages
  if (Array.isArray(newChats)) {
    newChats.forEach(function(chat) {
      if (chat.message && chat.message[0] === '"' && chat.message[chat.message.length-1] === '"') {
        chat.message = chat.message.slice(1,-1);
      }
    });
    // Append the new chats
    return oldChats.concat(newChats);
  }
  return oldChats;
};

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;