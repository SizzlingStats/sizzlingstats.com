
/**
 * Module dependencies.
 */

var express = require('express')
  , mongoose = require('mongoose')
  , everyauth = require('everyauth')
  , request = require('request')
  , cfg = require('./cfg/cfg')
  , secrets = require('./cfg/secrets')
  , Player = require('./models/player');
require('colors');
// var db = mongoose.createConnection('localhost', 'sizzlingstats');
mongoose.connect(cfg.mongo_url);

var app = module.exports = express.createServer();



/**
 * Everyauth Configuration
 */

// Wait 8 seconds per step before timing out (default 10)
everyauth.everymodule.moduleTimeout(8000);
everyauth.everymodule.findUserById( function (req, userId, callback) {
  Player.findById(userId, callback);
  // callback has the signature, function (err, user) {...}
});
everyauth.everymodule.handleLogout( function (req, res) {
  delete req.session.auth; // This is what req.logout() does
  this.redirect(res, this.logoutRedirectPath());
});
everyauth.steam
  .myHostname( cfg.hostname )
  .findOrCreateUser( function (session, openIdUserAttributes) {
    var promise = this.Promise();
    var steamId, numericId;
    try {
      numericId = openIdUserAttributes.claimedIdentifier.split('/').slice(-1)[0];
      if (!numericId) throw new Error('No steamid64???');
    } catch (e) {
      promise.fail(e);
      return promise;
    }
    steamId = Player.numericIdToSteamId(numericId);
    Player.findById(steamId, function(err, player) {
      if (err) {
        console.log('Error looking up player '+steamId, err);
        console.trace(err);
        return promise.fail(err);
      }
      if (player) {
        // Update the player's info on login
        // Instead of just retrieving old info

        Player.getSteamApiInfo([numericId], function(err, steamInfo) {
          if (err) return promise.fail(err);

          player.name = steamInfo[0].personaname;
          player.avatar = steamInfo[0].avatar;
          player.updated = new Date();
          if (steamInfo[0].loccountrycode) {
            player.country = steamInfo[0].loccountrycode;
          }

          player.save(function(err) {
            if (err) {
              console.log('Error saving player', err);
              console.trace(err);
              return promise.fail(err);
            }
            promise.fulfill(player);
          });
        });
      } else {
        Player.getSteamApiInfo([numericId], function(err, steamInfo) {
          if (err) return promise.fail(err);

          var newPlayer = new Player({
            _id: steamId
          , numericid: numericId
          , name: steamInfo[0].personaname
          , avatar: steamInfo[0].avatar
          , updated: new Date()
          });
          if (steamInfo[0].loccountrycode) {
            newPlayer.country = steamInfo[0].loccountrycode;
          }

          newPlayer.save(function(err) {
            if (err) {
              console.log('Error saving new player', err);
              console.trace(err);
              return promise.fail(err);
            }
            promise.fulfill(newPlayer);
          });
        });
      }
      // session.save();
    });
    return promise;
  })
  .moduleErrback( function (err) {
    console.log( 'EVERYAUTH ERROR:', err);
    console.trace(err);
  })
  .redirectPath('/');
everyauth.debug = false;


/**
 * Express Configuration
 */

app.configure('development', function() {
  // app.use(express.profiler());
  // app.use(express.logger({ format: 'dev' }));
});

app.configure(function() {
  app.use(express.limit('200kb'));
  app.use(express.favicon(__dirname + '/public/img/favicon.png'
                        , { maxAge: 48 * 60 * 60 * 1000 } ));

  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  // Trust proxy -- so req.ip gets mapped to X-Forwarded-For
  // OOPS! This doesn't exist in express 2.x. TODO: Upgrade to express 3
  // app.enable('trust proxy');


  // Sessions

  // app.store = new express.session.MemoryStore;
  var RedisStore = require('connect-redis')(express);
  app.store = new RedisStore({
    prefix: cfg.session_prefix
  , host: cfg.redis_host
  , port: cfg.redis_port
  , db: cfg.redis_db
  , pass: cfg.redis_password
  });

  app.use(express.cookieParser());
  app.use(express.session({
    secret: secrets.session
  , store: app.store
  }));
  app.use(everyauth.middleware());


  // Asset Management

  var assetManager = require('connect-assetmanager')({
    js: {
      route: /\/js\/all-[a-z0-9]+\.js/
    , path: __dirname + '/public/js/'
    , dataType: 'javascript'
    , debug: process.env.NODE_ENV === 'development'
    // , preManipulate: {
    //     '^': [
    //         function(src, path, index, isLast, callback) {
    //           callback(src.replace(/#socketIoPort#/g, env.port));
    //         }
    //       , function(src, path, index, isLast, callback) {
    //           if (/\.coffee$/.test(path)) {
    //             callback(coffee.compile(src));
    //           } else {
    //             callback(src);
    //           }
    //         }
    //     ]
    //   }
    , files: [ // order matters here
      //   'lib/jquery/jquery-1.9.1.min.js'
      // , 'lib/angular/angular.js'
      // , 'lib/foundation/foundation.min.js'
        'lib/typeahead.js'
      , 'lib/foundation/modernizr.foundation.js'
      // , 'lib/foundation/jquery.foundation.mediaQueryToggle.js'
      // , 'lib/foundation/jquery.foundation.navigation.js'
      , 'lib/foundation/jquery.foundation.tooltips.js'
      , 'lib/foundation/jquery.foundation.topbar.js'
      , 'lib/foundation/app.js'
      , 'app.js'
      , 'services.js'
      , 'controllers.js'
      , 'controller-stats.js'
      , 'controller-player.js'
      , 'controller-profile.js'
      // , 'filters.js'
      , 'directives.js'
      , 'directive-typeahead.js'
      // , '*'
      ]
    },
    css: {
      route: /\/css\/all-[a-z0-9]+\.css/
    , path: __dirname + '/public/css/'
    , dataType: 'css'
    , debug: process.env.NODE_ENV === 'development'
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
    , files: [ // order matters here
        'foundation.css'
      , 'typeahead.css'
      , 'sizzlingstats.css'
      ]
    }
  });
  app.use(assetManager);
  app.helpers({ assetManager: assetManager });
  app.use(express.staticCache());
});

app.configure('development', function() {
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function() {
  app.use(express.static(__dirname + '/public', {maxAge: 24 * 60 * 60 * 1000}));
});

app.configure(function() {
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes
require('./routes')(app);

// Hook Socket.io into Express
app.io = require('socket.io').listen(app);
app.io.enable('browser client minification');
app.io.enable('browser client etag');
app.io.enable('browser client gzip');
app.io.set('log level', 1);
app.io.set('transports', [
  'websocket'
// , 'flashsocket'
, 'htmlfile'
, 'xhr-polling'
, 'jsonp-polling'
]);
var socket = require('./routes/socket')(app);

/**
 * Check status of Elasticsearch server
 */
request.get('http://localhost:9200/sizzlingstats/_status', function(err, res, body) {
  if (err || res.statusCode !== 200) {
    return console.log('WARNING: Elasticsearch index "sizzlingstats" not found.');
  }
  console.log('Elasticsearch index "sizzlingstats" found.');
});

// Start server
app.listen(cfg.port, function() {
  console.log("Express server listening on port %d in %s mode"
            , app.address().port, app.settings.env);
});
