require('coffee-script/register');

var cluster = require('cluster')
  , cfg = require('config').cfg
  , server = require('./server');

// Start server
server.listen(cfg.port, function () {
  cluster.isWorker && process.send('online');
  console.log("Express server listening on port %d in %s mode", cfg.port, cfg.ENV);
});
