var request = require('request');

var options = {
  uri: 'http://localhost:9200/sizzlingstats/player/_search'
, method: 'GET'
, qs: {pretty: 'true'}
, timeout: 7000
, json: {
    query: {
      match: {
        'previousNames._id': {
          query: 'b4'
        }
      }
    }
  }
};

request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  if (body.hits.hits.length) {
    for (var i=0; i<body.hits.hits.length; i++) {
      console.log(body.hits.hits[i]._source.previousNames);
    }
    return;
  }
  console.log(body.hits);
});
