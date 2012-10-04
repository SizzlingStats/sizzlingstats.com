'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider
      .when('/match/:id', {
        templateUrl: 'partials/stats',
        controller: StatsCtrl,
        resolve: StatsCtrl.resolve
      })
      .when('/about', {
        templateUrl: 'partials/about'
        // controller: AboutCtrl
      })
      // .when('/view1', {
      //   templateUrl: 'partials/partial1',
      //   controller: MyCtrl1
      // })
      // .when('/view2', {
      //   templateUrl: 'partials/partial2',
      //   controller: MyCtrl2
      // })
      .otherwise({
        redirectTo: '/',
        templateUrl: 'partials/home'
        // controller: HomeCtrl
      });
    $locationProvider.html5Mode(true);
  }]);