/*
 * Serve content over a socket
 */

var statsEmitter = require('../emitters').statsEmitter;

module.exports = function(app) {
  var io = app.io;

  io.sockets.on('connection', function(socket) {

    var currentroom;

    socket.on('stats:subscribe', function (matchid) {
      if (currentroom) {
        socket.leave(currentroom);
      }
      socket.join(matchid);
      currentroom = matchid;
    });

  });

  statsEmitter.on('newMatch', function (data) {
    io.sockets.emit('matches:new', data);
  });

  statsEmitter.on('newStats', function (data, matchid) {
    io.sockets.in(matchid).emit('stats:send', data);
  });

};