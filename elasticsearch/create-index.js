var request = require('request');

var options = {
  uri: 'http://localhost:9200/sizzlingstats/'
, method: 'PUT'
, timeout: 7000
, json: {
    analysis: {
      analyzer: {
        full_name: {
          type: 'custom'
        , tokenizer: 'whitespace'
        , filter: ['lowercase', 'stop', 'asciifolding']
        }
      , partial_name: {
          type: 'custom'
        , tokenizer: 'whitespace'
        , filter: ['lowercase', 'stop', 'asciifolding', 'name_ngrams']
        }
      }
    , filter: {
        name_ngrams: {
          type: 'nGram'
        , min_gram: 2
        , max_gram: 20
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
