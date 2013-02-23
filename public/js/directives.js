/*jshint browser: true, globalstrict: true*/
/*global angular, console, $*/
'use strict';

/* Directives */
angular.module('myApp.directives', [])
  .directive('statsTable', function($compile) {
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
          if (col === $scope.sort.col || ($scope.sort.col === 0 && !$scope.sort.reverse) ) {
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
          return ($scope.sort.reverse ? '-' : '+') + $scope.data()[$scope.sort.col][2];
        };
        $scope.classFilter = function(classId) {
          return function(player) {
            return player.playedClasses() & 1 << classId;
          };
        };
        $scope.hasBeenPlayed = function(classId) {
          var hasBeenPlayed = false;
          angular.forEach($scope.$parent.players, function(player) {
            if (player.playedClasses() & 1 << classId) {
              hasBeenPlayed = true;
            }
          });
          return hasBeenPlayed;
        };
      }

    , link: function(scope, element, attrs) {
        var data = scope.data(), criteria = scope.criteria(), showClassIcons;
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
          var row = '<tr ng-repeat="player in $parent.playersArr' +
                    (filter ? ' | filter:' + filter : '') +
                    ' | orderBy:sortPredicate()" stats-tr></tr>';
          return $compile( row )(scope);
        };
        $tbody.append( scope.rows(attrs.filter) );

        $table.append( $tbody );
        element.prepend( $table );
      }
    };
  })
  .directive('statsTr', function() {
    return {
      restrict: 'A'
    , link: function(scope, element, attrs) {
        var data = scope.data(), showClassIcons;
        if (data[1][0] === 'C') { showClassIcons = true; }

        var playerRow = '<td class="player-name"><img class="team' +
                  scope.player.team + '-avatar" src="' +
                  (scope.player.avatar || '') + '" /><span><a href="/player/' +
                  (scope.player.numericid || '') + '">' +
                  scope.$parent.$parent.escapeHtml(scope.player.name) + '</a></span></td>';
        var i = 1;
        if (showClassIcons) {
          i = 2;
          playerRow += '<td><img class="class-icon" src="/img/classicons/' +
                       scope.player.mostPlayedClass() + '.png"></img></td>';
        }
        for (var len=data.length; i<len; i++) {
          playerRow += '<td>' + eval("scope.player." + data[i][2]) + '</td>';
        }
        element.html(playerRow);
      }
    };
  })
  .directive('splitTeams', function() {
    return {
      restrict: 'A'
    , template: '<dl class="sub-nav no-marg", ng-init="split=false">' +
                  '<dd ng-class="{active:!split}">' +
                    '<a href="javascript:" ng-click="splitTeams(false)">' +
                      'All</a></dd>' +
                  '<dd ng-class="{active:split}">' +
                    '<a href="javascript:" ng-click="splitTeams(true)">' +
                      'Teams</a></dd></dl>'
    , link: function(scope, element, attrs) {
        scope.splitTeams = function(split) {
          if (split === scope.split) { return; }
          scope.$tbody.empty();
          if (split) {
            scope.$tbody.append( scope.rows('{team:2}') );
            scope.$tbody.append( scope.header() );
            scope.$tbody.append( scope.rows('{team:3}') );
          } else {
            scope.$tbody.append( scope.rows() );
          }
          scope.split = split;
        };
      }
    };
  })
  .directive('typeahead', function() {
    return {
      restrict: 'A'
    , link: function(scope, element, attrs) {
        $(element).typeahead({
          name: 'sample'
        , local: [
            {
              value: 'There is nothing here yet.'
            , tokens: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
            }
          ]
        });
      }
    };
  });