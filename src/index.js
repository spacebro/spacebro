'use strict'

import wildcard from 'socketio-wildcard'
import server from 'socket.io'
import fs from 'fs'

import dashboard from './dashboard'
import { getGraph, isValidConnection } from './graph'

import { log, logData, logError, logErrorData } from './loggers'

import { getSettings } from 'standard-settings'
const settings = getSettings()

// Variables
let sockets = []
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
  _prevGraph[channelName] = {
    clients: newGraph._clients,
    connections: newGraph._connections
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
      return newServer && newServer.to(newSocket.id).emit(eventName, data)
    }

    function sendToChannel (eventName, data) {
      return newServer && newServer.to(newSocket.channelName).emit(eventName, data)
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
          clientDescription = {name: clientDescription}
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

    function filterNewConnections (connections) {
      return _arrayify(connections)
        .map((c) => ({ src: c.src, tgt: c.tgt }))
        .filter((connection) => {
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
        }

        function sendTo (clientName, eventName, args) {
          const targets = findSockets(newSocket.channelName, clientName)

          if (!targets.length) {
            return false
          }
          for (const socket of targets) {
            newServer && newServer.to(socket.id).emit(eventName, args)
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
            if ((target.clientName || '').startsWith('ui-')) {
              sendTo('spacebroUI', 'uiEvent', { target, args })
            } else {
              const res = sendTo(target.clientName, target.eventName, args)

              if (res) {
                log(`${_fullname(newSocket)} emitted event "${eventName}" connected to ${target.clientName} event "${target.eventName}"`)
              } else {
                logError(`could not find target "${target.clientName}"`)
              }
            }
            sendTo('spacebroUI', 'connectionUsed', {
              src: { clientName: newSocket.clientName, eventName },
              tgt: target
            })
          }
          return
        }

        sendToChannel(eventName, args)
      })
  })
  return newServer
}

module.exports = { init, infos, _initSocketIO }

/*
 * Helpers
 */

function _arrayify (data) {
  data = _objectify(data) || []

  if (!Array.isArray(data)) {
    data = [ data ]
  }

  data = data.map(_objectify)
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
  return `${socket.clientName}@${socket.channelName}`
}
