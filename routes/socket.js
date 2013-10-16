/*
 * Serve content over a socket
 */

var statsEmitter = require('../emitters').statsEmitter;

module.exports = function(app) {
  var io = app.io;

  io.sockets.on('connection', function(socket) {

    socket.on('stats:subscribe', function (matchId) {
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
      }
      socket.join(matchId);
      socket.currentRoom = matchId;
    });

  });

  statsEmitter.on('updateStats', function (stats) {
    io.sockets.emit('matches:update', {
      _id: stats._id,
      isLive: stats.isLive,
      hostname: stats.hostname,
      redname: stats.redname,
      bluname: stats.bluname,
      redCountry: stats.redCountry,
      bluCountry: stats.bluCountry
    });
    io.sockets.in(stats._id).emit('stats:update', { stats: stats }, stats._id);
  });

  statsEmitter.on('removeStats', function (matchId) {
    io.sockets.emit('matches:remove', matchId);
  });

  statsEmitter.on('updateLiveStats', function (stats) {
    io.sockets.in(stats._id).emit('stats:liveupdate', { stats: stats });
  });

};
