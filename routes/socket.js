/*
 * Serve content over a socket
 */

var statsEmitter = require('../emitters').statsEmitter;

module.exports = function(app) {
  var io = app.io;

  io.sockets.on('connection', function(socket) {

    var currentroom;

    socket.on('stats:subscribe', function (matchId) {
      if (currentroom) {
        socket.leave(currentroom);
      }
      socket.join(matchId);
      currentroom = matchId;
    });

  });

  statsEmitter.on('newMatch', function (data) {
    io.sockets.emit('matches:new', data);
  });

  statsEmitter.on('updateMatch', function (data) {
    io.sockets.emit('matches:update', data);
  });

  statsEmitter.on('newStats', function (data, matchId) {
    io.sockets.in(matchId).emit('stats:send', data);
  });

};