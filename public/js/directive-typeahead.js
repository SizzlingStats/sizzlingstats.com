/*jshint browser: true, globalstrict: true*/
/*global angular, app, console, $*/
'use strict';

app.directive('typeahead', ['$location', function($location) {
  return {
    restrict: 'A'
  , link: function(scope, element, attrs) {
      $(element).typeahead({
        name: 'players'
      // , prefetch: 'something.json'
      , limit: 10
      , remote: '/api/playersearch?q=%QUERY'
      , selectionCallback: function(query, numericid) {
          $location.path( "player/"+numericid );
          scope.$apply();
        }
      });
    }
  };
}]);
