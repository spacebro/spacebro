(function(){
  'use strict';

  angular
    .module('becky')
    .controller('mainController', function ($io, $timeout, $rootScope, $ionicBackdrop){
      var self = this;

      document.addEventListener('deviceready', function(){
        navigator.geolocation.watchPosition(function(){console.log('watch position')}, function(){console.log('error')}, { enableHighAccuracy: true });
      });

      self.triggers = [
        {trigger: '#supermarche',
        name: 'Supermarche',
        title: 'Supermarché rue de Grenelle',
        message: 'Venez vivre l\’expérience Coca-Cola UEFA EURO 2016™ dans votre magasin'},
        {trigger: '#appartement-shazam',
        name: 'Appartement pub shazam',
        title: 'Fan App Coca-Cola',
        message: 'UEFA EURO 2016™ : Découvrez les vidéos exclusives de la Fan App Coca-Cola !'},
        {trigger: '#dans-la-ville',
        name: 'Dans la ville',
        title: 'Fan App Coca-Cola',
        message: 'Jeu Coca-Cola / UEFA EURO 2016™ \n Encourage ton équipe et gagne le ballon du match !',},
        {trigger: '#fan-zone-precommande',
        name: 'Fan Zone Precommande',
        title: 'Fan App Coca-Cola',
        message: 'Pré-commandez votre boisson grâce à la Fan App Coca-Cola !'},
        {trigger: '#bar',
        name: 'Bar Wifi',
        title: 'LE FRANCOEUR – 20 rue Custine 75018 Paris',
        message: 'Connectez-vous au wifi by Coca-Cola et accédez à des contenus et services exclusifs !'},
        {trigger: '#appartement-mi-temps',
        name: 'Appartement mi-temps',
        title: 'Fan App Coca-Cola',
        message: 'C\'est la mi-temps du match, votre menu supporter à prix réduit grâce au code #CokeEURO2016'},
        {trigger: '#fan-zone-selfie',
        name: 'Fan Zone Selfie',
        title: 'Fan App Coca-Cola',
        message: 'La tribune virtuelle Coca-Cola\n Prenez une photo et postez la sur le mur d’écrans géants !'},
      ];

      self.original = angular.copy(self.triggers);

      var team = $rootScope.group;

      self.triggerEvent = function(trigger){
        console.log(team + trigger.trigger);
        $io.emit( team + trigger.trigger, {msg: trigger.message, title: trigger.title});
        checkItem(trigger);
      }

      function checkItem (trigger) {
        trigger.status = 'loading';
        $timeout( function() {
          trigger.status = 'checked';
        }, 1000);
      }

      self.restart = function() {
        console.log('restart');
        //$ionicBackdrop.retain();
        self.backdrop = true;
      }

      self.confirmRestart = function() {
        self.triggers = angular.copy(self.original);
        $rootScope.counter = 0;
        $ionicBackdrop.release();
        self.backdrop = false;
      }

      self.negateRestart = function() {
        $ionicBackdrop.release();
        self.backdrop = false;
      }
    });
})();
