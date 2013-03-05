var request = require('request');

var options = {
  uri: 'http://localhost:9200/_river/sizzlingstats/_meta'
, method: 'PUT'
, timeout: 7000
, json: {
    type: 'mongodb'
  , mongodb: {
      db: 'sizzlingstats'
    , collection: 'players'
    , gridfs: false
    // , script: ''
    // , filter: 'something'
    // , servers: [
    //     { host: 'localhost', 'port': 27017 }
    //   ]
    // , options: { 'secondary_read_preference': true }
    // , credentials: [
    //     { db: 'local', user: ${mongo.local.user}, password: ${mongo.local.password} }
    //   , { db: ${mongo.db.name}, user: ${mongo.db.user}, password: ${mongo.db.password} }
    //   ]
    }
  , index: {
      name: 'sizzlingstats'
    , type: 'player'
    // , throttle_size: 500
    }
  }
};

request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log(body);
});
