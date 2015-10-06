/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

function StatsCtrl($scope, $rootScope, $route, $http, socket, resolvedData) {
  // A hack to short circuit the routechange so that the controller doesn't get
  //  reloaded on path change
  var lastRoute = $route.current;
  $scope.$on('$locationChangeSuccess', function(event) {
    // Only do it for the stats path.
    if ($route.current.$$route &&
        $route.current.$$route.templateUrl === 'partials/stats') {
    // if (lastRoute && $route.current.$$route.templateUrl === 'partials/stats') {
      // Grab the new matchid before we stop the routechange
      var matchId = $route.current.params.id;
      // This stops the routechange from succeeding
      $route.current = lastRoute;
      $route.current.params.id = matchId;

      $http({
        method: 'GET',
        url: '/api/stats/' + matchId
      }).success(function(data) {
        $rootScope.loading = false;
        parseStats(data, true);
      });

      socket.emit('stats:subscribe', matchId);
    }
  });

  socket.on('stats:update', function (data) {
    // console.log('Stat update received!');
    parseStats(data, false);
  });

  socket.on('stats:liveupdate', function (data) {
    parseLiveUpdate(data);
  });

  function Player(data, isLiveUpdate) {
    if (isLiveUpdate) {
      this.name = data.name;
      this.steamid = data.steamid;
      this.team = data.team;
      for (var key in data) {
        // Skip name, steamid, and team when doing the array stuff
        if (key === 'name' || key === 'steamid' || key === 'team') {
          continue;
        }
        this[key] = [];
      }
      return this.setLiveUpdateData(data);
    }
    this.setData(data);
  }
  Player.prototype.setData = function(data) {
    for (var key in data) {
      this[key] = data[key];
    }
  };
  Player.prototype.setLiveUpdateData = function(data) {
    // using the liveupdate current round thing
    for (var key in data) {
      // if (!this[key]) {
      //   console.log(key);
      //   console.log(data);
      //   console.log(this);
      // }

      // Skip name, steamid, and team when doing the array stuff
      if (key === 'name' || key === 'steamid' || key === 'team') {
        continue;
      }
      this[key][$scope.stats.round] = data[key];
    }
  };
  Player.prototype.sumOf = function(statistic) {
    return sumArray2(result(this, statistic));
  };
  Player.prototype.perMinute = function(statistic) {
    return ratio($scope.playableTime/60, result(this, statistic));
  };
  Player.prototype.fapd = function() {
    return ratio(this.deaths, this.kills, this.killassists);
  };
  Player.prototype.totaldamage = function() {
    var arr = [];
    for (var i = 0, len = Math.min(this.damagedone.length, this.overkillDamage.length); i < len; i++) {
      arr[i] = ((this.damagedone[i] || 0) + (this.overkillDamage[i] || 0));
    }
    return arr;
  };
  Player.prototype.mostPlayedClass = function() {
      if (this.mostplayedclass.length == 1) {
        return this.mostplayedclass[0];
      }
      // Determine what class was played the most by summing the rounddurations
      //  for the according tf2class in the "mostplayedclass" array.
      var totals = [0,0,0,0,0,0,0,0,0,0];
      for (var i=0, ilen=$scope.selectedRounds.length; i<ilen; i++) {
        // mostplayedclass[r] is the id (1-9) of the tf2class
        //  that the player played the most in the ith round.
        // The index of the max value in totals[] is the id of the tf2class
        //  that the player played the most in the match.
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
    return filterBySelectedRounds(this.playedclasses)
             .reduce(function(a,b) { return a | b; },0);
  };

  $scope.overallStatsTableData = [
    ['Name', null, 'name']
  , ['C', 'Most Played Class', 'mostPlayedClass()']
  // , ['P', 'Points', 'sumOf("points")']
  , ['FA/D', 'Frags+Assists Per Death', 'fapd()']
  , ['F', 'Frags', 'sumOf("kills")']
  , ['A', 'Assists', 'sumOf("killassists")']
  , ['D', 'Deaths', 'sumOf("deaths")']
  , ['S', 'Suicides', 'sumOf("suicides")']
  , ['DPM', 'Damage Per Minute', 'perMinute("damagedone")']
  // , ['ODPM', 'Overkill Damage Per Minute', 'perMinute("totaldamage")']
  , ['DMG', 'Damage', 'sumOf("damagedone")']
  // , ['ODMG', 'Overkill Damage', 'sumOf("totaldamage")']
  , ['MP', 'Medic Picks', 'sumOf("medpicks")']
  , ['HR', 'Heals Received (Excl Buffs)', 'sumOf("healsreceived")']
  , ['CPC', 'Capture Points Captured', 'sumOf("captures")']
  , ['CPB', 'Capture Points Blocked', 'sumOf("defenses")']
  , ['DOM', 'Dominations', 'sumOf("dominations")']
  , ['REV', 'Revenges', 'sumOf("revenge")']
  // , ['', '', 'sumOf("buildingsdestroyed")']
  // , ['', '', 'sumOf("crits")']
  // , ['', '', 'sumOf("resupplypoints")']
  // , ['', '', 'sumOf("bonuspoints")']
  ];
  $scope.medicStatsTableData = [
    ['Medics', null, 'name']
    // logstats don't include buffs
  , ['H', 'Heals Given (Excl Buffs)', 'sumOf("healpoints")']
  , ['U', 'Ubers', 'sumOf("invulns")']
  , ['UD', 'Ubers Dropped', 'sumOf("ubersdropped")']
  ];
  $scope.sniperStatsTableData = [
    ['Snipers', null, 'name']
  , ['HS', 'Headshot Kills', 'sumOf("headshots")']
  ];
  $scope.spyStatsTableData = [
    ['Spies', null, 'name']
  , ['BS', 'Backstabs', 'sumOf("backstabs")']
  ];
  $scope.engineerStatsTableData = [
    ['Engineers', null, 'name']
  , ['BB', 'Buildings Built', 'sumOf("buildingsbuilt")']
  , ['T', 'Teleports', 'sumOf("teleports")']
  ];

  $scope.players = [];

  var parseStats = function(data, reinitializeSelectedRounds) {

    // Stupid placeholder object for when things go wrong
    if (!data  || typeof data !== 'object') {
      data = { stats: {
        redname: 'RED'
      , bluname: 'BLU'
      , redscore: []
      , bluscore: []
      }};
    }
    var stats = $scope.stats = data.stats;

    // Stupid hack. So many stupid hacks.
    if (reinitializeSelectedRounds) {
      $scope.players = [];
      angular.forEach(stats.players, function (playerdata, steamid) {
        $scope.players.push(new Player(playerdata));
      });
    } else {
      var steamidsToSkip = [];
      // Check for existing players that can be updated
      angular.forEach($scope.players, function (player, index) {
        if (stats.players[player.steamid]) {
          player.setData(stats.players[player.steamid]);
          // skip it
          steamidsToSkip.push(player.steamid);
        }
      });
      // Create new player objects for steamids that we don't already have
      angular.forEach(stats.players, function (playerdata, steamid) {
        if (steamidsToSkip.indexOf(steamid) !== -1) {
          return;
        }
        $scope.players.push(new Player(playerdata));
      });
    }

    $scope.redScore = stats.redscore.reduce(function(a,b) { return a + b; },0);
    $scope.bluScore = stats.bluscore.reduce(function(a,b) { return a + b; },0);
    // Score Comparison
    $scope.scoreComparison = $scope.redScore > $scope.bluScore ?
                                                           '>' :
                             $scope.redScore < $scope.bluScore ?
                                                           '<' :
                                                           '==';

    // If redscore.length is greater than the current number of rounds, then
    //  that means a new round just started -- add it to $scope.selectedRounds.
    if (stats.redscore.length > $scope.numRounds) {
      $scope.selectedRounds.push(stats.redscore.length-1);
    }

    var numRounds = $scope.numRounds = stats.redscore.length;

    if (reinitializeSelectedRounds) { $scope.initializeSelectedRoundsArray(); }

    calculateStats();
  };

  var parseLiveUpdate = function(data) {
    var currentRound = $scope.stats.round;
    var newStats = data.stats;

    // Update existing players with new data
    angular.forEach($scope.players, function (player, index) {
      if (newStats.players[player.steamid]) {
        player.setLiveUpdateData(newStats.players[player.steamid]);
        delete(newStats.players[player.steamid]);
      }
    });
    // For each new player create a new Player object
    //  note the difference between steamid and identifier because of the bot thing
    angular.forEach(newStats.players, function (playerdata, identifier) {
      if (!playerdata.mostplayedclass) {
        return;
      }
      var newPlayer = new Player(playerdata, true);
      $scope.stats.players[playerdata.steamid] = playerdata;
      $scope.players.push(newPlayer);
    });

    $scope.stats.roundduration[currentRound] = newStats.roundduration;
    $scope.stats.redscore[currentRound] = newStats.redscore;
    $scope.stats.bluscore[currentRound] = newStats.bluscore;
    $scope.stats.teamfirstcap[currentRound] = newStats.teamfirstcap;


    // If currentRound is greater than $scope.numRounds, then
    //  that means a new round just started -- add it to $scope.selectedRounds.
    if (currentRound > $scope.numRounds-1) {
      $scope.selectedRounds.push(currentRound);
      $scope.numRounds += 1;
      // $scope.initializeSelectedRoundsArray();
    }

    calculateStats();
  };

  var calculateStats = function() {
    var stats = $scope.stats;
    var numRounds = $scope.numRounds;
    // Total playable time
    var playableTime = $scope.playableTime = sumArray(stats.roundduration);

    // Calculate total midfights won for each team
    var totalMidfightsWon = [0,0,0,0];
    var filteredTeamfirstcapArr = filterBySelectedRounds(stats.teamfirstcap);
    for (var j=0; j<numRounds; j++) {
      totalMidfightsWon[ filteredTeamfirstcapArr[j] ] += 1;
    }

    // Calculate total damage and frags for each team
    var totalDamage = [0,0,0,0];
    var totalFrags = [0,0,0,0];
    angular.forEach($scope.players, function(player) {
      totalDamage[player.team] += sumArray(player.damagedone);
      totalFrags[player.team] += sumArray(player.kills);
    });

    // Assemble score overview table rows
    $scope.redRoundScores = stats.redscore.concat($scope.redScore
                                                , totalDamage[2]
                                                , totalFrags[2]
                                                , totalMidfightsWon[2]);
    $scope.bluRoundScores = stats.bluscore.concat($scope.bluScore
                                                , totalDamage[3]
                                                , totalFrags[3]
                                                , totalMidfightsWon[3]);
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
    } else if ($scope.selectedRounds.length === 1 &&
               $scope.selectedRounds[0] === round && !$scope.ctrl) {
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
  $scope.filterBinds = true;
  $scope.bindFilter = function(chat) {
    return (!$scope.filterBinds || !chat.isBind);
  };

  $scope.hasBeenPlayed = function (classId) {
    for (var i = 0, player; player = $scope.players[i]; i++) {
      if (player.playedClasses() & 1 << classId) {
        return true;
      }
    }
    return false;
  };

  var sumArray = $scope.sumArray = function(arr) {
    if (!arr || !arr.length) return 0;
    return filterBySelectedRounds(arr).reduce(function(a,b) { return a + b; },0);
  };
  // The difference between this and sumarray, is that if the values don't exist,
  // sumArray returns `0` and sumArray2 returns `'-'`
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
    // if (denominator === 0) return '&infin;';
    if (denominator === 0) return '∞';
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
  // underscore / lodash result - http://devdocs.io/lodash/index#result
  var result = function(object, key) {
    if (angular.isFunction(object[key])) {
      return object[key]();
    }
    return object[key];
  }
  // var escapeHtml = $scope.escapeHtml = (function () {
  //   var chr = { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' };
  //   return function (text) {
  //     return text.replace(/[\"&<>]/g, function (a) { return chr[a]; });
  //   };
  // })();
  $scope.secondsToHMS = function(seconds) {
    var h = parseInt(seconds/3600, 10);
    var m = parseInt((seconds-h*3600)/60, 10);
    var s = seconds-h*3600-m*60;
    if (h === 0) { return ('0'+m).slice(-2)+':'+('0'+s).slice(-2); }
    return h+':'+('0'+m).slice(-2)+':'+('0'+s).slice(-2);
  };

  // The very first time you load the controller, use the resolvedData.
  parseStats(resolvedData, true);
  // And subscribe to the socket.io room.
  socket.emit('stats:subscribe', $route.current.params.id);

  // hack. FIXME
  $rootScope.statsCtrlIsLoadedSoDontCallResolveFunction = true;
  $scope.$on('$destroy', function() {
    $rootScope.statsCtrlIsLoadedSoDontCallResolveFunction = false;
  });
}
// This is for the first time you load the controller
//  -- so that you don't see all the empty divs and tables.
StatsCtrl.resolve = {
  resolvedData: function($q, $http, $route, $rootScope) {
    // hack. FIXME
    if ($rootScope.statsCtrlIsLoadedSoDontCallResolveFunction) {
      return;
    }
    var deferred = $q.defer();
    $http({
      method: 'GET',
      url: '/api/stats/' + $route.current.params.id
    })
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        // window.alert('Something went wrong.');
        // deferred.reject(data);
        deferred.resolve();
      });
    return deferred.promise;
  }
};

function StatsEditCtrl($scope, $location, $route, $http, socket, resolvedData) {
  $scope.data = {
    redname: resolvedData.stats.redname
  , bluname: resolvedData.stats.bluname
  };

  $scope.saveButton = function() {
    $http.put('/api/stats/' + resolvedData.stats._id, $scope.data)
      .success(function(data, status, headers, config) {
        // TODO: Do something better
        $location.path('/stats/' + resolvedData.stats._id);
      })
      .error(function(data, status, headers, config) {
        console.log(data);
        window.alert('Something went wrong.');
      });

  };

  $scope.deleteButton = function() {
    if ( !window.confirm('Are you sure you want to delete these stats?') ) {
      return false;
    }
    $http.delete('/api/stats/' + resolvedData.stats._id)
      .success(function(data, status, headers, config) {
        // TODO: Do something better
        $location.path( "/" );
      })
      .error(function(data, status, headers, config) {
        // TODO: Do something
        console.log(data);
        window.alert('Something went wrong.');
      });
  };

}
