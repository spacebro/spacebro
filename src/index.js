'use strict'

import wildcard from 'socketio-wildcard'
import dashboard from './dashboard'
import server from 'socket.io'
import moment from 'moment'
import _ from 'lodash'
import fs from 'fs'

const settings = require('standard-settings').getSettings()
const jsonColorz = require('json-colorz')

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
  settings.verbose && log('init socket.io')
  initSocketIO()
  settings.verbose && log('spacebro listening on port', settings.server.port)
}

function observeEvent (eventName, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
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
          settings.verbose && log(`${fullname(socket)} emitted event "${eventName}" connected to ${fullname(target)} event "${c.tgt.eventName}"`)
        } else {
          settings.verbose && log('target not found:', c.tgt.clientName)
        }
      })
    }
  }
}

function addConnectionsFromSettings (data) {
  let description = {
    clientDescription: {
      name: 'initial settings'
    }
  }
  Object.keys(data).forEach((channelName) => {
    description.channelName = channelName
    addConnections(data[channelName], description)
  })
}

function addConnections (data, socket) {
  data = objectify(data)
  if (data) {
    if (Array.isArray(data)) {
      data.forEach((connection) => addConnection(connection, socket))
    } else {
      addConnection(data, socket)
    }
    // remove duplicated
    connections[socket.channelName] = _.uniqWith(connections[socket.channelName], _.isEqual)
    io && io.to(socket.channelName).emit('connections', connections[socket.channelName])
  }
}

function addConnection (data, socket) {
  if (typeof data === 'string' || typeof data.data === 'string') {
    data = data.altered ? data.data : data
    data = parseConnection(data)
  } else {
    // clean data
    data = {
      src: data.src,
      tgt: data.tgt
    }
  }
  if (data) {
    connections[socket.channelName] = connections[socket.channelName] || []
    connections[socket.channelName].push(data)
    settings.verbose && log(`${socket ? fullname(socket) : ''} added connection`)
    !settings.semiverbose && jsonColorz(data)
  }
}

function parseConnection (data, socket) {
  const regex = / ?([^ ]+) ?\/ ?([^ ]+) ?=> ?([^ ]+) ?\/ ?([^ ]+) ?/g
  let match = regex.exec(data)
  let connection
  if (match.length > 4) {
    connection = {
      src: {
        clientName: match[1],
        eventName: match[2]
      },
      tgt: {
        clientName: match[3],
        eventName: match[4]
      }
    }
  } else {
    log(`can't parse connection '$data`)
  }
  return connection
}

function removeConnections (data, socket) {
  data = objectify(data)
  if (data) {
    if (Array.isArray(data)) {
      data.forEach((connection) => removeConnection(connection, socket))
    } else {
      // clean data
      var connection = {
        src: data.src,
        tgt: data.tgt
      }
      removeConnection(connection, socket)
    }
  }
  io && io.to(socket.channelName).emit('connections', connections[socket.channelName])
}

function removeConnection (data, socket) {
  _.remove(connections[socket.channelName], data)
  settings.verbose && log(`${socket ? fullname(socket) : ''} removed connection`)
  !settings.semiverbose && jsonColorz(data)
}

function getClients () {
  let clients = {}
  sockets.forEach((s) => {
    clients[s.clientDescription.name] = s.clientDescription
  })
  return clients
}

function saveGraph (data) {
  if (!settings.settings) {
    return
  }
  const graph = { connections, clients: getClients() }

  fs.writeFile(
    settings.settings,
    JSON.stringify({ graph }, null, 4),
    (err) => { err && log(err) }
  )
}

function initSocketIO () {
  io = server(settings.server.port)
  io.use(wildcard())
  io.on('connection', (socket) => {
    settings.verbose && log('new socket connected')
    sockets.push(socket)

    socket
      .on('disconnect', () => {
        sockets.splice(sockets.indexOf(socket), 1)
        settings.verbose && log(fullname(socket), 'disconnected')
        quitChannel(socket, socket.channelName)
      })
      .on('error', (err) => {
        settings.verbose && log(fullname(socket), 'error:', err)
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
        settings.verbose && log(fullname(socket), 'registered')
        !settings.semiverbose && jsonColorz(data)

        joinChannel(socket, socket.channelName)

        socket.clientDescription.member = socket.clientDescription.name // legacy
        io.to(socket.channelName).emit('new-member', socket.clientDescription) // legacy
        io.to(socket.channelName).emit('newClient', socket.clientDescription)
      })
      // TODO: filter by channel
      .on('addConnections', (data) => addConnections(data, socket))
      // TODO: filter by channel
      .on('removeConnections', (data) => removeConnections(data, socket))
      // TODO: filter by channel
      .on('getConnections', (data) => {
        io.to(socket.id).emit('connections', connections[socket.channelName])
      })
      // TODO: filter by channel
      .on('getClients', (data) => {
        io.to(socket.id).emit('clients', getClients())
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
          settings.verbose && log(`${fullname(socket)} replaced connections`)
          !settings.semiverbose && jsonColorz(data)
          // remove duplicated
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
        settings.verbose && log(`${fullname(socket)} emitted event "${eventName}"`)
        !settings.semiverbose && jsonColorz(data)

        sendToConnections(socket, eventName, args)

        if (!socket.clientDescription.name) return

        if (args._to !== null && args._to !== undefined) {
          let target = sockets.find(s => s.clientName === args._to && s.channelName === socket.channelName)
          if (target) {
            settings.verbose && log('target found:', args._to)
            if (args.altered) {
              args = args.data
            }
            io.to(target.id).emit(eventName, args)
            return
          } else {
            settings.verbose && log('target not found:', args._to)
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
  if (settings.showdashboard) {
    dashboard.log(...args)
  } else {
    console.log(`${moment().format('YYYY-MM-DD-HH:mm:ss')} - `, ...args)
  }
}

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
      log('socket error:', e)
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
