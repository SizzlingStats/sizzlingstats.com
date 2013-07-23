var mongoose = require('mongoose')
  , cronJob = require('cron').CronJob
  , Stats = require('../models/stats')
  , Player = require('../models/player')
  , Analytics = require('../models/analytics');

// This is what the public actually sees
var analyticsCachedSchema = new mongoose.Schema({
  _id: String // "cache"
, playerCount: Number
, matchCount: Number
, users: Array
, tf2servers: Array
, updated: Date
});

var AnalyticsCached = mongoose.model('analyticsCached', analyticsCachedSchema);

module.exports = AnalyticsCached;


// // Cron job to cache analytics data once a day at 10am
// var cacheAnalyticsJob = new cronJob('0 0 10 * * *', function() {
//   // FIXME: You shouldn't chain them like this
//   Player.count({}, function (err, playerCount) {
//     Stats.count({}, function (err, matchCount) {
//       Analytics.find({}, function (err, analytics) {
//         // Do stuff
//         var users, tf2servers;
//         if (analytics[0]._id === 'users') {
//           users = analytics[0];
//           tf2servers = analytics[1];
//         } else {
//           users = analytics[1];
//           tf2servers = analytics[0];
//         }
//         users = users.toObject().geoips;
//         tf2servers = tf2servers.toObject().geoips;

//         // Remove ip addresses
//         for (var i=0, ilen=users.length; i<ilen; ++i) {
//           delete users[i]._id;
//         }
//         for (var j=0, jlen=tf2servers.length; j<jlen; ++j) {
//           delete tf2servers[j]._id;
//         }

//         // Create/Update cached analytics document
//         var cache = {
//           playerCount: playerCount
//         , matchCount: matchCount
//         , users: users
//         , tf2servers: tf2servers
//         , updated: new Date()
//         };

//         AnalyticsCached.update('cache', cache, {upsert: true}, function (err, analytics) {
//           if (err) {
//             console.log(err);
//           }
//         });

//       });
//     });
//   });

// }, null, true);
