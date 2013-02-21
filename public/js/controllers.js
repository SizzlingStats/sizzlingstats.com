/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
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
  socket.on('matches:update', function(data) {
    for (var i=0, len=$scope.matches.length; i<len; i++) {
      if ($scope.matches[i]._id == data._id) {
        $scope.matches[i] = data;
        return;
      }
    }
    // data._id wasn't found, so just push it into $scope.matches[]
    $scope.matches.push(data);
  });

  socket.on('matches:remove', function(matchId) {
    for (var i=$scope.matches.length-1; i>=0; i--) {
      if ($scope.matches[i]._id == matchId) {
        $scope.matches.splice(i,1);
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
      parseStats(data, true);
    });

    socket.emit('stats:subscribe', val);
  });

  socket.on('stats:update', function (data) {
    console.log('Stat update received!');
    parseStats(data, false);
  });

  function Player(data) {
    for (var key in data) {
      this[key] = data[key];
    }
  }
  Player.prototype.sumOf = function(statistic) {
    return sumArray2(this[statistic]);
  };
  Player.prototype.perMinute = function(statistic) {
    return ratio($scope.playableTime/60, this[statistic]);
  };
  Player.prototype.fapd = function() {
    return ratio(this.deaths, this.kills, this.killassists);
  };
  Player.prototype.mostPlayedClass = function() {
      if (this.mostplayedclass.length == 1) {
        return this.mostplayedclass[0];
      }
      // Determine what class was played the most by summing the rounddurations
      //  for the according tf2class in the "mostplayedclass" array.
      var totals = [0,0,0,0,0,0,0,0,0,0];
      for (var i=0, ilen=$scope.selectedRounds.length; i<ilen; i++) {
        // mostplayedclass[r] is the id (1-9) of the tf2class that the player played
        //  the most in the ith round. The index of the max value in totals[] is
        //  the id of the tf2class that the player played the most in the match.
        var r = $scope.selectedRounds[i];
        totals[ this.mostplayedclass[r] ] += $scope.stats.roundduration[r];
      }
      // Find the index of the max value in totals[].
      var theClass=0, theMax=0;
      for (var j=0; j<=9; j++) {
        if (totals[j] > theMax) {
          theMax = totals[j];
          theClass = j;
        }
      }
      return theClass;
  };
  Player.prototype.playedClasses = function() {
    return filterBySelectedRounds(this.playedclasses).reduce(function(a,b) { return a | b; },0);
  };

  $scope.overallStatsTableData = [
    ['Name', null, 'name']
  , ['C', 'Most Played Class', 'mostPlayedClass()']
  , ['P', 'Points', 'sumOf("points")']
  , ['FA/D', 'Frags+Assists Per Death', 'fapd()']
  , ['F', 'Frags', 'sumOf("kills")']
  , ['A', 'Assists', 'sumOf("killassists")']
  , ['D', 'Deaths', 'sumOf("deaths")']
  , ['S', 'Suicides', 'sumOf("suicides")']
  , ['DPM', 'Damage Per Minute', 'perMinute("damagedone")']
  , ['DMG', 'Damage', 'sumOf("damagedone")']
  , ['MP', 'Medic Picks', 'sumOf("medpicks")']
  , ['HR', 'Heals Received', 'sumOf("healsreceived")']
  , ['CPC', 'Capture Points Captured', 'sumOf("captures")']
  , ['CPB', 'Capture Points Blocked', 'sumOf("defenses")']
  , ['DOM', 'Dominations', 'sumOf("dominations")']
  , ['REV', 'Revenges', 'sumOf("revenge")']
  // , ['', '', 'sumOf("buildingsbuilt")']
  // , ['', '', 'sumOf("buildingsdestroyed")']
  // , ['', '', 'sumOf("crits")']
  // , ['', '', 'sumOf("teleports")']
  // , ['', '', 'sumOf("resupplypoints")']
  // , ['', '', 'sumOf("bonuspoints")']
  ];
  $scope.medicStatsTableData = [
    ['Medics', null, 'name']
  , ['H', 'Heals Given', 'sumOf("healpoints")']
  , ['U', 'Ubers', 'sumOf("invulns")']
  , ['UD', 'Ubers Dropped', 'sumOf("ubersdropped")']
  ];
  $scope.sniperStatsTableData = [
    ['Snipers', null, 'name']
  , ['HS', 'Headshots', 'sumOf("headshots")']
  ];
  $scope.spyStatsTableData = [
    ['Spies', null, 'name']
  , ['BS', 'Backstabs', 'sumOf("backstabs")']
  ];


  var parseStats = function(data, reinitializeSelectedRounds) {
    // Stupid hack -- need to keep both a hash and and array of players, because
    //  AngularJS's orderBy function doesn't work on a hash.
    $scope.playersArr = [];
    $scope.players = {};

    // Stupid placeholder object for when things go wrong
    if (!data  || typeof data !== 'object') {
      data = { stats: {
        redname: 'RED',
        bluname: 'BLU',
        redscore: [],
        bluscore: [],
        players: {}
      }};
    }
    var stats = $scope.stats = data.stats;


    // If redscore.length is greater than the current number of rounds, then that
    //  means a new round just started -- add it to $scope.selectedRounds.
    if (stats.redscore.length > $scope.numRounds) {
      $scope.selectedRounds.push(stats.redscore.length-1);
    }

    var numRounds = $scope.numRounds = stats.redscore.length;

    if (reinitializeSelectedRounds) { $scope.initializeSelectedRoundsArray(); }

    var redScore = $scope.redScore = stats.redscore.reduce(function(a,b) { return a + b; },0);
    var bluScore = $scope.bluScore = stats.bluscore.reduce(function(a,b) { return a + b; },0);
    $scope.scoreComparison = redScore > bluScore ? '>' : redScore < bluScore ? '<' : '==';

    // Total playable time
    var playableTime = $scope.playableTime = sumArray(stats.roundduration);

    // Construct player objects
    angular.forEach(stats.players, function(playerdata, steamid) {
      var player = $scope.players[steamid] = new Player(playerdata);
      // stupid hack
      $scope.playersArr.push(player);
    });

    // Calculate total midfights won for each team
    var totalMidfightsWon = [0,0,0,0];
    var filteredTeamfirstcapArr = filterBySelectedRounds(stats.teamfirstcap);
    for (var j=0; j<numRounds; j++) {
      totalMidfightsWon[ filteredTeamfirstcapArr[j] ] += 1;
    }

    // Calculate total damage and frags for each team
    var totalDamage = [0,0,0,0];
    var totalFrags = [0,0,0,0];
    angular.forEach($scope.players, function(player, steamid) {
      totalDamage[player.team] += sumArray(player.damagedone);
      totalFrags[player.team] += sumArray(player.kills);
    });

    // Assemble score overview table rows
    var redRoundScores = stats.redscore.concat(redScore,totalDamage[2],totalFrags[2],totalMidfightsWon[2]);
    var bluRoundScores = stats.bluscore.concat(bluScore,totalDamage[3],totalFrags[3],totalMidfightsWon[3]);
    $scope.redtr = '<td class="red">' + escapeHtml(stats.redname) +
                   '</td><td>' + redRoundScores.join('</td><td>') + '</td>';
    $scope.blutr = '<td class="blu">' + escapeHtml(stats.bluname) +
                   '</td><td>' + bluRoundScores.join('</td><td>') + '</td>';
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
  window.onmouseup = function(e) {
    $scope.ctrl = !!e.ctrlKey;
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
    $scope.selectedRounds.sort(function(a,b){return a-b;});
    parseStats({stats: $scope.stats, playerdata: $scope.playerMetaData}, false);
  };
  $scope.separateTeams = {
    sort: false,
    property: 'team'
  };
  $scope.filterBinds = true;
  $scope.bindFilter = function(chat) {
    return (!$scope.filterBinds || !chat.isBind);
  };
  var sumArray = $scope.sumArray = function(arr) {
    if (!arr || !arr.length) return 0;
    return filterBySelectedRounds(arr).reduce(function(a,b) { return a + b; },0);
  };
  var sumArray2 = $scope.sumArray2 = function(arr) {
    if (!arr || !arr.length) return '-';
    var filteredArr = filterBySelectedRounds(arr);
    if (!filteredArr.length) return '-';
    return filteredArr.reduce(function(a,b) { return a + b; });
  };
  var ratio = $scope.ratio = function(den, numArray1, numArray2) {
    var numerator = sumArray2(numArray1) + sumArray(numArray2);
    var denominator = den.length ? sumArray2(den) : den;
    if (typeof numerator !== 'number') return '-';
    if (numerator === 0) return 0;
    if (denominator === 0) return '&infin;';
    return Math.round( (numerator/denominator)*100 )/100;
  };
  var filterBySelectedRounds = function(arr) {
    var filteredArr = [];
    for (var i=0, r; r=$scope.selectedRounds[i]+1; i++) {
      if (exists(arr[r-1])) { filteredArr.push(arr[r-1]); }
    }
    return filteredArr;
  };
  var exists = function(n) {
    return (n !== null && n !== undefined);
  };
  var escapeHtml = $scope.escapeHtml = (function () {
    var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' };
    return function (text) {
      return text.replace(/[\"&<>]/g, function (a) { return chr[a]; });
    };
  })();
  $scope.secondsToHMS = function(seconds) {
    var h = parseInt(seconds/3600, 10);
    var m = parseInt((seconds-h*3600)/60, 10);
    var s = seconds-h*3600-m*60;
    if (h === 0) { return ('0'+m).slice(-2)+':'+('0'+s).slice(-2); }
    return h+':'+('0'+m).slice(-2)+':'+('0'+s).slice(-2);
  };

  // The very first time you load the controller, use the resolvedData.
  parseStats(resolvedData, true);
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
