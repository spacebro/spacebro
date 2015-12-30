'use strict'

const fs = require('fs')
const config = require('../config.json')
let socket = require('socket.io-client')('http://localhost:' + config.server.port)

fs.readFile(__dirname + '/sample.png', {encoding: 'base64'}, (err, base64) => {
  if (err) {
    console.err(err)
    process.exit()
  }
  socket.emit('write-img', base64)
  // process.exit()
})
