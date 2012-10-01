var mongoose = require('mongoose');

// Mongoose Bullshit
var statsSchema = new mongoose.Schema({
  bluname: String,
  redname: String,
  bluscore: [Number],
  redscore: [Number],
  hostname: String,
  map: String,
  round: Number,
  sessionid: String,
  matchid: Number, // Change this to mongoose.Schema.Types.ObjectId?
  players: [{
    steamid: String,
    team: Number,
    name: String,
    kills: [Number],
    deaths: [Number],
    damage: [Number],
    heals: [Number],
    medkills: [Number],
    assists: [Number]
  }]
});

var Stats = mongoose.model('Stats', statsSchema);

module.exports = Stats;