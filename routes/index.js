/*
 * /routes/index.js
 */

var path = require('path')
  , analytics = require('no-js-analytics')
  , Download = require('../models/download');

module.exports = function(app) {
  app.get('/', index);
  app.get('/partials/profile', isLoggedIn);
  app.get('/partials/:name', partials);
  app.get('/partials/:name/:action', partialAction);

  app.get('/download/:filename', download);

  app.get('/analytics', function(req, res){
    res.send(200, analytics.stats());
  });

  require('./ss-api')(app);
  require('./api')(app);

  // redirect all others to the index (HTML5 history)
  app.get('*', index);
};

// Helpers

var isLoggedIn = function(req, res, next) {
  if (req.loggedIn && req.user) {
    return next();
  }
  res.send(401);
};

var index = function(req, res) {
  res.render('index', {
    query: req.query
  , loggedIn: req.loggedIn
  , user: req.user || {}
  });
};

var partials = function (req, res) {
  res.render('partials/' + req.params.name);
};

var partialAction = function (req, res) {
  res.render('partials/' + req.params.name + '/' + req.params.action);
};

var download = function(req, res) {
  var parent = path.normalize(__dirname + '/../');
  var file = parent + 'downloads/' + req.params.filename;

  res.download(file, function(err) {
    if (err) {
      return res.send(404);
    }
    Download.findByIdAndUpdate(req.params.filename
                             , { $inc: {downloadCount:1} }
                             , {upsert: true}
                             , function(err) {
      if (err) {
        console.log(err);
        console.trace(err);
      }
    });
  });
};
