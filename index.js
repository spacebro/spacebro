'use strict'

const fs = require('fs')
const _ = require('lodash')
const mdns = require('mdns')
const colors = require('colors')
const shortid = require('shortid')
const pathHelper = require('path')
const config = require('./config.json')
let io = require('socket.io')(config.server.port)

console.log('Chywalry - listening on port', config.server.port)

var Table = require('cli-table')

// instantiate
var table = new Table({
  head: ['Clients', 'Events registered', 'Status'],
  colWidths: [22, 30, 16]
})

var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
ad.start()

io.on('connection', function (socket) {
  console.log('connection'.bold.green)
  socket
    .on('disconnect', function () {
      console.log('disconnect'.bold.red)
      updateTable()
    })
    .on('error', function (err) {
      console.log('server.js - socket error: %s'.bold.red, err)
    })
    .on('register', function (data) {
      data.eventsList = data.eventsList || []
      socket.clientName = (data.clientName === undefined) ? socket.id : data.clientName
      socket.eventsListRegistered = data.eventsList.join(',') || 'n.a'
      registerEventsAndAdd(data.eventsList, socket)
      updateTable()
    })

  for (let event of config.events) {
    socket.on(event, function (datas) {
      console.log('server.js - event %s triggered with datas: %s', event, datas)
      io.emit(event, datas)
    })
  }
})

var registerEventsAndAdd = function (eventsList, socket) {
  if (eventsList !== undefined){
    for (let triggerName of eventsList) {
      config.events = _.union(config.events, [triggerName])
      socket.on(triggerName, function (datas) {
        console.log('index.js - event %s triggered with datas: %s', triggerName, datas)
        io.emit(triggerName, datas)
      })
    }
  }
}

var updateTable = function () {
  table.length = 0
  for (let socket of io.sockets.sockets) {
    if (socket.clientName && socket.eventsListRegistered){
      table.push([socket.clientName, socket.eventsListRegistered, socket.connected ? 'online' : 'offline']) 
    }
  }
  console.log(table.toString())
}
