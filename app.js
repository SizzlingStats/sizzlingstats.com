
/**
 * Module dependencies.
 */

var express = require('express');
require('colors');
var mongoose = require('mongoose');
// var db = mongoose.createConnection('localhost', 'sizzlingstats');
mongoose.connect('mongodb://localhost/sizzlingstats');

var app = module.exports = express.createServer();

var routes = require('./routes'),
    api = require('./routes/api');

// Configuration

app.configure('development', function(){
  app.use(express.profiler());
  // app.use(express.logger({ format: 'dev' }));
});

app.configure(function(){
  app.use(express.limit('200kb'));
  app.use(express.favicon())
  
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  var assetManager = require('connect-assetmanager')({
    js: {
      route: /\/js\/all-[a-z0-9]+\.js/,
      path: __dirname + '/public/js/',
      dataType: 'javascript',
      debug: process.env.NODE_ENV === 'development',
      // preManipulate: {
      //   '^': [
      //     function(src, path, index, isLast, callback) {
      //       callback(src.replace(/#socketIoPort#/g, env.port));
      //     }
      //     , function(src, path, index, isLast, callback) {
      //       if (/\.coffee$/.test(path)) {
      //         callback(coffee.compile(src));
      //       } else {
      //         callback(src);
      //       }
      //     }
      //   ]
      // },
      files: [ // order matters here
        'lib/jquery/jquery-1.8.2.min.js',
        'lib/angular/angular.js',
        'lib/bootstrap/bootstrap.min.js',
        'app.js',
        'services.js',
        'controllers.js',
        'filters.js',
        'directives.js'
        // '*'
      ]
    },
    css: {
      route: /\/css\/all-[a-z0-9]+\.css/,
      path: __dirname + '/public/css/',
      dataType: 'css',
      debug: process.env.NODE_ENV === 'development',
      // preManipulate: {
      //   '^': [
      //     function(src, path, index, isLast, callback) {
      //       if (/\.styl$/.test(path)) {
      //         stylus(src)
      //           .set('compress', false)
      //           .set('filename', path)
      //           .set('paths', [ __dirname, app.paths.public ])
      //           .render(function(err, css) {
      //             callback(err || css);
      //           });
      //       } else {
      //         callback(src);
      //       }
      //     }
      //   ]
      // },
      files: [ // order matters here
        'bootstrap.css',
        'bootstrap-fix.css',
        'bootstrap-responsive.css',
        'sizzlingstats.css'
      ]
    }
  });
  app.use(assetManager);
  app.helpers({ assetManager: assetManager });
  app.use(express.staticCache());
});

app.configure('development', function(){
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function(){
  app.use(express.static(__dirname + '/public', { maxAge: 5 * 60 * 1000 }));
});

app.configure(function() {
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API

app.get('/api/stats/:id', api.stats);
app.get('/api/matches', api.matches);

app.post('/api/stats', api.addStats);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Hook Socket.io into Express
app.io = require('socket.io').listen(app);
app.io.enable('browser client minification');
app.io.enable('browser client etag');
app.io.enable('browser client gzip');
app.io.set('log level', 1);
app.io.set('transports', [
  'websocket',
  'flashsocket',
  'htmlfile',
  'xhr-polling',
  'jsonp-polling'
]);
var socket = require('./routes/socket')(app);

// Start server

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
