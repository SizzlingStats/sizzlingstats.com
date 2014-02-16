var mongoose = require('mongoose');
var cfg = require('../config/cfg');
var cronJob = require('cron').CronJob;
var Stats = require('./stats');

// This is a session model for tf2 servers

var sessionSchema = new mongoose.Schema({
  _id: String, // sessionid
  ip: String, // Not sure if this is actually a string
  matchId: Number, // Change this to mongoose.Schema.Types.ObjectId?
  timeout: Number // Numeric date of last update + cfg.statsSessionTimeout
});

sessionSchema.methods.expireSessionKey = function(cb) {
  this.remove(function (err) {
    cb(err);
  });
};

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

// Cron job to expire old session keys every n minutes
var expireSessionKeyJob = new cronJob('0 */' + cfg.session_expiry_interval + ' * * * *', function() {

  Session.find({ "timeout": { $lte: Date.now() } }, function(err, sessions) {
    if (err) {
      return console.log(err);
    }
    if (!sessions) {
      return console.log('No sessions found???');
    }
    sessions.forEach(function(session) {

      Stats.setGameOver(session.matchId, null, null, function(err) {
        if (err) { console.log(err); }
      });

      session.expireSessionKey(function(err) {
        if (err) { console.log(err); }
      });

    });
  });

}, null, true);
