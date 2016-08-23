'use strict'

import middlewareMaker from 'socketio-wildcard'
import dashboard from './dashboard'
import Server from 'socket.io'
import Table from 'cli-table'
import mdns from 'mdns'
import _ from 'lodash'

// Default Config
let config = {
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: true,
  events: [], // Useless
  _isCLI: false // Should be private
}

// Variables
let io = null
let sockets = []
let infos = {}

const reservedEvents = [
  'register'
]
const table = new Table({
  head: ['Clients', 'Channel', 'Status'],
  colWidths: [25, 25, 15]
})

function init (configOption) {
  config = _.merge(config, configOption)
  process.title = config.server.serviceName
  initSocketIO()
  initBroadcast()
  dashboard.init(config)
  log(config.server.serviceName, 'listening on port', config.server.port)
}

function initSocketIO () {
  io = Server(config.server.port)
  io.use(middlewareMaker())
  io.on('connection', function (socket) {
    log('New socket connected')
    sockets.push(socket)
    socket
      .on('disconnect', function () {
        sockets.splice(sockets.indexOf(socket), 1)
        log(fullname(socket), 'disconnected')
        quitChannel(socket, socket.channelName)
        updateTable()
      })
      .on('error', function (err) {
        log(fullname(socket), 'error:', err)
      })
      .on('register', function (data) {
        data = objectify(data)
        socket.clientName = data.clientName || socket.id
        socket.channelName = data.channelName || 'default'
        socket.join(socket.channelName)
        log(fullname(socket), 'registered')
        joinChannel(socket, socket.channelName)
        updateTable()
      })
      .on('*', function ({ data }) {
        let [eventName, args] = data
        if (reservedEvents.indexOf(eventName) !== -1) return
        if (!socket.clientName) {
          log(fullname(socket), 'tried to trigger', eventName, 'with data:', args)
          return
        }
        log(fullname(socket), 'triggered', eventName, 'with data:', args)
        registerEvent(eventName, socket.channelName)
        args._from = args._from || socket.clientName
        if (args._to != null) {
          let target = sockets.find(s => s.clientName === args._to && s.channelName === socket.channelName)
          if (target) {
            io.to(target.id).emit(eventName, args)
            return
          } else {
            log('Target not found:', args._to)
          }
        }
        io.to(socket.channelName).emit(eventName, args)
      })
  })
}

function initBroadcast () {
  mdns
    .createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
    .start()
}

module.exports = { init, infos }

// = Helpers ===
function log (...args) {
  if (!config.verbose) return
  if (config._isCLI) {
    dashboard.log(...args)
  } else {
    console.log('SpaceBro -', ...args)
  }
}

function joinChannel (socket, channelName) {
  socket.join(channelName)
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].clients = _.union(infos[channelName].clients, [socket.clientName])
  dashboard.setInfos(infos)
}

function quitChannel (socket, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  log(_.remove(infos[channelName].clients, s => s === socket.clientName))
  dashboard.setInfos(infos)
}

function registerEvent (eventName, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].events = _.union(infos[channelName].events, [eventName])
  dashboard.setInfos(infos)
}

function updateTable () {
  if (!config.verbose || config._isCLI) return
  table.length = 0
  sockets.forEach(function (socket) {
    if (socket && socket.clientName && socket.channelName) {
      table.push([socket.clientName, socket.channelName, socket.connected ? 'online' : 'offline'])
    }
  })
  console.log(table.toString())
}

function objectify (data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.log('Socket error:', e)
      return {}
    }
  }
  return data
}

function fullname (socket) {
  return !socket.clientName
    ? 'unregistered socket #' + socket.id
    : socket.channelName + '@' + socket.clientName
}
