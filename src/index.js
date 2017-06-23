'use strict'

import wildcard from 'socketio-wildcard'
import dashboard from './dashboard'
import server from 'socket.io'
import moment from 'moment'
import _ from 'lodash'
const settings = require('standard-settings').getSettings()
const jsonColorz = require('json-colorz')

const isBin = process.env.SPACEBRO_BIN || false

// Default Config
let config = {
  server: {
    port: 6060,
    serviceName: 'spacebro'
  },
  verbose: true,
  showdashboard: isBin
}

// Variables
let io = null
let sockets = []
let connections = []
let infos = {}

const reservedEvents = [ 'register', 'addConnections', 'replaceConnections', 'getConnections' ]

function init (configOption) {
  Object.assign(config, configOption)
  process.title = config.server.serviceName
  if (config.showdashboard) {
    dashboard.init(config)
  }
  addConnections(settings.connections)
  config.verbose && log('init socket.io')
  initSocketIO()
  config.verbose && log(config.server.serviceName, 'listening on port', config.server.port)
}

function observeEvent (eventName, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].events = _.union(infos[channelName].events, [eventName])
  dashboard.setInfos(infos)
}

function sendToConnections (socket, eventName, args) {
  let matchingConnections = connections.filter(c => c.src.clientName === socket.clientName && c.src.eventName === eventName)
  if (matchingConnections) {
    matchingConnections.forEach(c => {
      let target = sockets.find(s => s.clientName === c.tgt.clientName && s.channelName === socket.channelName)
      if (target) {
        io.to(target.id).emit(c.tgt.eventName, args)
        config.verbose && log(`${fullname(socket)} emitted event "${eventName}" connected to ${fullname(target)} event "${c.tgt.eventName}"`)
      } else {
        config.verbose && log('target not found:', c.tgt.clientName)
      }
    })
  }
}

function addConnections (data, socket) {
  data = objectify(data)
  if (data) {
    if (Array.isArray(data)) {
      Array.prototype.push.apply(connections, data)
    } else {
      connections.push(data)
    }
    config.verbose && log(`${socket ? fullname(socket) : ''} added connections`)
    !config.semiverbose && jsonColorz(data)
    // remove duplicated
    connections = _.uniqWith(connections, _.isEqual)
  }
}

function initSocketIO () {
  io = server(config.server.port)
  io.use(wildcard())
  io.on('connection', (socket) => {
    config.verbose && log('new socket connected')
    sockets.push(socket)

    socket
      .on('disconnect', () => {
        sockets.splice(sockets.indexOf(socket), 1)
        config.verbose && log(fullname(socket), 'disconnected')
        quitChannel(socket, socket.channelName)
      })
      .on('error', (err) => {
        config.verbose && log(fullname(socket), 'error:', err)
      })
      .on('register', (data) => {
        data = objectify(data)
        socket.clientName = data.clientName || socket.id
        socket.channelName = data.channelName || 'default'
        socket.join(socket.channelName)
        config.verbose && log(fullname(socket), 'registered')
        joinChannel(socket, socket.channelName)
        io.to(socket.channelName).emit('new-member', { member: socket.clientName })
      })
      .on('addConnections', (data) => addConnections(data, socket))
      .on('getConnections', (data) => {
        io.to(socket.id).emit('connections', connections)
      })
      .on('replaceConnections', (data) => {
        data = objectify(data)
        if (data) {
          if (Array.isArray(data)) {
            connections = data
          } else {
            connections = [data]
          }
          config.verbose && log(`${fullname(socket)} replaced connections`)
          !config.semiverbose && jsonColorz(data)
          // remove duplicated
          connections = _.uniqWith(connections, _.isEqual)
        }
      })
      .on('*', ({ data }) => {
        let [eventName, args] = data

        if (reservedEvents.indexOf(eventName) > -1) return

        observeEvent(eventName, socket.channelName)

        if (typeof args !== 'object') {
          args = {data: args}
          args.altered = true
        }
        config.verbose && log(`${fullname(socket)} emitted event "${eventName}"`)
        !config.semiverbose && jsonColorz(data)

        sendToConnections(socket, eventName, args)

        if (!socket.clientName) return

        if (args._to !== null && args._to !== undefined) {
          let target = sockets.find(s => s.clientName === args._to && s.channelName === socket.channelName)
          if (target) {
            config.verbose && log('target found:', args._to)
            if (args.altered) {
              args = args.data
            }
            io.to(target.id).emit(eventName, args)
            return
          } else {
            config.verbose && log('target not found:', args._to)
          }
        }
        if (args.altered) {
          args = args.data
        }
        io.to(socket.channelName).emit(eventName, args)
      })
  })
}

module.exports = { init, infos }

/*
 * Helpers
 */
function log (...args) {
  if (config.showdashboard) {
    dashboard.log(...args)
  } else {
    console.log(`${moment().format('YYYY-MM-DD-HH:mm:ss')} - `, ...args)
  }
}

function joinChannel (socket, channelName) {
  socket.join(channelName)
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].clients = _.union(infos[channelName].clients, [{'clientName': socket.clientName, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host}])
  config.showdashboard && dashboard.setInfos(infos)
}

function quitChannel (socket, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  _.remove(infos[channelName].clients, s => s.clientName === socket.clientName)
  config.showdashboard && dashboard.setInfos(infos)
}

function objectify (data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      log('socket error:', e)
      return {}
    }
  }
  return data
}

function fullname (socket) {
  return socket.clientName
    ? `${socket.clientName}@${socket.channelName}`
    : `unregistered socket #${socket.id}`
}
