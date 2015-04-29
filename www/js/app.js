(function(){
  'use strict';

  angular
    .module('becky', ['ionic'])
    .config(function ($stateProvider, $urlRouterProvider){
      $stateProvider
        .state('app', {
          url: "/app",
          abstract: true,
          templateUrl: 'partials/menu.html',
        })
        .state('app.bar', {
          url: '/bar',
          //abstract: true,
          views: {
            'menuContent': {
              templateUrl: 'partials/bar.html',
            }
          }
        })
        .state('app.bar.debut', {
          url: '/debut',
          views: {
            'bar-view': {
              templateUrl: 'partials/bar-debut.html'
            }
          }
        })
        .state('app.bar.location', {
          url: '/location',
          views: {
            'bar-view': {
              templateUrl: 'partials/bar-location.html'
            }
          }
        });
        $urlRouterProvider.otherwise('app/bar/debut');
    })
    .run(function($ionicPlatform) {
      $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if(window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if(window.StatusBar) {
          StatusBar.styleDefault();
        }
      });
    })
    .factory('$io', function (config){
      return io('http://' + config.server.address + ':' + config.server.port);
    });
})();
