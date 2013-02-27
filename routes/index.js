/*
 * /routes/index.js
 */

module.exports = function(app) {
  app.get('/', index);
  app.get('/partials/profile', isLoggedIn);
  app.get('/partials/:name', partials);
  app.get('/partials/:name/:action', partialAction);
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
