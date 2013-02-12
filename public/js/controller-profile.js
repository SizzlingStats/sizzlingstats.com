function ProfileCtrl($scope, $rootScope, $location, $http, socket, resolvedData) {
  if (!resolvedData) {
    // do something
  }
  $scope.player = resolvedData.player;
  $scope.player.avatarFull = $scope.player.avatar.slice(0, -4) + '_full.jpg';
  console.log($scope.player.avatarFull);
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
