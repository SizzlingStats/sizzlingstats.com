var mongoose = require('mongoose');

// Mongoose Bullshit
var matchSchema = new mongoose.Schema({
  bluname: String,
  redname: String,
  hostname: String,
  matchid: Number // Change this to mongoose.Schema.Types.ObjectId?
});

var Match = mongoose.model('Match', matchSchema);

module.exports = Match;