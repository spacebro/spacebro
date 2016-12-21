'use strict'

const spacebroClient = require('spacebro-client')

spacebroClient.connect('127.0.0.1', 8888, {
  clientName: 'foo',
  channelName: 'bar'
})

setInterval(() => {
  spacebroClient.emit('ping')
}, 1000)
