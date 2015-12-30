'use strict'

const config = require('../config.json')
let socket = require('socket.io-client')('http://localhost:' + config.server.port)

for (let event of config.events) {
  socket.on(event, function (datas) {
    console.log('send-events.js - event %s triggered with datas: %s', event, datas)
  })

  setTimeout(function () {
    if (event === 'event-2') {
      socket.emit(event, {event: 2})
    } else {
      socket.emit(event)
    }
  }, 500)
}
