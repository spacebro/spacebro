'use strict'

const _ = require('lodash')
const mdns = require('mdns')
require('colors')

let defaultSocketEvent = ['disconnect', 'error', 'register']
let io
let config
let sockets = []

const Table = require('cli-table')

// instantiate
const table = new Table({
  head: ['Clients', 'Events registered', 'Status'],
  colWidths: [22, 30, 16]
})

function _initBroadcast (config) {
  var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
  ad.start()
}

function _initSocketIO (config) {
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
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch (e) {
            console.error(e)
          }
        }
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

function keyNameToArray (obj) {
  return Object.keys(obj).map(function (key) { return key })
}

function updateOtherSockets () {
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

function registerEventsAndAdd (eventsList, socket) {
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

function updateTable () {
  table.length = 0
  sockets.forEach(function (socket) {
    if (socket && socket.clientName && socket.eventsListRegistered) {
      table.push([socket.clientName, socket.eventsListRegistered, socket.connected ? 'online' : 'offline'])
    }
  })
  console.log(table.toString())
}

function init (configOption) {
  config = configOption
  if (config.events === undefined) {
    config.events = []
  }
  process.title = config.server.serviceName
  _initSocketIO(config)
  _initBroadcast(config)
  console.log('Spacebro - ' + config.server.serviceName + ' - listening on port', config.server.port)
}

module.exports = { init }
