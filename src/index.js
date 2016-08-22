'use strict'

import middlewareMaker from 'socketio-wildcard'
import Server from 'socket.io'
import mdns from 'mdns'
import _ from 'lodash'

// Default Config
let config = {
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: true,
  events: [] // Useless
}

// Variables
let io = null
let sockets = []

const reservedEvents = [
  'register'
]

function init (configOption) {
  config = _.merge(config, configOption)
  process.title = config.server.serviceName
  initSocketIO()
  initBroadcast()
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
        log(fullname(socket), 'disconnected')
        sockets.splice(sockets.indexOf(socket), 1)
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
      })
      .on('*', function ({ data }) {
        let [eventName, args] = data
        if (reservedEvents.indexOf(eventName) !== -1) return
        if (!socket.clientName) {
          log(fullname(socket), 'tried to trigger', eventName, 'with data:', args)
          return
        }
        log(fullname(socket), 'triggered', eventName, 'with data:', args)
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

module.exports = { init }

// = Helpers ===
function log (...args) {
  if (!config.verbose) return
  console.log('SpaceBro -', ...args)
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
