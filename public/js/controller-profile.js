function ProfileCtrl($scope, $rootScope, $location, $http, socket, resolvedData) {
  if (!resolvedData) {
    // do something
  }
  var PAGE_SIZE = 10;

  $scope.player = resolvedData.player;
  $scope.player.avatarFull = $scope.player.avatar.slice(0, -4) + '_full.jpg';
  $scope.matches = resolvedData.matches;
  
  $scope.count = resolvedData.count;
  $scope.pageNumCurrent = 1;
  $scope.pageNumLast = Math.ceil( $scope.count / PAGE_SIZE );

  $scope.pages = [{num: 1, isCurrent: true}];
  for (var i=2; i<=$scope.pageNumLast; i++) {
    $scope.pages.push({
      num: i
    });
  }


  $scope.clickPageNumber = function(index) {
    if ($scope.pages[index].isCurrent) { return; }
    $http.get('/api/player/' + $scope.player._id + '/matches?currentmatch=' +
              $scope.matches[0]._id + '&skip=' + ($scope.pages[index].num - $scope.pageNumCurrent) * 10 )
    .success(function(data, status, headers, config) {
        $scope.matches = data.matches;
        $scope.pages[$scope.pageNumCurrent-1].isCurrent = false;
        $scope.pages[index].isCurrent = true;
        $scope.pageNumCurrent = $scope.pages[index].num;
    }).error(function(data, status, headers, config) {
      // Do something
        // $scope.status = status;
    });
  };

}
// This is for the first time you load the controller
//  -- so that you don't see all the empty divs and tables.
ProfileCtrl.resolve = {
  resolvedData: function($q, $http, $route) {
    var deferred = $q.defer();
    $http({
      method: 'GET',
      url: '/api/player/' + $route.current.params.id
    })
      .success(function(data) {
        deferred.resolve(data);
      })
      .error(function(data) {
        deferred.reject(data);
      });
    return deferred.promise;
  }
};
