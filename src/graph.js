'use strict'

import deepEqual from 'deep-equal'
import _ from 'lodash'

class Graph {
  constructor () {
    this._clients = {}
    this._connections = []
  }

  addClient (client) {
    this._clients[client.name] = client
  }

  removeClient (clientName) {
    delete this._clients[clientName]
  }

  listClients () {
    return this._clients
  }

  clearClients () {
    this._clients = {}
  }

  getClient (name) {
    return this._clients[name]
  }

  addConnections (connections) {
    for (const connection of connections) {
      this._addConnection(connection)
    }
    this._removeDuplicates()
  }

  _addConnection (connection) {
    this._connections.push(connection)
  }

  _removeDuplicates () {
    this._connections = _.uniqWith(this._connections, deepEqual)
  }

  removeConnection (connection) {
    _.remove(this._connections, connection)
  }

  listConnections () {
    return this._connections
  }

  clearConnections () {
    this._connections = []
  }

  /*
  ** Filters all connections which start from the given client and port
  ** Returns list of { clientName, eventName } tuples
  */
  getTargets (clientName, outputPort) {
    return this._connections
      .filter((connection) =>
        connection.src.clientName === clientName &&
        connection.src.eventName === outputPort
      )
      .map((connection) => connection.tgt)
  }
}

const _channelGraphs = {}

function getGraph (channelName) {
  if (!_channelGraphs[channelName]) {
    _channelGraphs[channelName] = new Graph()
  }
  return _channelGraphs[channelName]
}

function isValidConnection (connection) {
  return (
    deepEqual(Object.keys(connection), ['src', 'tgt']) &&
    deepEqual(Object.keys(connection.src), ['clientName', 'eventName']) &&
    deepEqual(Object.keys(connection.tgt), ['clientName', 'eventName'])
  )
}

module.exports = {
  Graph,
  getGraph,
  isValidConnection
}
