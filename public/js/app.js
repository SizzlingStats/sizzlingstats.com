/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

// Declare app level module which depends on filters, and services
// var app = angular.module('myApp', ['myApp.services', 'myApp.directives'])
var app = angular.module('myApp', ['ngRoute', 'myApp.services'])
  .config(['$routeProvider', '$locationProvider'
                           , function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'partials/home'
      , reloadOnSearch: true
      })
      .when('/stats/', {
        redirectTo: '/'
      })
      .when('/stats/:id', {
        templateUrl: 'partials/stats'
      , controller: StatsCtrl
      , resolve: StatsCtrl.resolve
      , reloadOnSearch: false
      })
      .when('/stats/:id/edit', {
        templateUrl: 'partials/stats/edit'
      , controller: StatsEditCtrl
      , resolve: StatsCtrl.resolve
      , reloadOnSearch: true
      })
      .when('/player/', {
        redirectTo: '/'
      })
      .when('/player/:id', {
        templateUrl: 'partials/player'
      , controller: PlayerCtrl
      , resolve: PlayerCtrl.resolve
      , reloadOnSearch: true
      })
      .when('/profile', {
        templateUrl: 'partials/profile'
      , controller: 'ProfileCtrl'
      , resolve: {
          resolveData: 'ProfileCtrlResolveData'
        }
      })
      .when('/about', {
        templateUrl: 'partials/about'
      })
      .when('/download', {
        templateUrl: 'partials/download'
      })
      .otherwise({
        redirectTo: '/'
      });
    $locationProvider.html5Mode(true);
  }]);
