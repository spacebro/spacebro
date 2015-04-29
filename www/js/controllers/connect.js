(function(){
  'use strict';

  angular
    .module('becky')
    .controller('connectionController', function ($scope, $interval){

      $scope.show = true;
      $scope.messages = [
        { connect: 'disconnect', message: 'Your device lost it\'s internet connection' },
        { connect: 'reconnect', message: 'Attempting to reconnect...' },
        { connect: 'connect', message: 'Your device is connected to the internet.' }]
      $scope.connect = '';
      $scope.message = '';

      $scope.setStatus = function(num) {
        $scope.connect = $scope.messages[num].connect;
        $scope.message = $scope.messages[num].message;        
      }

      $scope.showBar = function(bool) {
        $scope.show = bool;
      }

      $scope.connect = function() {
        var i=0;
        $interval( function() {
          if ( i < 3 ) {
            $scope.setStatus(2);
            i++;
          }
          else {
            $scope.showBar(false);
          }
        }, 2000, 4);
      }
    });
})();
