var mongoose = require('mongoose');

// Mongoose Bullshit
var statsSchema = new mongoose.Schema({
  _id: Number, // matchid
  bluname: String,
  redname: String,
  bluscore: [Number],
  redscore: [Number],
  hostname: String,
  map: String,
  round: Number,
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