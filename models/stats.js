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
    isBind: Boolean,
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
  Player.updateSteamInfo(steamids, function(err) {
    if (err) {console.log(err); console.trace(err); }
    
    // Push the new stats to subscribed clients on websockets.
    stats.getPlayerData(function(err, playerData) {

      // this doesn't belong here
      stats.updateWithPlayerData(playerData, function(err) {
        // do something
      });

      statsEmitter.emit('updateStats', stats, playerData);
    });

    next();

  });

});

statsSchema.statics.createStats = function(matchInfo, statsData) {
  var callback = arguments[arguments.length-1];

  // statsData is the the POST body data (req.body.stats), so massage it
  // Remove spectators from players array
  for (var i=statsData.players.length-1; i>=0; i--) {
    if (statsData.players[i].team < 2) {
      statsData.players.splice(i,1);
    }
  }

  // Set initial values for a new stats document
  statsData.round = 0;
  statsData.redscore = 0;
  statsData.bluscore = 0;
  statsData.roundduration = 0;
  statsData._id = matchInfo.matchId;
  statsData.isLive = true;
  statsData.created = statsData.updated = new Date();
  new Stats(statsData).save(callback);
};

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
      //  add newPlayer to the players array
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

        // This is a ridiculous hack to add the newPlayer to the stats.players
        //  array in such a way that Mongoose does a $set on the entire array
        //  instead of a $push of just the newPlayer. Ridiculous.
        var players = stats.players.toObject();
        players[players.length] = newPlayer;
        stats.players = players;
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

statsSchema.methods.updateWithPlayerData = function(playerData, cb) {
  var stats = this;

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
  // Find the most-occurring country for each team
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
  stats.redCountry = mode(redCountries);
  stats.bluCountry = mode(bluCountries);
  stats.update({$set:{redCountry: stats.redCountry, bluCountry: stats.bluCountry}}, function(err) {
    if (err) {console.log(err);} // do something
  });

};

statsSchema.methods.getPlayerData = function(cb) {
  // Create an array of all players' steamids
  var steamids = [];
  this.players.forEach(function(player) {
    steamids.push(player.steamid);
  });

  // Lookup all steamids in database for the names
  Player.find( { _id: { $in : steamids } }).exec(function(err, players) {
    if (err) { return cb(err); }

    var playerdata = {};
    // console.log(players);
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
      } else {
        chat.isBind = true;
      }
    });
    // Append the new chats
    return oldChats.concat(newChats);
  }
  return oldChats;
};

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;
