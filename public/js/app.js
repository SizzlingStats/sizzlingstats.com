'use strict';

// Declare app level module which depends on filters, and services
// var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
var app = angular.module('myApp', ['myApp.services','myApp.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/stats', {
        templateUrl: 'partials/stats',
        controller: StatsCtrl,
        resolve: StatsCtrl.resolve,
        reloadOnSearch: false
      })
      .when('/about', {
        templateUrl: 'partials/about',
        reloadOnSearch: true
      })
      .otherwise({
        redirectTo: '/',
        templateUrl: 'partials/home',
        reloadOnSearch: true
      });
    $locationProvider.html5Mode(true);
  }]);
