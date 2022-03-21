'use strict'

import wildcard from 'socketio-wildcard'
import server from 'socket.io'
import fs from 'fs'
import _ from 'lodash'

import dashboard from './dashboard'
import { getGraph, isValidConnection } from './graph'

import { log, logData, logError, logErrorData } from './loggers'

import { getSettings } from 'standard-settings'
let settings = getSettings()

// Variables
const sockets = []
const infos = {}

const reservedEvents = ['register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients', 'saveGraph']

function init (options = {}) {
  settings = Object.assign(options, settings)
  process.title = 'spacebro'
  settings.verbose = (settings.mute === undefined || settings.mute === false)
  settings.showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN
  settings.semiverbose = settings.showdashboard || settings.semiverbose
  if (settings.showdashboard) {
    dashboard.init()
  }
  if (settings.graph) {
    for (const channelName of Object.keys(settings.graph)) {
      const settingsGraph = settings.graph[channelName]
      const graph = getGraph(channelName)

      for (const clientName of Object.keys(settingsGraph.clients)) {
        graph.addClient(settingsGraph.clients[clientName])
      }
      graph.addConnections(settingsGraph.connections)
    }
  }

  log('init socket.io')
  _initSocketIO(settings, sockets)
  log('spacebro listening on port', settings.server.port)
}

const _prevGraph = settings.graph || {}

function saveGraph (channelName) {
  if (!settings.settings) {
    return
  }
  const newSettings = {
    server: settings.server,
    mute: settings.mute,
    semiverbose: settings.semiverbose,
    hidedashboard: settings.hidedashboard,
    graph: _prevGraph
  }
  const newGraph = getGraph(channelName)
  _prevGraph[channelName] = JSON.parse(JSON.stringify({
    clients: newGraph._clients,
    connections: newGraph._connections
  }))
  for (const key in _prevGraph[channelName].clients) {
    let entry = _prevGraph[channelName].clients[key]
    entry = _.omit(entry, '_isConnected')
    _prevGraph[channelName].clients[key] = entry
  }

  fs.writeFile(
    settings.settings,
    JSON.stringify(newSettings, null, 2) + '\n',
    (err) => { err && log(err) }
  )
}

