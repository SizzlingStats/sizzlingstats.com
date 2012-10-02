var mongoose = require('mongoose');
var cronJob = require('cron').CronJob;

// This is a session model for tf2 servers

var sessionSchema = new mongoose.Schema({
  _id: String, // sessionid
  ip: String, // Not sure if this is actually a string
  matchid: Number, // Change this to mongoose.Schema.Types.ObjectId?
  timeout: Number // Numeric date of creation + cfg.statsSessionTimeout
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

// Cron job to expire old session keys every 15 minutes
var expireSessionKeyJob = new cronJob('0 */15 * * * *', function(){
  Session.remove({ "timeout" : { $lt: Date.now() } }, function(err) {
    if (err) console.log(err);
  });
}, null, true);