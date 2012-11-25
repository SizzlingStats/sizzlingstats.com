'use strict';

/* Directives */


// angular.module('myApp.directives', []).
//   directive('appVersion', ['version', function(version) {
//     return function(scope, elm, attrs) {
//       elm.text(version);
//     };
//   }]);

angular.module('myApp.directives', []).
  directive('tooltip', function() {
    return {
      link: function(scope, element, attrs)
      {
        $(element)
        	.attr('title', attrs.tooltip)
      		.tooltip({placement: "top"});
      }
    };
  });