function _initSocketIO (settings, sockets) {
  const newServer = server(settings.server.port)

  function findSockets (channelName, clientName) {
    return sockets.filter(socket =>
      socket.channelName === channelName &&
      socket.clientName === clientName
    )
  }

  newServer.use(wildcard())
  newServer.on('connection', (newSocket) => {
    log('new socket connected')
    sockets.push(newSocket)

    function sendBack (eventName, data) {
      // return newServer && newServer.to(newSocket.id).emit(eventName, data)
      const args = Array.prototype.slice.call(arguments, 0)
      return newServer && newServer.to(newSocket.id).emit.apply(newServer.to(newSocket.id), args)
    }

    function sendToChannel (eventName, data) {
      // return newServer && newServer.to(newSocket.channelName).emit(eventName, data)
      try {
        const args = Array.prototype.slice.call(arguments, 0)
        return newServer && newServer.to(newSocket.channelName).emit.apply(newServer.to(newSocket.channelName), args)
      } catch (e) {
        console.error(e)
      }
    }

    const channelGraph = () => getGraph(newSocket.channelName)

    function _listClients () {
      const clients = channelGraph().listClients()

      for (const client of Object.values(clients)) {
        const clientSockets = findSockets(newSocket.channelName, client.name)
        client._isConnected = (clientSockets.length > 0)
      }
      return clients
    }

    newSocket
      .on('disconnect', () => {
        sockets.splice(sockets.indexOf(newSocket), 1)
        log(_fullname(newSocket), 'disconnected')
        settings.showdashboard && dashboard.quitChannel(infos, newSocket, newSocket.channelName)
        sendToChannel('clients', _listClients())
      })
      .on('error', (err) => {
        logError(_fullname(newSocket), 'error:', err)
      })
      .on('register', (data) => {
        data = _objectify(data)

        // legacy
        let clientDescription = data.client || data.clientName || newSocket.id
        if (typeof clientDescription === 'string') {
          clientDescription = { name: clientDescription }
        }
        // legacy
        clientDescription.member = clientDescription.name

        newSocket.clientName = clientDescription.name
        newSocket.channelName = data.channelName || 'default'
        newSocket.join(newSocket.channelName)

        log(_fullname(newSocket), 'registered')
        logData(data)

        settings.showdashboard && dashboard.joinChannel(infos, newSocket, newSocket.channelName)

        channelGraph().addClient(clientDescription)
        sendToChannel('clients', _listClients())
        sendToChannel('newClient', clientDescription)
        // legacy
        sendToChannel('new-member', clientDescription)
      })

    function parseConnection (data) {
      const regex = / ?([^/]+) ?\/ ?([^=]+[^ ]) ?=> ?([^/]+) ?\/ ?([^/]+[^ ]) ?/g
      const match = regex.exec(data)
      let connection
      if (match && match.length > 4) {
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
        log('cannot parse connection ' + data)
      }
      return connection
    }

    function filterNewConnections (connections) {
      return _arrayify(connections)
        .map((c) => {
          if (typeof c === 'string' || typeof c.data === 'string') {
            c = c.altered ? c.data : c
            return parseConnection(c)
          } else {
            return { src: c.src, tgt: c.tgt }
          }
        })
        .filter((connection, index) => {
          if (!isValidConnection(connection)) {
            logError(_fullname(newSocket), 'invalid connection object')
            logErrorData(connection)
            return false
          }
          return true
        })
    }

    newSocket
      .on('addConnections', (connections) => {
        connections = filterNewConnections(connections)

        channelGraph().addConnections(connections)
        sendToChannel('connections', channelGraph().listConnections())

        log(`${_fullname(newSocket)} added connections`)
        logData(connections)
      })
      .on('removeConnections', (connections) => {
        connections = filterNewConnections(connections)

        for (const connection of connections) {
          channelGraph().removeConnection(connection)
        }
        sendToChannel('connections', channelGraph().listConnections())

        log(`${_fullname(newSocket)} removed connections`)
        logData(connections)
      })
      .on('replaceConnections', (connections) => {
        connections = filterNewConnections(connections)

        channelGraph().clearConnections()
        channelGraph().addConnections(connections)
        sendToChannel('connections', channelGraph().listConnections())

        log(`${_fullname(newSocket)} replaced connections`)
        logData(connections)
      })
      .on('getConnections', (data) => {
        sendBack('connections', channelGraph().listConnections())
      })

    newSocket
      .on('addClients', (clients) => {
        for (const client of clients) {
          channelGraph().addClient(client)
        }
        sendToChannel('clients', _listClients())
      })
      .on('removeClients', (clientNames) => {
        for (const name of clientNames) {
          channelGraph().removeClient(name)
        }
        sendToChannel('clients', _listClients())
      })
      .on('getClients', (data) => {
        sendBack('clients', _listClients())
      })

    newSocket
      .on('saveGraph', (data) => {
        saveGraph(newSocket.channelName)
      })
      .on('*', ({ data }) => {
        let [eventName, args] = data
        const { _to } = args

        if (reservedEvents.indexOf(eventName) > -1) {
          return
        }

        if (settings.showdashboard) {
          dashboard.observeEvent(infos, eventName, newSocket.channelName)
        }

        log(`${_fullname(newSocket)} emitted event "${eventName}"`)
        logData(data)

        if (args.altered) {
          args = args.data
          data[1] = args
        }

        function sendTo (clientName, eventName, args) {
          const targets = findSockets(newSocket.channelName, clientName)

          if (!targets.length) {
            return false
          }
          for (const socket of targets) {
            const fullArgs = Array.prototype.slice.call(arguments, 3)
            fullArgs.unshift(eventName, args)
            // newServer && newServer.to(socket.id).emit(eventName, args)
            newServer && socket.emit.apply(socket, fullArgs)
          }
          return true
        }

        if (_to != null) {
          if (!sendTo(_to, eventName, args)) {
            logError(`could not find target "${_to}"`)
          }
          return
        }

        const targets = channelGraph().getTargets(newSocket.clientName, eventName)
        if (targets.length) {
          for (const target of targets) {
            // const res = sendTo(target.clientName, target.eventName, args)
            const fullArgs = data.slice(2)
            fullArgs.unshift(target.clientName, target.eventName, args)
            const res = sendTo.apply(this, fullArgs)

            if (res) {
              log(`${_fullname(newSocket)} emitted event "${eventName}" connected to ${target.clientName} event "${target.eventName}"`)
            } else {
              logError(`could not find target "${target.clientName}"`)
            }
          }
        }

        sendToChannel.apply(this, data)
        // sendToChannel(eventName, args)
      })
  })
  return newServer
}

module.exports = { init, infos, _initSocketIO }

/*
 * Helpers
 */

function _arrayify (data) {
  // data = _objectify(data) || []

  if (!Array.isArray(data)) {
    data = [data]
  }

  // data = data.map(_objectify)
  data = data.filter(item => item != null)

  return data
}

function _objectify (data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      logError('socket error:', e)
      return null
    }
  }
  return data
}

function _fullname (socket) {
  return socket.clientName
    ? `${socket.clientName}@${socket.channelName}`
    : `unregistered socket #${socket.id}`
}
