var mongoose = require('mongoose');
var Player = require('./player');
var statsEmitter = require('../emitters').statsEmitter;

// Mongoose Bullshit
var statsSchema = new mongoose.Schema({
 _id: { type: Number, required: true } // matchId
, redname: String
, bluname: String
, redscore: { type: [Number], required: true }
, bluscore: { type: [Number], required: true }
, redCountry: String
, bluCountry: String
, hostname: String
  // Duration of round, in seconds. Playable time only (humiliation time doesn't count)
, roundduration: { type: [Number], required: true }
  // Duration of match, in seconds. Only exists after gameover event is sent
, matchDuration: Number
, map: { type: String, lowercase: true, required: true }
, round: { type: Number, required: true }
, players: [{
    steamid: { type: String, required: true }
  , name: String
  , team: { type: Number, required: true }
  , mostplayedclass: [Number]
  , playedclasses: [Number]
  , kills: [Number]
  , killassists: [Number]
  , deaths: [Number]
  , captures: [Number]
  , defenses: [Number]
  , suicides: [Number]
  , dominations: [Number]
  , revenge: [Number]
  , buildingsbuilt: [Number]
  , buildingsdestroyed: [Number]
  , headshots: [Number]
  , backstabs: [Number]
  , healpoints: [Number]
  , invulns: [Number]
  , teleports: [Number]
  , damagedone: [Number]
  , crits: [Number]
  , resupplypoints: [Number]
  , bonuspoints: [Number]
  , points: [Number]
  , healsreceived: [Number]
  , ubersdropped: [Number]
  , medpicks: [Number]
  }]
, chats: [{
    steamid: { type: String, required: true }
  , isTeam: Boolean
  , isBind: Boolean
  , time: { type: Number, required: true }
  , message: String
  }]
, created: { type: Date }
, updated: { type: Date }
, viewCount: Number
, isLive: { type: Boolean, default: false }
});

statsSchema.pre('save', function(next) {
  var stats = this;
  // Create an array of all players' steamids
  var steamids = [];
  for (var i=0, len=stats.players.length; i<len; i++) {
    steamids.push(stats.players[i].steamid);
  }

  // Notify Players collection that new stats have come in
  Player.getSteamApiInfo(steamids, function(err, playerData) {
    if (err) {
      console.log(err);
      console.trace(err);
      next();
    } else {
      stats.setCountryFlags(playerData);
      // Push the new stats to subscribed clients on websockets.
      statsEmitter.emit('updateStats', stats, playerData);
      next();
    }
  });

});

statsSchema.post('remove', function(stats) {
  statsEmitter.emit('removeStats', stats._id);
});

statsSchema.statics.createStats = function(matchInfo, statsData) {
  var callback = arguments[arguments.length-1];

  // statsData is the the POST body data (req.body.stats), so massage it
  for (var i=statsData.players.length-1; i>=0; i--) {
    // Remove spectators from players array
    if (statsData.players[i].team < 2) {
      statsData.players.splice(i,1);
    } else {
      // Remap playerclass data
      statsData.players[i].mostplayedclass = remapMostPlayedClass(statsData.players[i].mostplayedclass);
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
  statsData.viewCount = 0;
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

      // Remap playerclass data
      player.mostplayedclass = remapMostPlayedClass(player.mostplayedclass);
      player.playedclasses = remapPlayedClasses(player.playedclasses);

      // look for the oldPlayer with a matching steamid
      // and add new values to the stat arrays
      stats.players.forEach(function(oldPlayer) {
        oldPlayer.poopy = 'poopy';
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

statsSchema.methods.setCountryFlags = function(playerData, cb) {
  var redCountries = [];
  var bluCountries = [];
  // Fill out the team info for all the players
  for (var i=0,player; player=this.players[i]; i++) {
    if (playerData[player.steamid]) {
      playerData[player.steamid].team = player.team;
    }
  }
  // Push the country info into the arrays
  for (var steamid in playerData) {
    if (playerData[steamid].country) {
      if (playerData[steamid].team === 2) {
        redCountries.push(playerData[steamid].country);
      }
      else if (playerData[steamid].team === 3) {
        bluCountries.push(playerData[steamid].country);
      }
    }
  }
  // Find the most-occurring country for each team
  this.redCountry = mode(redCountries);
  this.bluCountry = mode(bluCountries);
};

statsSchema.methods.getPlayerData = function(cb) {
  // Create an array of all players' steamids
  var steamids = [];
  for (var i=0, len=this.players.length; i<len; i++) {
    steamids.push(this.players[i].steamid);
  }

  // Lookup all steamids in database for the names
  Player.find( { _id: { $in : steamids } }).exec(function(err, players) {
    if (err) { return cb(err); }

    var playerdata = {};

    for (var i=0, len=players.length; i<len; i++) {
      var player = players[i];
      playerdata[player._id] = {
        avatar: player.avatar,
        numericid: player.numericid,
        country: player.country
      };
    }

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
    // If there is only 1 value in roundduration[] and it's 0, then these are
    //  "empty" stats and they should get deleted.
    if (stats.roundduration.length === 1 && stats.roundduration[0] === 0) {
      return stats.remove(cb);
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

var remapMostPlayedClass = function(mostPlayedClass) {
  if (typeof mostPlayedClass !== 'number') { return 0; }
  // The game doesn't report the classes by their nominal 1-9.
  // So we must remap them.
  return [0,1,8,2,4,7,5,3,9,6][mostPlayedClass];
};

// This function takes an integer that, in binary, represents
//  a bitfield of tf2classes
var remapPlayedClasses = function(playedClasses) {
  if (typeof playedClasses !== 'number') { return 0; }
  // Note that the game doesn't report the classes by their nominal 1-9.
  // So we must remap them.

  // PLAYED_SCOUT    = 1<<0; //   1          1  should be:          1
  // PLAYED_SNIPER   = 1<<1; //   2         10  should be:   10000000
  // PLAYED_SOLDIER  = 1<<2; //   4        100  should be:         10
  // PLAYED_DEMOMAN  = 1<<3; //   8       1000  should be:       1000
  // PLAYED_MEDIC    = 1<<4; //  16      10000  should be:    1000000
  // PLAYED_HEAVY    = 1<<5; //  32     100000  should be:      10000
  // PLAYED_PYRO     = 1<<6; //  64    1000000  should be:        100
  // PLAYED_SPY      = 1<<7; // 128   10000000  should be:  100000000
  // PLAYED_ENGINEER = 1<<8; // 256  100000000  should be:     100000

  var map = 0;

  if (playedClasses & 1)   { map |= 1; }
  if (playedClasses & 4)   { map |= 2; }
  if (playedClasses & 64)  { map |= 4; }
  if (playedClasses & 8)   { map |= 8; }
  if (playedClasses & 32)  { map |= 16; }
  if (playedClasses & 256) { map |= 32; }
  if (playedClasses & 16)  { map |= 64; }
  if (playedClasses & 2)   { map |= 128; }
  if (playedClasses & 128) { map |= 256; }

  return map;
};

var mode = function(array) {
  if (!array.length) {
    return null;
  }
  var modeMap = {};
  var maxEl = array[0], maxCount = 1;
  for (var i = 0, len=array.length; i < len; i++)
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

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;
