/*jshint browser: true, globalstrict: true*/
/*global angular, console, app*/
'use strict';

app.controller('SettingsCtrl', ['$scope', '$http', 'resolveData'
                            , function($scope, $http, resolveData) {
  $scope.player = resolveData;

  $scope.generateKey = function() {
    // If the player already has an apikey, make him confirm that he wants to
    //  change it.
    if ($scope.player.apikey) {
      if ( !window.confirm('This will delete your current key, are you sure?') ) {
        return;
      }
    }

    $http.get('/api/generatekey')
      .success(function(data) {
        $scope.player.apikey = data;
      })
      .error(function(data) {
        window.alert('something went wrong.');
      });
  };

}]);

app.factory('SettingsCtrlResolveData', ['$q', '$http', function($q, $http) {
  var deferred = $q.defer();
  $http.get('/api/settings')
    .success(function(data) {
      deferred.resolve(data);
    })
    .error(function(data) {
      window.alert('Something went wrong.');
      deferred.reject(data);
    });
  return deferred.promise;
}]);
