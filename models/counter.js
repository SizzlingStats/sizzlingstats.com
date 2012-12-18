var mongoose = require('mongoose');

// This is a model for an id counter (increments matchid)

var counterSchema = new mongoose.Schema({
  counter: String, //"matches"
  next: Number
});

var Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;

// If no match counter is in the DB, create one
Counter.findOne({ counter: 'matches' }, function(err, matchCounter) {
  if (err) throw err;
  if (!matchCounter) {
    console.log('No match counter found, inserting new one');
    new Counter({ "counter" : "matches", "next" : 0 }).save(function(e) {
      if (e) throw e;
    });
  }
});
