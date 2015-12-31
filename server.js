'use strict'

const fs = require('fs')
const _ = require('lodash')
const mdns = require('mdns')
const colors = require('colors')
const shortid = require('shortid')
const pathHelper = require('path')
const config = require('./config.json')
const imagemagick = require('imagemagick-native')
let io = require('socket.io')(config.server.port)

console.log('server.js - listening on port', config.server.port)

var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
ad.start()

io.on('connection', function (socket) {
  console.log('connection'.bold.green)
  socket
    .on('disconnect', function () {
      console.log('disconnect'.bold.red)
    })
    .on('error', function (err) {
      console.log('server.js - socket error: %s'.bold.red, err)
    })

  for (let event of config.events) {
    socket.on(event, function (datas) {
      console.log('server.js - event %s triggered with datas: %s', event, datas)
      io.emit(event, datas)
    })
  }
})
