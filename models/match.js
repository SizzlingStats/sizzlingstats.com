var mongoose = require('mongoose');

// Mongoose Bullshit
var matchSchema = new mongoose.Schema({
  _id: Number, //matchid
  bluname: String,
  redname: String,
  hostname: String,
  isLive: { type: Boolean, default: false }
});


matchSchema.statics.setGameOver = function(matchId, cb) {
  Match.findById(matchId, function(err, match) {
    if (err) {
      return cb(err);
    }
    if (!match) {
      return cb(new Error('setGameOver() - Match not found'));
    }

    match.isLive = false;
    match.save(cb);

  });
};



var Match = mongoose.model('Match', matchSchema);

module.exports = Match;