'use strict';

/* Controllers */

function SideBarCtrl($scope, $http) {
  $http.get('/api/matches')
    .success(function(data, status, headers, config) {
      $scope.matches = data.matches;
    });
}

function StatsCtrl($scope, $http, $routeParams) {
  $http.get('/api/stats/' + $routeParams.id)
  .success(function(data, status, headers, config) {
    var stats = $scope.stats = data.stats;
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
    var totalDamage = $scope.totalDamage = [];
    angular.forEach(stats.players, function(player) {
      totalDamage[player.team] = (totalDamage[player.team] || 0) + sumArray(player.damage);
    });
    // Calculate total frags for each team
    var totalFrags = $scope.totalFrags = [];
    angular.forEach(stats.players, function(player) {
      totalFrags[player.team] = (totalFrags[player.team] || 0) + sumArray(player.kills);
    });
    // Sum up individual players' stats from each round
    // The variable names are kind of vague, maybe I should fix that
    angular.forEach(stats.players, function(player) {
      player.totalFrags = (player.totalFrags || 0) + sumArray(player.kills);
      player.totalAssists = (player.totalAssists || 0) + sumArray(player.assists);
      player.totalDeaths = (player.totalDeaths || 0) + sumArray(player.deaths);
      player.totalDamage = (player.totalDamage || 0) + sumArray(player.damage);
      player.totalHeals = (player.totalHeals || 0) + sumArray(player.heals);
      player.totalMedPicks = (player.totalMedPicks || 0) + sumArray(player.medkills);
    });
  });
}

// Helper function, THIS DOES NOT BELONG HERE
function sumArray(array) {
  var sum = 0;
  angular.forEach(array, function(value) {
    if (value) sum += value;
  });
  return sum;
};

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
