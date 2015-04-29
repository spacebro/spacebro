(function(){
  'use strict';

  angular
    .module('becky')
    .constant('config', {
      "server": {
        "address": '192.168.1.16',
        "port": 8888,
      }
    })
})();