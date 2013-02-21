/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

/* Directives */
angular.module('myApp.directives', [])
  .directive('statsTable', function($compile) {
    return {
      restrict: 'A',
      scope: {
        data: '&'
      , criteria: '&'
      },

      controller: function($scope) {
        $scope.sort = {
          col: 0,
          reverse: false
        };
        $scope.sortBy = function(col) {
          // If previously sorting by name (column 0), and clicking a different
          //  column, then set reverse to true.
          $scope.$apply( function() {
            if (col === $scope.sort.col || ($scope.sort.col === 0 && !$scope.sort.reverse) ) {
              $scope.sort.reverse = !$scope.sort.reverse;
            }
            $scope.sort.col = col;
          });
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
        $scope.otherCriteria = function(criteria) {
          return criteria.sort ? criteria.property : '';
        };
        $scope.classFilter = function(player) {
          return player.playedClasses() & 1 << $scope.classToFilter;
        };
      },

      link: function(scope, element, attrs) {
        var data = scope.data(), criteria = scope.criteria(), showClassIcons;
        scope.classToFilter = parseInt(attrs.classToFilter,10);
        if (data[1][0] === 'C') { showClassIcons = true; }

        // Table Header
        var $thead = angular.element('<thead>');
        var $header = angular.element('<tr>');

        angular.forEach(data, function(datum, index) {
          var $cell;
          if (index === 0) {
            $cell = angular.element('<th><acronym>' + datum[0] + '</acronym></th>');
          } else {
            $cell = angular.element('<th class="has-tip tip-top" title="' +
                            datum[1] + '"><abbr>' + datum[0] + '</abbr></th>');
          }
          $cell.addClass(scope.sortClass(index));
          $cell.bind('click', function() {
            scope.sortBy(index);
            angular.element(this).parent().children().removeClass('sort-true sort-false');
            angular.element(this).addClass(scope.sortClass(index));
          });
          $header.append($cell);
        });

        element.append($thead.append($header));


        // Table Body
        var $tbody = angular.element('<tbody>');
        var rows = '<tr ng-repeat="player in $parent.playersArr | ' +
                   (attrs.classToFilter ? 'filter:classFilter | ' : '') +
                   'orderBy:[' +
                   (scope.criteria() ? 'otherCriteria(criteria()),' : '') +
                   'sortPredicate()]" stats-tr></tr>';
        $tbody.append( $compile(rows)(scope) );

        element.append( $tbody );
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
  });