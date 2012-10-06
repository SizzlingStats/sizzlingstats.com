'use strict';

/* Controllers */

function NavBarCtrl($scope, $location) {
  $scope.path = function() {
    return $location.path();
  };
}

function SideBarCtrl($scope, $http, $routeParams, socket) {
  socket.on('matches:new', function(data) {
    $scope.matches.push(data);
  });
  $http.get('/api/matches')
    .success(function(data, status, headers, config) {
      $scope.matches = data.matches;
    });
  $scope.isActive = function() {
    return this.match._id === parseInt($routeParams.id,10);
  };
}

function StatsCtrl($scope, $routeParams, socket, resolvedData) {
  $scope.stats = resolvedData.stats;
  $scope.playerMetaData = resolvedData.playerdata;

  // Socket.io
  socket.emit('stats:subscribe', $routeParams.id);
  socket.on('stats:send', function (data) {
    $scope.stats = data.stats;
    $scope.playerMetaData = data.playerdata;
  });

  // Helpers
  $scope.sort = 'name';
  $scope.reverse = false;
  $scope.sortClass = function(sortColumn) {
    if ($scope.sort === sortColumn) {
      return $scope.reverse ? 'sort-true' : 'sort-false';
    }
    return '';
  };
  var sumArray = function(array) {
    var sum = 0;
    angular.forEach(array, function(value) {
      if (value) sum += value;
    });
    return sum;
  };
  var sumArray2 = function(array) {
    if (!array.length) return '-'; // this is a hack
    var sum = 0;
    angular.forEach(array, function(value) {
      if (value) sum += value;
    });
    return sum;
  };

  // Watch $scope.stats, recalculate on change
  $scope.$watch("stats", function() {
    var stats = $scope.stats;
    var numRounds = stats.redscore.length;
    // Ask sizzling to send only individual round scores instead of cumulative
    // It will make things a lot easier.
    var redScore = $scope.redScore = stats.redscore[numRounds-1];
    var bluScore = $scope.bluScore = stats.bluscore[numRounds-1];
    $scope.scoreComparison = redScore > bluScore ? '>' : redScore < bluScore ? '<' : '==';

    // Calculate total damage for each team
    var totalDamage = [0,0,0,0];
    angular.forEach(stats.players, function(player) {
      totalDamage[player.team] += sumArray(player.damagedone);
    });
    // Calculate total frags for each team
    var totalFrags = [0,0,0,0];
    angular.forEach(stats.players, function(player) {
      totalFrags[player.team] += sumArray(player.kills);
    });

    // Assemble score overview table rows
    var redRoundScores = [stats.redscore[0]];
    var bluRoundScores = [stats.bluscore[0]];
    for (var i=1; i<numRounds; i++) {
      redRoundScores.push(stats.redscore[i] - stats.redscore[i-1]);
      bluRoundScores.push(stats.bluscore[i] - stats.bluscore[i-1]);
    }
    redRoundScores.push(stats.redscore[numRounds-1]);
    bluRoundScores.push(stats.bluscore[numRounds-1]);
    redRoundScores.push(totalDamage[2]);
    redRoundScores.push(totalFrags[2]);
    bluRoundScores.push(totalDamage[3]);
    bluRoundScores.push(totalFrags[3]);
    $scope.redtr = '<td class="red">' + stats.redname + '</td><td>' +
                    redRoundScores.join('</td><td>') + '</td>';
    $scope.blutr = '<td class="blu">' + stats.bluname + '</td><td>' +
                    bluRoundScores.join('</td><td>') + '</td>';

    // Sum up individual players' stats from each round
    angular.forEach(stats.players, function(player) {
      player.stats = [];
      player.stats.push(sumArray2(player.points));
      player.stats.push(sumArray2(player.kills));
      player.stats.push(sumArray2(player.killassists));
      player.stats.push(sumArray2(player.deaths));
      player.stats.push(sumArray2(player.damagedone));
      player.stats.push(sumArray2(player.medpicks));
      player.stats.push(sumArray2(player.captures));
      player.stats.push(sumArray2(player.defenses));
      player.stats.push(sumArray2(player.suicides));
      player.stats.push(sumArray2(player.dominations));
      player.stats.push(sumArray2(player.revenge));
      player.stats.push(sumArray2(player.buildingsbuilt));
      player.stats.push(sumArray2(player.buildingsdestroyed));
      player.stats.push(sumArray2(player.headshots));
      player.stats.push(sumArray2(player.backstabs));
      player.stats.push(sumArray2(player.crits));
      player.stats.push(sumArray2(player.resupplypoints));
      player.stats.push(sumArray2(player.bonuspoints));
      player.stats.push(sumArray2(player.healsreceived));
      player.stats.push(sumArray2(player.healpoints));
      player.stats.push(sumArray2(player.invulns));
      player.stats.push(sumArray2(player.ubersdropped));
      player.stats.push(sumArray2(player.teleports));
      var avatar = '';
      if ($scope.playerMetaData[player.steamid]) {
        avatar = $scope.playerMetaData[player.steamid].avatar;
      }
      player.tr = '<td class="name"><img src="' + avatar +
          '" /><span>' + player.name + '</span><td>' + player.stats.join('</td><td>') + '</td>';
    });
  });
}
StatsCtrl.resolve = {
  resolvedData: function($q, $http, $route) {
    var deferred = $q.defer();

    $http({
      method: 'GET',
      url: '/api/stats/' + $route.current.params.id
    })
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(data);
      });
    return deferred.promise;
  }
};
