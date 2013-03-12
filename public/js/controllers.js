/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

/* Controllers */

function MainCtrl($scope, $rootScope, $route, $location, me) {
  // console.log(me);

  $rootScope.loading = false;
  $scope.showSideBar = true;
  $rootScope.$on('$routeChangeError', function(event, curr, prev, rejection) {
    if (!prev) {
      $location.path('/');
    } else {
      window.history.back();
    }
  });
  $rootScope.$on('$locationChangeStart', function() {
    $rootScope.loading = true;
  });
  $rootScope.$on('$routeChangeSuccess', function() {
    $rootScope.loading = false;
    // TODO: FIXME
    $scope.hideSideBar = !$route.current.$route ||
                  ($route.current.$route.templateUrl === 'partials/player') ||
                  ($route.current.$route.templateUrl === 'partials/profile');
  });
  $scope.isCurrentPath = function(path) {
    return path === $location.path();
  };
}

function SideBarCtrl($scope, $http, $route, socket) {
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
        return;
      }
    }
  });

  $http.get('/api/matches')
    .success(function(data, status, headers, config) {
      $scope.matches = data.matches;
    });

  $scope.isActive = function() {
    return this.match._id === parseInt($route.current.params.id,10);
  };
  $scope.scoreComparison = function(redScore, bluScore) {
    return redScore > bluScore ?
                           '>' :
                           redScore < bluScore ?
                           '<' :
                           '==';
  };
  $scope.score = function(match) {
    return sumArray(match.redscore) + '-' + sumArray(match.bluscore);
  };
  var sumArray = function(array) {
    if (!array || !array.length) return 0;
    return array.reduce(function(a,b) { return a + b; },0);
  };
}
