var mongoose = require('mongoose');

// Mongoose Bullshit
var matchSchema = new mongoose.Schema({
  _id: Number, //matchid
  bluname: String,
  redname: String,
  hostname: String
});

var Match = mongoose.model('Match', matchSchema);

module.exports = Match;