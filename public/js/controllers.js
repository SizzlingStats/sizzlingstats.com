'use strict';

/* Controllers */

function MainCtrl($scope, $location, $rootScope) {
  $scope.path = function() {
    return $location.path();
  };
  $rootScope.loading = false;
  $rootScope.$on('$routeChangeStart', function() {
    $rootScope.loading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.loading = false;
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

function StatsCtrl($scope, $rootScope, $location, $http, socket, resolvedData) {
  var firstLoad = true;

  $scope.location = $location;
  $scope.$watch("location.search().id", function (val, old) {
    if (!val) { return; }
    // We don't want to request the data again if the controller just loaded.
    //  If we click away from the original stats, then set firstLoad to false.
    //  Otherwise if firstLoad == true, exit.
    if (old && val !== old) {
      firstLoad = false;
    }
    if (firstLoad) { return; }

    $rootScope.loading = true;

    $http({
      method: 'GET',
      url: '/api/stats/' + val
    }).success(function(data) {
      $rootScope.loading = false;
      calculateStats(data, true);
    });

    socket.emit('stats:subscribe', val);
  });

  socket.on('stats:send', function (data) {
    console.log('Stat update received!');
    calculateStats(data, false);
  });

  var calculateStats = function(data, reinitializeSelectedRounds) {
    // Stupid placeholder object for when things go wrong
    if (!data  || typeof data !== 'object') {
      data = { stats: {
        redname: 'RED',
        bluname: 'BLU',
        redscore: [],
        bluscore: [],
        players: []
      }};
    }
    var stats = $scope.stats = data.stats;
    $scope.playerMetaData = data.playerdata;
    fillOutPlayerMetaData();

    // If redscore.length is greater than the current number of rounds, then that
    //  means a new round just started -- add it to $scope.selectedRounds.
    if (stats.redscore.length > $scope.numRounds) {
      $scope.selectedRounds.push(stats.redscore.length-1);
    }

    var numRounds = $scope.numRounds = stats.redscore.length;

    if (reinitializeSelectedRounds) { $scope.initializeSelectedRoundsArray(); }

    // Ask sizzling to send only individual round scores instead of cumulative
    // It will make things a lot easier.
    var redScore = $scope.redScore = stats.redscore[numRounds-1];
    var bluScore = $scope.bluScore = stats.bluscore[numRounds-1];
    $scope.scoreComparison = redScore > bluScore ? '>' : redScore < bluScore ? '<' : '==';

    // Total playable time
    var playableTime = $scope.playableTime = sumArray(stats.roundduration);

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

    // Calculate individual players' stats from the select range of rounds
    angular.forEach(stats.players, function(player) {
      player.mostPlayedClass = mostPlayedClass(player.mostplayedclass);
      player.stats = [
        sumArray2(player.points),
        // Frags + Assists / Deaths
        ratio(player.deaths, true, player.kills, player.killassists),
        sumArray2(player.kills),
        sumArray2(player.killassists),
        sumArray2(player.deaths),
        sumArray2(player.suicides),
        // Damage Per Minute
        ratio(playableTime/60, false, player.damagedone),
        sumArray2(player.damagedone),
        sumArray2(player.medpicks),
        sumArray2(player.healsreceived),
        sumArray2(player.captures),
        sumArray2(player.defenses),
        sumArray2(player.dominations),
        sumArray2(player.revenge),
        sumArray2(player.headshots),
        sumArray2(player.backstabs)
        // sumArray2(player.buildingsbuilt),
        // sumArray2(player.buildingsdestroyed),
        // sumArray2(player.crits),
        // sumArray2(player.teleports),
        // sumArray2(player.resupplypoints),
        // sumArray2(player.bonuspoints),
      ];
      player.tr = '<td class="name"><img class="team' + player.team + '-avatar" src="' + (player.avatar || '') +
          '" /><span>' + player.name + '</span><td><img class="class-icon" src="/img/classicons/' +
          player.mostPlayedClass + '.png"></img><td>' + player.stats.join('</td><td>') + '</td>';
      // Additional medic-specific stats
      if (player.mostPlayedClass == 5) {
        player.medicStats = [
          sumArray2(player.healpoints),
          sumArray2(player.invulns),
          sumArray2(player.ubersdropped)
        ];
        player.medictr = '<td class="name"><img class="team' + player.team + '-avatar" src="' + (player.avatar || '') +
            '" /><span>' + player.name + '</span><td>' + player.medicStats.join('</td><td>') + '</td>';
      }
    });
  };

  // Helpers

  $scope.selectedRounds = [];
  $scope.initializeSelectedRoundsArray = function() {
    $scope.selectedRounds = [];
    for (var i=0; i<$scope.numRounds; i++) {
      $scope.selectedRounds[i] = i;
    }
  };
  $scope.ctrl = false;
  window.onkeydown = function(e) {
    if (e.ctrlKey) { $scope.ctrl = true; }
  };
  window.onkeyup = function(e) {
    if (e.ctrlKey) { $scope.ctrl = true; }
    else { $scope.ctrl = false; }
  };
  $scope.clickRoundHeader = function(round) {
    if ($scope.selectedRounds.length === 0) {
      $scope.selectedRounds.push(round);
    } else if ($scope.selectedRounds.length === 1 && $scope.selectedRounds[0] === round && !$scope.ctrl) {
      $scope.initializeSelectedRoundsArray();
    } else if ($scope.ctrl) {
      if ($scope.selectedRounds.indexOf(round) > -1) {
        $scope.selectedRounds.splice($scope.selectedRounds.indexOf(round),1);
      } else {
        $scope.selectedRounds.push(round);
      }
    } else {
      $scope.selectedRounds = [round];
    }
    $scope.selectedRounds.sort(function(a,b){return a-b});
    calculateStats({stats: $scope.stats, playerdata: $scope.playerMetaData}, false);
  };

  $scope.overallSort = 'name';
  $scope.overallReverse = false;
  $scope.medicSort = 'name';
  $scope.medicReverse = false;
  $scope.sortBy = function(col, tableName) {
    // If previously sorting by 'name', and clicking a different column, then
    //  set reverse to true.
    var sort = tableName+'Sort';
    var rev = tableName+'Reverse';
    if (col === $scope[sort] || ($scope[sort] === 'name' && !$scope[rev]) ) {
      $scope[rev] = !$scope[rev];
    }
    $scope[sort] = col;
  };
  $scope.sortClass = function(col, tableName) {
    var sort = tableName+'Sort';
    var rev = tableName+'Reverse';
    if ($scope[sort] === col) {
      return $scope[rev] ? 'sort-true' : 'sort-false';
    }
    return '';
  };
  $scope.separateTeams = false;
  $scope.separateTeamsPredicate = function() {
    return $scope.separateTeams ? ( ($scope.overallReverse ? '-' : '+') + 'team' ) : '';
  };
  var fillOutPlayerMetaData = function() {
    for (var i=0,player; player=$scope.stats.players[i]; i++) {
      var steamid = player.steamid;

      if ($scope.playerMetaData[steamid]) {
        $scope.playerMetaData[steamid].name = player.name;
        $scope.playerMetaData[steamid].team = player.team;
        player.avatar = $scope.playerMetaData[steamid].avatar;
      } else {
        $scope.playerMetaData[steamid] = { name: player.name, team: player.team };
      }
    }
  };
  $scope.filterBinds = true;
  $scope.bindFilter = function(chat) {
    return (!$scope.filterBinds || !chat.isBind);
  };
  var mostPlayedClass = function(mpcArray) {
    if ($scope.numRounds === 1) {
      return mpcArray[0];
    }
    // Determine what class was played the most by summing the rounddurations
    //  for the according tf2class in the "mostplayedclass" array.
    var totals = [0,0,0,0,0,0,0,0,0,0];
    for (var i=0; i<$scope.numRounds; i++) {
      // mpcArray[i] is the index (1-9) of the tf2class that the player played
      //  the most in the ith round. The index of the max value in totals[] is
      //  the id of the tf2class that the player played the most in the match.
      totals[ mpcArray[i] ] += $scope.stats.roundduration[i];
    }
    // Find the index of the max value in totals[].
    var theClass=0, theMax=0;
    for (var j=0; j<9 ;j++) {
      if (totals[j] > theMax) {
        theMax = totals[j];
        theClass = j;
      }
    }
    return theClass;
  };
  var sumArray = function(array) {
    var sum = 0, filteredArray = [];
    for (var i=0, ilen=$scope.selectedRounds.length; i<ilen; i++) {
      filteredArray.push(array[$scope.selectedRounds[i]]);
    }
    for (var j=0, jlen=filteredArray.length; j<jlen; j++) {
      if (filteredArray[j]) sum += filteredArray[j];
    }
    return sum;
  };
  var sumArray2 = function(array) {
    if (!array.length) return '-'; // this is a hack
    var sum = 0, filteredArray = [];
    for (var i=0, len=$scope.selectedRounds.length; i<len; i++) {
      filteredArray.push(array[$scope.selectedRounds[i]]);
    }
    for (var j=0, jlen=filteredArray.length; j<jlen; j++) {
      if (filteredArray[j]) sum += filteredArray[j];
    }
    return sum;
  };
  var ratio = function(den, denIsArray, numArray1, numArray2) {
    if (!numArray1.length) return '-'; // this is a hack
    var numerator, denominator;
    if (!numArray2 || !numArray2.length) {
      numerator = sumArray(numArray1);
    } else {
      numerator = sumArray(numArray1) + sumArray(numArray2);
    }
    if (numerator === 0) return 0;
    if (denIsArray) {
      denominator = sumArray(den);
    } else {
      denominator = den;
    }
    if (denominator === 0) return '&infin;';
    return Math.round( (numerator/denominator)*100 )/100;
  };
  $scope.secondsToHMS = function(seconds) {
    var h = parseInt(seconds/3600);
    var m = parseInt((seconds-h*3600)/60);
    var s = seconds-h*3600-m*60;
    if (h === 0) { return ('0'+m).slice(-2)+':'+('0'+s).slice(-2); }
    return h+':'+('0'+m).slice(-2)+':'+('0'+s).slice(-2);
  };

  // The very first time you load the controller, use the resolvedData.
  calculateStats(resolvedData, true);
}
// This is for the first time you load the controller
//  -- so that you don't see all the empty divs and tables.
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
