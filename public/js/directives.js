'use strict';

/* Directives */
angular.module('myApp.directives', [])
  .directive('statsTable', function() {
    return {
      restrict: 'A',
      
      controller: function($scope) {
        $scope.sort = 'name';
        $scope.reverse = false;
        $scope.sortBy = function(col) {
          // If previously sorting by 'name', and clicking a different column, then
          //  set reverse to true.
          if (col === $scope.sort || ($scope.sort === 'name' && !$scope.reverse) ) {
            $scope.reverse = !$scope.reverse;
          }
          $scope.sort = col;
        };
        $scope.sortClass = function(col) {
          if ($scope.sort === col) {
            return $scope.reverse ? 'sort-true' : 'sort-false';
          }
          return '';
        };
      },

      link: function(scope, element, attrs) {

        var data = scope[attrs.data], showClassIcons;
        if (data[0][0] === 'C') { showClassIcons = true; }

        var thead = angular.element('<thead>');
        var header = angular.element('<tr>');
        var nameHeader = angular.element('<th><acronym>' + attrs.name + '</acronym></th>');
        nameHeader.bind('click', function() {
          scope.sortBy('name');
          angular.element(this).parent().children().removeClass('sort-true sort-false');
          angular.element(this).addClass(scope.sortClass('name'));
        });
        header.append(nameHeader);


        angular.forEach(data, function(datum, index) {
          var cell = angular.element('<th class="has-tip tip-top" title="' + datum[1] + '"><abbr>' + datum[0] + '</abbr></th>');
          cell.bind('click', function() {
            scope.sortBy(index);
            angular.element(this).parent().children().removeClass('sort-true sort-false');
            angular.element(this).addClass(scope.sortClass(index));
          });
          header.append(cell);
        });

        element.append(thead.append(header));


        var body = '<tbody>';

        angular.forEach(scope.players, function(player) {
          body += '<tr><td class="player-name"><img class="team' + player.team + '-avatar" src="' +
                  (player.avatar || '') + '" /><span><a href="/player/' +
                  (player.numericid || '') + '">' + scope.escapeHtml(player.name) + '</a></span></td>';
          var i = 0;
          if (showClassIcons) {
            i = 1;
            body += '<td><img class="class-icon" src="/img/classicons/' + player.mostPlayedClass() +
                    '.png"></img></td>';
          }
          for (var len=data.length; i<len; i++) {
            body += '<td>' + eval("player." + data[i][2]);
          }
          body += '</tr>';
        });

        element.append( angular.element(body + '</tbody') );




        scope.$watch('selectedRounds', function(asdf) {
          // var cells = '<td class="player-name"><img class="team' + scope.player.team + '-avatar" src="' +
          //     (scope.player.avatar || '') + '" /><span><a href="/player/' +
          //     (scope.player.numericid || '') +'">' + scope.escapeHtml(scope.player.name) + '</a>' +
          //     '</span><td><img class="class-icon" src="/img/classicons/' + scope.player.mostPlayedClass() +
          //     '.png"></img><td>' + scope.player.stats().join('</td><td>') + '</td>';


          // element.empty().append( angular.element(cells) );
        });
      }
    };
  });
