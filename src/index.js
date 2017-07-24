'use strict'

import wildcard from 'socketio-wildcard'
import dashboard from './dashboard'
import server from 'socket.io'
import _ from 'lodash'
import fs from 'fs'

import {
  init as connectionsInit,
  addConnectionsFromSettings,
  addConnections,
  removeConnections,
} from './connections'

import { log, logData, logError } from './loggers'

import { getSettings } from 'standard-settings'
const settings = getSettings()

// Variables
let io = null
let sockets = []
let connections = {}
let infos = {}

const reservedEvents = [ 'register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients', 'saveGraph' ]

function init () {
  process.title = 'spacebro'
  settings.verbose = (settings.mute === undefined || settings.mute === false)
  settings.showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN
  settings.semiverbose = settings.showdashboard || settings.semiverbose
  if (settings.showdashboard) {
    dashboard.init()
  }
  if (settings.connections) {
    addConnectionsFromSettings(settings.connections)
  }
  connectionsInit(settings, connections)

  log('init socket.io')
  initSocketIO()
  log('spacebro listening on port', settings.server.port)
}

function observeEvent (eventName, channelName) {
  if (!_.has(infos, channelName)) {
    infos[channelName] = { events: [], clients: [] }
  }
  infos[channelName].events = _.union(infos[channelName].events, [eventName])
  dashboard.setInfos(infos)
}

function sendToConnections (socket, eventName, args) {
  if (connections[socket.channelName]) {
    let matchingConnections = connections[socket.channelName].filter(c => c.src && c.src.clientName === socket.clientDescription.name && c.src.eventName === eventName)
    if (matchingConnections) {
      matchingConnections.forEach(c => {
        let target = sockets.find(s => s.clientDescription.name === c.tgt.clientName && s.channelName === socket.channelName)
        if (target) {
          io.to(target.id).emit(c.tgt.eventName, args)
          log(`${fullname(socket)} emitted event "${eventName}" connected to ${fullname(target)} event "${c.tgt.eventName}"`)
        } else {
          logError('target not found:', c.tgt.clientName)
        }
      })
    }
  }
}

function getClients (socket) {
  let clients = {}

  for (const s of sockets.filter(s => s.channelName === socket.channelName)) {
    clients[s.clientDescription.name] = s.clientDescription
  }
  return clients
}

function saveGraph (data) {
  if (!settings.settings) {
    return
  }
  const { server, mute, semiverbose, hidedashboard } = settings
  const newSettings = {
    server,
    mute,
    semiverbose,
    hidedashboard,
    graph: {}
  }
  console.log(connections)
  for (const channelName of Object.keys(connections)) {
    const clients = {}

    for (const socket of sockets.filter(s => s.channelName === channelName)) {
      clients[socket.clientDescription.name] = socket.clientDescription
    }
    newSettings.graph[channelName] = {
      connections: connections[channelName],
      clients
    }
  }

  fs.writeFile(
    settings.settings,
    JSON.stringify(newSettings, null, 2),
    (err) => { err && log(err) }
  )
}

function initSocketIO () {
  io = server(settings.server.port)
  io.use(wildcard())
  io.on('connection', (socket) => {
    log('new socket connected')
    sockets.push(socket)

    socket
      .on('disconnect', () => {
        sockets.splice(sockets.indexOf(socket), 1)
        log(fullname(socket), 'disconnected')
        quitChannel(socket, socket.channelName)
      })
      .on('error', (err) => {
        logError(fullname(socket), 'error:', err)
      })
      .on('register', (data) => {
        data = objectify(data)
        socket.clientDescription = data.client || data.clientName || socket.id
        // legacy
        if (typeof socket.clientDescription === 'string') {
          socket.clientDescription = {name: socket.clientDescription}
        }

        socket.channelName = data.channelName || 'default'
        socket.join(socket.channelName)
        log(fullname(socket), 'registered')
        logData(data)

        joinChannel(socket, socket.channelName)

        socket.clientDescription.member = socket.clientDescription.name // legacy
        io.to(socket.channelName).emit('new-member', socket.clientDescription) // legacy
        io.to(socket.channelName).emit('newClient', socket.clientDescription)
      })
      // TODO: filter by channel
      .on('addConnections', (data) => {
        addConnections(data, socket)
        io && io.to(socket.channelName).emit('connections', connections[socket.channelName])
      })
      // TODO: filter by channel
      .on('removeConnections', (data) => {
        removeConnections(data, socket)
        io && io.to(socket.channelName).emit('connections', connections[socket.channelName])
      })
      // TODO: filter by channel
      .on('getConnections', (data) => {
        io.to(socket.id).emit('connections', connections[socket.channelName])
      })
      // TODO: filter by channel
      .on('getClients', (data) => {
        io.to(socket.id).emit('clients', getClients(socket))
      })
      .on('saveGraph', (data) => saveGraph(data))
      .on('replaceConnections', (data) => {
        data = objectify(data)
        if (data) {
          if (Array.isArray(data)) {
            connections[socket.channelName] = data
          } else {
            connections[socket.channelName] = [data]
          }
          log(`${fullname(socket)} replaced connections`)
          logData(data)
          // remove duplicates
          connections[socket.channelName] = _.uniqWith(connections[socket.channelName], _.isEqual)
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
        log(`${fullname(socket)} emitted event "${eventName}"`)
        logData(data)

        sendToConnections(socket, eventName, args)

        if (!socket.clientDescription.name) return

        if (args._to != null) {
          let target = sockets.find(s => s.clientName === args._to && s.channelName === socket.channelName)
          if (target) {
            log('target found:', args._to)
            if (args.altered) {
              args = args.data
            }
            io.to(target.id).emit(eventName, args)
            return
          } else {
            log('target not found:', args._to)
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
function joinChannel (socket, channelName) {
  socket.join(channelName)
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].clients = _.union(infos[channelName].clients, [{'clientName': socket.clientDescription.name, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host}])
  settings.showdashboard && dashboard.setInfos(infos)
}

function quitChannel (socket, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  _.remove(infos[channelName].clients, s => s.clientName === socket.clientDescription.name)
  settings.showdashboard && dashboard.setInfos(infos)
}

function objectify (data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      logError('socket error:', e)
      return {}
    }
  }
  return data
}

function fullname (socket) {
  return socket.clientDescription.name
    ? `${socket.clientDescription.name}@${socket.channelName}`
    : `unregistered socket #${socket.id}`
}
