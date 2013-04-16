/*jshint browser: true, globalstrict: true*/
/*global angular, console, app, google, jQuery*/
'use strict';

app.controller('UsageStatsCtrl', ['$scope', 'resolveData'
                               , function($scope, resolveData) {

  $scope.playerCount = resolveData.playerCount;
  $scope.matchCount = resolveData.matchCount;

  // Map Stuff
  var data = resolveData.geoips;
  console.log(data);
  var mapOptions = {
    zoom: 1
  , center: new google.maps.LatLng(0, 0)
  , disableDefaultUI: true
  , mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var usersMap = new google.maps.Map(document.getElementById("map-canvas-users"), mapOptions);
  var tf2serversMap = new google.maps.Map(document.getElementById("map-canvas-tf2servers"), mapOptions);

  var usersHeatmapData = [];
  var tf2serversHeatmapData = [];
  var users, tf2servers, latLng;

  if (data[0]._id === 'users') {
    users = data[0].geoips;
    tf2servers = data[1].geoips;
  } else {
    users = data[1].geoips;
    tf2servers = data[0].geoips;
  }

  // Create LatLng points
  for (var i=0, user; user=users[i]; ++i) {
    latLng = new google.maps.LatLng(user.latitude, user.longitude);
    usersHeatmapData.push(latLng);
  }
  for (var j=0, tf2server; tf2server=tf2servers[j]; ++j) {
    latLng = new google.maps.LatLng(tf2server.latitude, tf2server.longitude);
    tf2serversHeatmapData.push(latLng);
  }

  var usersHeatmap = new google.maps.visualization.HeatmapLayer({
    data: usersHeatmapData
  , dissipating: true
  , map: usersMap
  });
  var tf2serversHeatmap = new google.maps.visualization.HeatmapLayer({
    data: tf2serversHeatmapData
  , dissipating: true
  , map: tf2serversMap
  });

}]);

app.factory('UsageStatsResolve', ['$q', '$http', function($q, $http) {
  var deferred = $q.defer();

  $http.get('/api/analytics')
    .success(function(data) {
      deferred.resolve(data);
    })
    .error(function(data) {
      window.alert('Something went wrong.');
      deferred.reject(data);
    });

  return deferred.promise;
}]);

app.factory('GoogleMaps', ['$q', '$rootScope', function($q, $rootScope) {
  var deferred = $q.defer();

  window.initializeMapScript = function () {
    $rootScope.$apply(function () {
      deferred.resolve(true);
    });
  };

  var url = 'http://maps.googleapis.com/maps/api/js?libraries='
          + 'geometry,visualization&sensor=false&callback=initializeMapScript';
  jQuery.getScript(url)
    .done(function (script, textStatus) {
    })
    .fail(function (jqxhr, settings, exception) {
      window.alert('Something went wrong.');
      deferred.reject(jqxhr);
    });

  return deferred.promise;
}]);
