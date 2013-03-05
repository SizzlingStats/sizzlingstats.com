var request = require('request');

var options = {
  uri: 'http://localhost:9200/sizzlingstats/player/_mapping'
, method: 'PUT'
, timeout: 7000
, json: {
    player: {
      properties: {
        previousNames: {
          properties: {
            _id: {
              type: 'string'
            , search_analyzer: 'full_name'
            , index_analyzer: 'partial_name'
            }
          , frequency: {
              type: 'integer'
            , index: 'not_analyzed'
            }
          }
        }
      }
    }
  }
};

request(options, function(err, res, body) {
  if (err) {
    return console.log(err);
  }
  console.log(body);
});
