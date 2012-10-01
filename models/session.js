var mongoose = require('mongoose');

// This is a session model for tf2 servers

var sessionSchema = new mongoose.Schema({
  sessionid: String,
  ip: String, // Not sure if this is actually a string
  matchid: Number, // Change this to mongoose.Schema.Types.ObjectId?
  timeout: Number
});

var Session = mongoose.model('Session', sessionSchema);

module.exports = Session;