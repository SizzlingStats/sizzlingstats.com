var mongoose = require('mongoose');
var cronJob = require('cron').CronJob;
var Stats = require('./stats');
var Match = require('./match');

// This is a session model for tf2 servers

var sessionSchema = new mongoose.Schema({
  _id: String, // sessionid
  ip: String, // Not sure if this is actually a string
  matchId: Number, // Change this to mongoose.Schema.Types.ObjectId?
  timeout: Number // Numeric date of creation + cfg.statsSessionTimeout
});

sessionSchema.methods.expireSessionKey = function(cb) {
  this.remove(function (err) {
    cb(err);
  });
};

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

// Cron job to expire old session keys every 15 minutes
var expireSessionKeyJob = new cronJob('0 */15 * * * *', function() {

  Session.find({ "timeout": { $let: Date.now() } }, function(err, sessions) {
    if (err || !sessions) {
      return;
    }
    sessions.forEach(function(session) {

      Stats.setGameOver(session.matchId, null, function(err) {
        if (err) { console.log(err); }
      });

      Match.setGameOver(session.matchId, null, function(err) {
        if (err) { console.log(err); }
      });

      session.expireSessionKey(function(err) {
        if (err) { console.log(err); }
      });

    });
  });

}, null, true);