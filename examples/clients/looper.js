'use strict'

const spacebroClient = require('../../../spacebro-client')
// const spacebroClient = require('spacebro-client')

spacebroClient.connect('127.0.0.1', 8888, {
  clientName: 'foo',
  channelName: 'bar',
  verbose: true
})

spacebroClient.on('hello', () => {
  setTimeout(() => {
    console.log('looper.js - hello world')
    spacebroClient.emit('hello')
  }, 1000)
})

setTimeout(() => { spacebroClient.emit('hello') }, 1000)
