'use strict'

const _ = require('lodash')
const mdns = require('mdns')
const colors = require('colors')
let defaultSocketEvent = ['disconnect', 'error', 'register']
let io
let config
let sockets = []

var Table = require('cli-table')

// instantiate
var table = new Table({
  head: ['Clients', 'Events registered', 'Status'],
  colWidths: [22, 30, 16]
})

var _initBroadcast = function (config) {
  var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
  ad.start()
}

var _initSocketIO = function (config) {
  io = require('socket.io')(config.server.port)
  io.on('connection', function (socket) {
    console.log('connection'.bold.green)
    sockets.push(socket)
    socket
      .on('disconnect', function () {
        console.log('disconnect'.bold.red)
        sockets.splice(sockets.indexOf(socket), 1)
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
        updateOtherSockets()
        updateTable()
      })

    for (let event of config.events) {
      socket.on(event, function (datas) {
        console.log('index.js - config event ' + event + ' triggered with datas: ', datas)
        io.emit(event, datas)
      })
    }
  })
}

var keyNameToArray = function (obj) {
  return Object.keys(obj).map(function (key) { return key })
}

var updateOtherSockets = function () {
  /*
  if (Array.isArray(io.sockets.sockets)) {
    for (let socket of io.sockets.sockets) {
      var newEventList = _.difference(config.events, keyNameToArray(socket._events))
      newEventList = _.difference(newEventList, defaultSocketEvent)
      for (let triggerName of newEventList) {
        socket.on(triggerName, function (datas) {
          console.log('index.js - registered event: ' + triggerName + ' triggered with datas: ', datas)
          io.emit(triggerName, datas)
        })
      }
    }
  } else {
    let socket = io.sockets.sockets[Object.keys(io.sockets.sockets)[0]]
    if (socket && socket.clientName && socket.eventsListRegistered) {
      var newEventList = _.difference(config.events, keyNameToArray(socket._events))
      newEventList = _.difference(newEventList, defaultSocketEvent)
      for (let triggerName of newEventList) {
        socket.on(triggerName, function (datas) {
          console.log('index.js - registered event: ' + triggerName + ' triggered with datas: ', datas)
          io.emit(triggerName, datas)
        })
      }
    }
  }
  */
  sockets.forEach(function (socket) {
    var newEventList = _.difference(config.events, keyNameToArray(socket._events))
    newEventList = _.difference(newEventList, defaultSocketEvent)
    for (let triggerName of newEventList) {
      socket.on(triggerName, function (datas) {
        console.log('index.js - registered event: ' + triggerName + ' triggered with datas: ', datas)
        io.emit(triggerName, datas)
      })
    }
  })
}

var registerEventsAndAdd = function (eventsList, socket) {
  if (eventsList !== undefined) {
    var newEventList = _.difference(eventsList, keyNameToArray(socket._events))
    newEventList = _.difference(newEventList, defaultSocketEvent)
    for (let triggerName of newEventList) {
      config.events = _.union(config.events, [triggerName])
      socket.on(triggerName, function (datas) {
        console.log('index.js - event from client: ' + triggerName + ' triggered with datas: ', datas)
        io.emit(triggerName, datas)
      })
    }
  }
}

var updateTable = function () {
  table.length = 0
  /*
  if (Array.isArray(io.sockets.sockets)) {
    console.log('array')
    for (let socket of io.sockets.sockets) {
      if (socket && socket.clientName && socket.eventsListRegistered) {
        table.push([socket.clientName, socket.eventsListRegistered, socket.connected ? 'online' : 'offline'])
      }
    }
  } else {
    let socket = io.sockets.sockets[Object.keys(io.sockets.sockets)[0]]
    if (socket && socket.clientName && socket.eventsListRegistered) {
      table.push([socket.clientName, socket.eventsListRegistered, socket.connected ? 'online' : 'offline'])
    }
  }
  */
  sockets.forEach(function (socket) {
    if (socket && socket.clientName && socket.eventsListRegistered) {
      table.push([socket.clientName, socket.eventsListRegistered, socket.connected ? 'online' : 'offline'])
    }
  })
  console.log(table.toString())
}

var init = function (configOption) {
  config = configOption
  if (config.events === undefined) {
    config.events = []
  }
  process.title = config.server.serviceName
  _initSocketIO(config)
  _initBroadcast(config)
  console.log('Spacebro - ' + config.server.serviceName + ' - listening on port', config.server.port)
}

module.exports = {
  init: init
}
