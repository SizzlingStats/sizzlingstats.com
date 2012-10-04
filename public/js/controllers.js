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
    var redRoundScores = $scope.redRoundScores = [stats.redscore[0]];
    var bluRoundScores = $scope.bluRoundScores = [stats.bluscore[0]];
    for (var i=1; i<numRounds; i++) {
      redRoundScores.push(stats.redscore[i] - stats.redscore[i-1]);
      bluRoundScores.push(stats.bluscore[i] - stats.bluscore[i-1]);
    }
    // Calculate total damage for each team
    var totalDamage = $scope.totalDamage = [0,0,0,0];
    angular.forEach(stats.players, function(player) {
      totalDamage[player.team] += sumArray(player.damagedone);
    });
    // Calculate total frags for each team
    var totalFrags = $scope.totalFrags = [0,0,0,0];
    angular.forEach(stats.players, function(player) {
      totalFrags[player.team] += sumArray(player.kills);
    });
    // Sum up individual players' stats from each round
    angular.forEach(stats.players, function(player) {
      player.sumPoints = sumArray2(player.points);
      player.sumKills = sumArray2(player.kills);
      player.sumAssists = sumArray2(player.killassists);
      player.sumDeaths = sumArray2(player.deaths);
      player.sumDamage = sumArray2(player.damagedone);
      player.sumMedPicks = sumArray2(player.medpicks);
      player.sumCaptures = sumArray2(player.captures);
      player.sumDefenses = sumArray2(player.defenses);
      player.sumSuicides = sumArray2(player.suicides);
      player.sumDominations = sumArray2(player.dominations);
      player.sumRevenges = sumArray2(player.revenge);
      player.sumBuildingsBuilt = sumArray2(player.buildingsbuilt);
      player.sumBuildingsDestroyed = sumArray2(player.buildingsdestroyed);
      player.sumHeadshots = sumArray2(player.headshots);
      player.sumBackstabs = sumArray2(player.backstabs);
      player.sumHeals = sumArray2(player.healpoints);
      player.sumUbers = sumArray2(player.invulns);
      player.sumTeleports = sumArray2(player.teleports);
      player.sumCrits = sumArray2(player.crits);
      player.sumResupplyPoints = sumArray2(player.resupplypoints);
      player.sumBonusPoints = sumArray2(player.bonuspoints);
      player.sumHealsReceived = sumArray2(player.healsreceived);
      player.sumUbersDropped = sumArray2(player.ubersdropped);
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
