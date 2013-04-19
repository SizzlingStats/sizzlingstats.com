var mongoose = require('mongoose');
var geoip = require('geoip');
var cronJob = require('cron').CronJob;

var City = geoip.City;
var city = new City(__dirname + '/../lib/GeoLiteCity.dat');

// This is a model for visitors' ip addresses, for tracking usage stats

var geoipSchema = new mongoose.Schema({
  _id: String // ip address
, latitude: Number
, longitude: Number
});

var analyticsSchema = new mongoose.Schema({
  _id: String // "users" or "tf2servers"
, geoips: [geoipSchema]
});


analyticsSchema.statics.trackIp = function (ip, type) {
  Analytics.findById(type, function (err, analytics) {
    var geoip = analytics.geoips.id(ip);
    if (geoip) {
      // We already have this ip address, so return.
      return;
    }

    city.lookup(ip, function(err, data) {
      if (err) { return; }

      analytics.geoips.push({ _id: ip, latitude: data.latitude, longitude: data.longitude });
      analytics.save(function (err) {
        if (err) { console.log(err); }
      });
    });

  });
};


var Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;


// Startup:
// If collections don't exist in db, create them
Analytics.findById('users', function (err, users) {
  if (err) throw err;
  if (!users) {
    new Analytics({ "_id" : "users" }).save(function (e) {
      if (e) throw e;
    });
  }
});
Analytics.findById('tf2servers', function (err, tf2servers) {
  if (err) throw err;
  if (!tf2servers) {
    new Analytics({ "_id" : "tf2servers" }).save(function (e) {
      if (e) throw e;
    });
  }
});
