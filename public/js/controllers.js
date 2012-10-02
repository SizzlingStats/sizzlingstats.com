'use strict';

/* Controllers */

function NavBarCtrl($scope, $location) {
  $scope.path = function() {
    return $location.path();
  };
}

function SideBarCtrl($scope, $http, $routeParams) {
  $http.get('/api/matches')
    .success(function(data, status, headers, config) {
      $scope.matches = data.matches;
    });
  $scope.isActive = function() {
    return this.match._id === parseInt($routeParams.id,10);
  };
}

function StatsCtrl($scope, $http, $routeParams) {
  $http.get('/api/stats/' + $routeParams.id)
  .success(function(data, status, headers, config) {
    var stats = $scope.stats = data.stats;
    $scope.playerMetaData = data.playerdata;
    var numRounds = stats.redscore.length;
    // Ask sizzling to send only individual round scores instead of cumulative
    // It will make things a lot easier.
    var redScore = $scope.redScore = stats.redscore[numRounds-1];
    var bluScore = $scope.bluScore = stats.bluscore[numRounds-1];
    $scope.scoreComparison = redScore > bluScore ? '>' : redScore < bluScore ? '<' : '==';
    var redRoundScores = $scope.redRoundScores = [stats.redscore[0]];
    var bluRoundScores = $scope.bluRoundScores = [stats.bluscore[0]];
    for (var i=1; i<numRounds; i++) {
      redRoundScores[i] = stats.redscore[i] - stats.redscore[i-1];
      bluRoundScores[i] = stats.bluscore[i] - stats.bluscore[i-1];
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
      player.totalPoints = sumArray2(player.points);
      player.totalKills = sumArray2(player.kills);
      player.totalAssists = sumArray2(player.killassists);
      player.totalDeaths = sumArray2(player.deaths);
      player.totalDamage = sumArray2(player.damagedone);
      player.totalMedPicks = sumArray2(player.medpicks);
      player.totalCaptures = sumArray2(player.captures);
      player.totalDefenses = sumArray2(player.defenses);
      player.totalSuicides = sumArray2(player.suicides);
      player.totalDominations = sumArray2(player.dominations);
      player.totalRevenges = sumArray2(player.revenge);
      player.totalBuildingsBuilt = sumArray2(player.buildingsbuilt);
      player.totalBuildingsDestroyed = sumArray2(player.buildingsdestroyed);
      player.totalHeadshots = sumArray2(player.headshots);
      player.totalBackstabs = sumArray2(player.backstabs);
      player.totalHeals = sumArray2(player.healpoints);
      player.totalUbers = sumArray2(player.invulns);
      player.totalTeleports = sumArray2(player.teleports);
      player.totalCrits = sumArray2(player.crits);
      player.totalResupplyPoints = sumArray2(player.resupplypoints);
      player.totalBonusPoints = sumArray2(player.bonuspoints);
      player.totalHealsReceived = sumArray2(player.healsreceived);
      player.totalUbersDropped = sumArray2(player.ubersdropped);
    });
  });

  // Helper functions
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
}

function AppCtrl($scope, socket) {
  socket.on('send:name', function (data) {
    $scope.name = data.name;
  });
}

function MyCtrl1($scope, socket) {
  socket.on('send:time', function (data) {
    $scope.time = data.time;
  });
}
MyCtrl1.$inject = ['$scope', 'socket'];


function MyCtrl2() {
}
MyCtrl2.$inject = [];
