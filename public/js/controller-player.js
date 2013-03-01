/*jshint browser: true, globalstrict: true*/
/*global angular, console*/
'use strict';

function PlayerCtrl($scope, $rootScope, $location, $http, socket, resolvedData) {
  var PAGE_SIZE = 10;
  var NUM_ADJACENT_PAGES = 2;
  var MAX_NUM_PAGES = 9;

  $scope.player = resolvedData.player;
  $scope.matches = resolvedData.matches;
  $scope.count = resolvedData.count;
  $scope.pageNumCurrent = 1;
  $scope.pageNumLast = Math.floor( $scope.count / PAGE_SIZE + 1);
  $scope.pages = [];


  function Page(num) {
    this.num = num;
  }
  Page.prototype.isCurrent = function() {
    return this.num === $scope.pageNumCurrent;
  };

  // Build the pagination ul
  var buildPagination = function() {
    $scope.pages = [];
    if ($scope.pageNumLast <= MAX_NUM_PAGES) {
      // Not enough pages to bother breaking it up
      for (var i=1; i<=$scope.pageNumLast; i++) {
        $scope.pages.push(new Page(i));
      }
    } else if ($scope.pageNumCurrent + NUM_ADJACENT_PAGES <= MAX_NUM_PAGES - 2) {
      // Close to beginning; only hide later pages
      for (var i=1; i<=MAX_NUM_PAGES-2; i++) {
        $scope.pages.push(new Page(i));
      }
      // $scope.pages.push(new Page('&hellip;'));
      $scope.pages.push(new Page('…'));
      $scope.pages.push(new Page($scope.pageNumLast));
    } else if ($scope.pageNumLast - $scope.pageNumCurrent +
                   1 + NUM_ADJACENT_PAGES <= MAX_NUM_PAGES - 2) {
      // Close to end; only hide earlier pages
      $scope.pages.push(new Page(1));
      $scope.pages.push(new Page('…'));
      for (var i=$scope.pageNumLast - (MAX_NUM_PAGES - NUM_ADJACENT_PAGES*2 + 1);
               i<=$scope.pageNumLast; i++) {
        $scope.pages.push(new Page(i));
      }
    } else {
      // In the middle; hide earlier and later pages
      $scope.pages.push(new Page(1));
      $scope.pages.push(new Page('…'));
      for (var i=$scope.pageNumCurrent-NUM_ADJACENT_PAGES;
               i<=$scope.pageNumCurrent+NUM_ADJACENT_PAGES; i++) {
        $scope.pages.push(new Page(i));
      }
      $scope.pages.push(new Page('…'));
      $scope.pages.push(new Page($scope.pageNumLast));
    }
  };
  buildPagination();

  $scope.clickPageNumber = function(index) {
    if (this.page.isCurrent()) { return; }
    if (this.page.num === '…') {
      // BINARY SEARCH WOOOOO
      goToPage(Math.floor(
                  ($scope.pages[index+1].num + $scope.pages[index-1].num) / 2) );
    } else {
      goToPage(this.page.num);
    }
  };
  $scope.clickPageLeft = function() {
    goToPage($scope.pageNumCurrent-1);
  };
  $scope.clickPageRight = function() {
    goToPage($scope.pageNumCurrent+1);
  };

  var goToPage = function(pageNum) {
    if (pageNum < 1 || pageNum > $scope.pageNumLast) { return false; }
    $http.get('/api/player/' + $scope.player._id + '/matches?currentmatch=' +
              $scope.matches[0]._id + '&skip=' +
              (pageNum - $scope.pageNumCurrent) * PAGE_SIZE )
    .success(function(data, status, headers, config) {
        $scope.matches = data.matches;
        $scope.pageNumCurrent = pageNum;
        buildPagination();
    }).error(function(data, status, headers, config) {
      // Do something
    });
  };

}
// This is for the first time you load the controller
//  -- so that you don't see all the empty divs and tables.
PlayerCtrl.resolve = {
  resolvedData: function($q, $http, $route) {
    var deferred = $q.defer();
    $http({
      method: 'GET',
      url: '/api/player/' + $route.current.params.id
    })
      .success(function(data) {
        if (data === 'false') {
          deferred.reject(data);
        } else {
          deferred.resolve(data);
        }
      })
      .error(function(data) {
        deferred.reject(data);
      });
    return deferred.promise;
  }
};
