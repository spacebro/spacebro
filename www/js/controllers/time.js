(function(){
  'use strict';

  angular
  	.module('becky')
	.run(function($rootScope) {
	    $rootScope.counter = 0;
      $rootScope.group = 'A';
      $rootScope.selectGroup = function(group) {
        $rootScope.group = group;
      }
      $rootScope.currentGroup = function(group) {
        return $rootScope.group = group;
      }
	})
    .controller('timeController', function($rootScope, $scope, $state, $interval) {

        $scope.clockFormat = 'hh:mm';
        $scope.counter = $rootScope.counter;
        $scope.cokeCounter = "00:00";

        $scope.start = function() {
        	console.log('timer started');
        	$state.go('app.bar.location');
        	$scope.startTimer();
        }

        var stop;
        $scope.startTimer = function() {
          // Don't start the timer if it's already started
          if ( angular.isDefined(stop) ) return;

          stop = $interval(function() {
            $scope.counter = $scope.counter + 1;
            $scope.cokeCounter = formatCounter();
            //multiple counter, I don't know why :/
            var counters = document.getElementsByClassName('counter-timer');
            /*counters.foreach ( function(elCounter){
              elCounter.innerHTML = $scope.cokeCounter;
            });*/
            counters[0].innerHTML = formatCounter();
            counters[1].innerHTML = formatCounter();
            
            // console.log($scope.cokeCounter);
          }, 1000);
        };

        $scope.stopTimer = function() {
          if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
          }
        };

        $scope.reset = function() {
          $scope.stopTimer();
          $scope.counter = 0;
          $rootScope.counter = 0;
          console.log('reset');
        };

        function formatCounter() {
        	var count = $scope.counter;

        	var min = Math.round(count / 60);
        	if ( min < 10 )
        		min = "0"+min;
        	var sec = count % 60;
        	if ( sec < 10 )
        		sec = "0"+sec;
        	var string = min+":"+sec;
        	return string;
        }


      })
    // Register the 'currentTime' directive factory method.
    // We inject $interval and dateFilter service since the factory method is DI.
    .directive('currentTime', ['$interval', 'dateFilter',
      function($interval, dateFilter) {
        // return the directive link function. (compile function not needed)
        return function(scope, element, attrs) {
          var clockFormat,  // date format
              stopTime; // so that we can cancel the time updates

          // used to update the UI
          function updateTime() {
            element.text(dateFilter(new Date(), clockFormat));
          }

          // watch the expression, and update the UI on change.
          scope.$watch(attrs.currentTime, function(value) {
            clockFormat = value;
            updateTime();
          });

          stopTime = $interval(updateTime, 1000);

          // listen on DOM destroy (removal) event, and cancel the next UI update
          // to prevent updating time after the DOM element was removed.
          element.on('$destroy', function() {
            $interval.cancel(stopTime);
          });
        }
      }]);
})();
