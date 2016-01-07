'use strict'

const spacebroClient = require('spacebro-client')

var actionList = [
  {
    name: 'shoot',
    trigger: function (data) {
      console.log('shoot')
    }
  },
  {
    name: 'stop',
    trigger: function (data) {
      console.log('stop')
    }
  }
]

actionList.push({name: 'new-media'})
spacebroClient.registerToMaster(actionList, 'spacebro-testclient')

setInterval(function () {
  spacebroClient.emit('new-media', {data: 'foo'})
}, 2000)
