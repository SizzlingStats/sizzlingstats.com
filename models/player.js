var mongoose = require('mongoose');
var async = require('async');
var request = require('request');
var secrets = require('../cfg/secrets');
var steamapi = process.env.STEAM_API || secrets.steamapi;

var playerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // steamid
  numericid: { type: String, required: true, index: { unique: true } }, // numeric 64-bit steamid
  name: String,
  avatar: { type: String, default: '/img/steam-default-32.jpg' },
  updated: { type: Date, default: Date.now },
  country: { type: String } // Some players don't have this
});

playerSchema.pre('validate', function(next) {
  // console.log(this);
  next();
});

var steamIdToNumericId = function(steamid) {
  var parts = steamid.split(":");
  var iServer = Number(parts[1]);
  var iAuthID = Number(parts[2]);
  
  var converted = "76561197960265728";

  lastIndex = converted.length - 1;

  var toAdd = iAuthID * 2 + iServer;
  var toAddString = String(toAdd);
  var addLastIndex = toAddString.length - 1;

  for(var i=0;i<=addLastIndex;i++)
  {
    var num = Number(toAddString.charAt(addLastIndex - i));
    var j=lastIndex - i;
    do {
      var num2 = Number(converted.charAt(j));
      var sum = num + num2;
              
      converted = converted.substr(0,j) + (sum % 10).toString() + converted.substr(j+1);
  
      num = Math.floor(sum / 10);
      j--;
    }
    while(num);
  }
  return converted;
};

playerSchema.statics.numericIdToSteamId = function(profile) {
  var base = "7960265728";
  var profile = profile.substr(7);
  
  var subtract = 0;
  var lastIndex = base.length - 1;
  
  for(var i=0;i<base.length;i++) {
    var value = profile.charAt(lastIndex - i) - base.charAt(lastIndex - i);
    
    if(value < 0) {
      var index = lastIndex - i - 1;
      
      base = base.substr(0,index) + (Number(base.charAt(index)) + 1) + base.substr(index+1);
      
      if(index) {
        value += 10;
      } else {
        break;
      }
    }
    
    subtract += value * Math.pow(10,i);
  }
  
  return "STEAM_0:" + (subtract%2) + ":" + Math.floor(subtract/2);
};

// // This takes in an already validated numericId
playerSchema.statics.getSteamApiInfoForOnePlayer = function(numericId, callback) {

  var options = {
    uri: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
    qs: { key: steamapi, steamids: numericId },
    json: true,
    timeout: 7000
  };

  request(options, function(err, res, body) {
    if (err) {
      console.log('Steam API Request Error', err);
      return callback(err);
    }
    if (res.statusCode !== 200) {
      return callback(new Error('Steam API Status Code: ' + res.statusCode));
    }
    if (body.response.players.length === 0) {
      console.log('Steam Api Player Not Found: ' + numericId);
      return callback(new Error('Steam API Player Not Found: ' + numericId));
    }
    return callback(null, body.response.players[0]);
  }); // End request
};

playerSchema.statics.getSteamApiInfo = function(steamids, callback) {
  // Lookup the players in database, which were last updated less than one hour
  //  ago. For the players that aren't found in database, poll the steam API.
  var steamIdRegex = /STEAM_0\:(0|1)\:\d{1,15}$/;

  var playerData = {};

  var currentDate = new Date();
  var oneHourAgo = new Date(currentDate.getTime() - 60*60*1000);

  Player.find( { _id: { $in : steamids }, updated: { $gt : oneHourAgo } } ).exec(function(err, players) {
    if (err) { return callback(err); }

    var slen = steamids.length;
    var plen = players.length;

    for (var i=0; i<plen; i++) {
      var player=players[i];
      playerData[player._id] = {
        avatar: player.avatar,
        numericid: player.numericid,
        country: player.country
      };
    }

    if (plen === slen) {
      return callback(null, playerData);
    }

    // For the players who we didn't get cached data for,
    //  convert their steamids to 64-bit and then hit the Steam API.
    var playersNotFound = [];
    for (var j=0; j<slen; j++) {
      var steamid = steamids[j];

      if ( !playerData[steamid] && steamIdRegex.test(steamid) ) {
        playersNotFound.push(steamIdToNumericId(steamid));
      }
    }

    // If there aren't any players left to get fresh Steam API info for,
    //  then return.
    if (playersNotFound.length === 0) {
      return callback(null, playerData);
    }

    var options = {
      uri: 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/',
      qs: { key: steamapi, steamids: playersNotFound.join() },
      json: true,
      timeout: 7000
    };

    request(options, function(err, res, body) {
      // LOTS OF ERROR CHECKING
      if (err) {
        return callback(err);
      }
      if (res.statusCode !== 200) {
        return callback(new Error('player.js updateSteamInfo - Steam API Error: ' + res.statusCode));
      }
      if (!body.response || !body.response.players) {
        return callback(new Error('player.js updateSteamInfo - Steam API Error: body undefined'));
      }
      if (body.response.players.length === 0) {
        return callback(new Error('Steam API Players Not Found: ' + steamids));
      }
      

      // Update all the players in DB, using new Steam API info.
      async.forEach(body.response.players, function(player, aCallback) {
        var steamid = Player.numericIdToSteamId(player.steamid);
        var newPlayer = {
          numericid: player.steamid,
          name: player.personaname,
          avatar: player.avatar,
          updated: currentDate
        };

        playerData[steamid] = {
          avatar: player.avatar,
          numericid: player.numericid
        };

        if (player.loccountrycode) {
          newPlayer.country = player.loccountrycode;
          playerData[steamid] = player.loccountrycode;
        }

        Player.update({ _id: steamid }, newPlayer, { upsert: true }, function(err) {
          if (err) { aCallback(err); }
          else { aCallback(); }
        });
      },
      // Callback for when all the players are iterated over
      function(err) {
        if (err) { return callback(err); }
        // Return a hash of the player data
        return callback(null, playerData);
      });

    }); // End request

  }); // End Player.find

};


var Player = mongoose.model('Player', playerSchema);

module.exports = Player;
