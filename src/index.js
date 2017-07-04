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

const reservedEvents = [ 'register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients' ]

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
  let matchingConnections = connections.filter(c => c.src && c.src.clientName === socket.clientDescription.name && c.src.eventName === eventName)
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
      data.forEach((connection) => addConnection(connection, socket))
    } else {
      addConnection(data, socket)
    }
    // remove duplicated
    connections = _.uniqWith(connections, _.isEqual)
    io && io.to(socket.channelName).emit('connections', connections)
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
    connections.push(data)
    config.verbose && log(`${socket ? fullname(socket) : ''} added connection`)
    !config.semiverbose && jsonColorz(data)
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
      data.forEach((connection) => removeConnection(connection))
    } else {
      // clean data
      var connection = {
        src: data.src,
        tgt: data.tgt
      }
      removeConnection(connection)
    }
  }
  io && io.to(socket.channelName).emit('connections', connections)
}

function removeConnection (data, socket) {
  _.remove(connections, data)
  config.verbose && log(`${socket ? fullname(socket) : ''} removed connection`)
  !config.semiverbose && jsonColorz(data)
}

function getClients () {
  let clients = {}
  sockets.forEach((s) => {
    clients[s.clientDescription.name] = s.clientDescription
  })
  return clients
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
        socket.clientDescription = data.client || data.clientName || socket.id
        // legacy
        if (typeof socket.clientDescription === 'string') {
          socket.clientDescription = {name: socket.clientDescription}
        }

        socket.channelName = data.channelName || 'default'
        socket.join(socket.channelName)
        config.verbose && log(fullname(socket), 'registered')
        !config.semiverbose && jsonColorz(data)

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
        io.to(socket.id).emit('connections', connections)
      })
      // TODO: filter by channel
      .on('getClients', (data) => {
        io.to(socket.id).emit('clients', getClients())
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

        if (!socket.clientDescription.name) return

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
  infos[channelName].clients = _.union(infos[channelName].clients, [{'clientName': socket.clientDescription.name, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host}])
  config.showdashboard && dashboard.setInfos(infos)
}

function quitChannel (socket, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  _.remove(infos[channelName].clients, s => s.clientName === socket.clientDescription.name)
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
  return socket.clientDescription.name
    ? `${socket.clientDescription.name}@${socket.channelName}`
    : `unregistered socket #${socket.id}`
}
