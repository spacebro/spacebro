'use strict'

const config = require('../config.json')
const colors = require('colors')
let io

io = require('socket.io')(config.server.port)
io.on('connection', function (socket) {
  console.log('connection'.bold.green)

  let emitInterval = setInterval(() => {
    socket.emit('server-event', {stringData: "foo", intData: 5})
  }, 2000)

  socket.on('disconnect', () => {
    clearInterval(emitInterval)
  })
})

