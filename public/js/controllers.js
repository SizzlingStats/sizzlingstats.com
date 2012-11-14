'use strict';

/* Controllers */

function MainCtrl($scope, $location, $rootScope) {
  $scope.path = function() {
    return $location.path();
  };
  $scope.loading = false;
  $rootScope.$on('$routeChangeStart', function() {
    $scope.loading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function() {
    $scope.loading = false;
  });
}

function SideBarCtrl($scope, $http, $routeParams, socket) {
  socket.on('matches:new', function(data) {
    $scope.matches.push(data);
  });

  socket.on('matches:update', function(data) {
    for (var i=0, len=$scope.matches.length; i<len; i++) {
      if ($scope.matches[i]._id == data._id) {
        $scope.matches[i] = data;
        return;
      }
    }
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
      player.stats = [
        sumArray2(player.points),
        sumArray2(player.kills),
        sumArray2(player.killassists),
        sumArray2(player.deaths),
        ratio(player.deaths, player.kills, player.killassists), // Frags + Assists / Deaths
        sumArray2(player.damagedone),
        sumArray2(player.medpicks),
        sumArray2(player.captures),
        sumArray2(player.defenses),
        sumArray2(player.suicides),
        sumArray2(player.dominations),
        sumArray2(player.revenge),
        sumArray2(player.buildingsbuilt),
        sumArray2(player.buildingsdestroyed),
        sumArray2(player.headshots),
        sumArray2(player.backstabs),
        sumArray2(player.healsreceived),
        sumArray2(player.healpoints),
        sumArray2(player.invulns),
        sumArray2(player.ubersdropped)
        // sumArray2(player.crits),
        // sumArray2(player.teleports),
        // sumArray2(player.resupplypoints),
        // sumArray2(player.bonuspoints),
      ];
      var avatar = '';
      if ($scope.playerMetaData[player.steamid]) {
        avatar = $scope.playerMetaData[player.steamid].avatar;
      }
      player.tr = '<td class="name"><img src="' + avatar +
          '" /><span>' + player.name + '</span><td>' + player.stats.join('</td><td>') + '</td>';
    });
  });

  // Helpers
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
  var ratio = function(denArray, numArray1, numArray2) {
    if (!numArray1.length || !numArray2.length) return '-'; // this is a hack
    var numerator;
    if (!numArray2) {
      numerator = sumArray(numArray1);
    } else {
      numerator = sumArray(numArray1) + sumArray(numArray2);
    }
    if (numerator === 0) return 0;
    var denominator = sumArray(denArray);
    if (denominator === 0) return '&infin;';
    return Math.round( (numerator/denominator)*100 )/100;
  };
  $scope.secondsToHMS = function(seconds) {
    var h = parseInt(seconds/3600);
    var m = parseInt((seconds-h*3600)/60);
    var s = seconds-h*3600-m*60;
    return h+':'+('0'+m).slice(-2)+':'+('0'+s).slice(-2);
  };
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
