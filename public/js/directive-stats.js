/*jshint browser: true, globalstrict: true*/
/*global angular, app, console, $*/
'use strict';

app.directive('statsTable', ['$compile', function($compile) {
  return {
    restrict: 'E'
  , scope: {
      data: '&'
    , criteria: '&'
    }

  , controller: function($scope) {
      $scope.sort = {
        col: 0,
        reverse: false
      };
      $scope.sortBy = function(col) {
        // If previously sorting by name (column 0), and clicking a different
        //  column, then set reverse to true.
        if (col === $scope.sort.col ||
            ($scope.sort.col === 0 && !$scope.sort.reverse) ) {
          $scope.sort.reverse = !$scope.sort.reverse;
        }
          $scope.sort.col = col;
      };
      $scope.sortClass = function(col) {
        if ($scope.sort.col === col) {
          return $scope.sort.reverse ? 'sort-true' : 'sort-false';
        }
        return '';
      };
      $scope.sortPredicate = function() {
        return ($scope.sort.reverse ? '-' : '+') +
               $scope.data()[$scope.sort.col][2];
      };
      $scope.classFilter = function(classId) {
        return function(player) {
          return player.playedClasses() & 1 << classId;
        };
      };
    }

  , link: function(scope, element, attrs, ctrl) {
      var data = scope.data(), showClassIcons;
      if (data[1][0] === 'C') { showClassIcons = true; }
      var $table = angular.element('<table class="stats-table">');

      // Table Header
      var $thead = angular.element('<thead>');

      scope.header = function() {
        var header = '<tr class="header">';
        for (var index=0, datum; datum=data[index]; index++) {
          if (index === 0) {
            header += '<th ng-click="sortBy(' + index +
                      ')" ng-class="sortClass(' + index +
                      ')"><acronym>' + datum[0] + '</acronym></th>';
          } else {
            header += '<th class="has-tip tip-top" title="' + datum[1] +
                      '" ng-click="sortBy(' + index +
                      ')" ng-class="sortClass(' + index + ')"><abbr>' +
                      datum[0] + '</abbr></th>';
          }
        }
        return $compile( header + '</tr>' )(scope);
      };
      $table.append( $thead.append( scope.header() ) );


      // Table Body
      var $tbody = scope.$tbody = angular.element('<tbody>');
      scope.rows = function(filter) {
        var row = '<tr ng-repeat="player in $parent.players' +
                  (filter ? ' | filter:' + filter : '') +
                  ' | orderBy:sortPredicate()" stats-tr></tr>';
        return $compile( row )(scope);
      };

      var createSplitTable = ctrl.createSplitTable = function () {
        scope.$tbody.html( scope.rows('{team:2}') );
        scope.$tbody.append( scope.header() );
        scope.$tbody.append( scope.rows('{team:3}') );
      };

      var createCombinedTable = ctrl.createCombinedTable = function () {
        $tbody.html( scope.rows(attrs.filter) );
      };

      if (attrs.filter) {
        createCombinedTable();
      } else {
        // If no attrs.filter, assume this is the main stats table,
        //  which we "split" by default.
        createSplitTable();
      }

      $table.append( $tbody );
      element.prepend( $table );
    }
  };
}]);

app.directive('statsTr', ['$compile', function($compile) {
  return {
    restrict: 'A'
  , link: function(scope, element, attrs) {
      var data = scope.data(), showClassIcons;
      if (data[1][0] === 'C') { showClassIcons = true; }

      var playerRow = '<td class="player-name"><img class="team{{player.team}}' +
                ' avatar" ng-src="{{player.avatar}}" /><span><a ng-href=' +
                '"{{(player.numericid) && \'/player/\'+player.numericid||' +
                '\'\'}}">{{player.name}}</a></span></td>';
      var i = 1;
      if (showClassIcons) {
        i = 2;
        playerRow += '<td><img class="class-icon" ng-src="/img/classicons/' +
                     '{{player.mostPlayedClass()}}.png"></img></td>';
      }
      for (var len=data.length; i<len; i++) {
        playerRow += '<td>{{player.' + data[i][2] + '}}</td>';
      }
      element.html( $compile(playerRow)(scope) );
    }
  };
}]);

app.directive('splitTeams', [function() {
  return {
    restrict: 'A'
  , require: '^statsTable'
  , template: '<dl class="sub-nav no-marg", ng-init="split=true">' +
                '<dd ng-class="{active:split}">' +
                  '<a href="javascript:" ng-click="splitTeams(true)">' +
                    'Teams</a></dd>' +
                '<dd ng-class="{active:!split}">' +
                  '<a href="javascript:" ng-click="splitTeams(false)">' +
                    'All</a></dd></dl>'
  , link: function(scope, element, attrs, statsTableCtrl) {
      scope.splitTeams = function(split) {
        if (split === scope.split) { return; }
        if (split) {
          statsTableCtrl.createSplitTable();
        } else {
          statsTableCtrl.createCombinedTable();
        }
        scope.split = split;
      };
    }
  };
}]);
