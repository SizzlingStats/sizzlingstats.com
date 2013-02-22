/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

// Declare app level module which depends on filters, and services
// var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
var app = angular.module('myApp', ['myApp.services', 'myApp.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/stats/:id', {
        templateUrl: 'partials/stats',
        controller: StatsCtrl,
        resolve: StatsCtrl.resolve,
        reloadOnSearch: false
      })
      .when('/about', {
        templateUrl: 'partials/about',
        reloadOnSearch: true
      })
      .when('/download', {
        templateUrl: 'partials/download',
        reloadOnSearch: true
      })
      .when('/player/:id', {
        templateUrl: 'partials/profile',
        controller: ProfileCtrl,
        resolve: ProfileCtrl.resolve,
        reloadOnSearch: true
      })
      .otherwise({
        redirectTo: '/',
        templateUrl: 'partials/home',
        reloadOnSearch: true
      });
    $locationProvider.html5Mode(true);
  }]);
