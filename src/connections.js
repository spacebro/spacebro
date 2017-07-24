import _ from 'lodash'
import { log, logData } from './loggers'

let connections

function init (_connections) {
  connections = _connections
}

function addConnectionsFromSettings (settingsConnections) {
  let description = {
    clientDescription: {
      name: 'initial settings'
    }
  }
  for (const channelName of Object.keys(settingsConnections)) {
    description.channelName = channelName
    addConnections(settingsConnections[channelName], description)
  }
}

function addConnections (data, socket) {
  data = _objectify(data)
  if (data) {
    if (Array.isArray(data)) {
      data.forEach((connection) => addConnection(connection, socket))
    } else {
      addConnection(data, socket)
    }
    // remove duplicates
    connections[socket.channelName] = _.uniqWith(connections[socket.channelName], _.isEqual)
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
    log(`${socket ? _fullname(socket) : ''} added connection`)
    logData(data)
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
    log(`can't parse connection "${data}"`)
  }
  return connection
}

function removeConnections (data, socket) {
  data = _objectify(data)
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
}

function removeConnection (data, socket) {
  _.remove(connections[socket.channelName], data)
  log(`${socket ? _fullname(socket) : ''} removed connection`)
  logData(data)
}

module.exports = {
  init,
  addConnectionsFromSettings,
  addConnections,
  addConnection,
  parseConnection,
  removeConnections,
  removeConnection
}

function _objectify (data) {
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

function _fullname (socket) {
  return socket.clientDescription.name
    ? `${socket.clientDescription.name}@${socket.channelName}`
    : `unregistered socket #${socket.id}`
}
