'use strict'

import wildcard from 'socketio-wildcard'
import dashboard from './dashboard'
import server from 'socket.io'
import moment from 'moment'
import _ from 'lodash'

const isBin = process.env.SPACEBRO_BIN || false

// Default Config
let config = {
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: true,
  showdashboard: isBin
}

// Variables
let io = null
let sockets = []
let infos = {}

const reservedEvents = [ 'register' ]

function init (configOption) {
  Object.assign(config, configOption)
  process.title = config.server.serviceName
  if (config.showdashboard) {
    dashboard.init(config)
  }
  config.verbose && log('init socket.io')
  initSocketIO()
  config.verbose && log(config.server.serviceName, 'listening on port', config.server.port)
}

function observeEvent (eventName, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  infos[channelName].events = _.union(infos[channelName].events, [eventName])
  dashboard.setInfos(infos)
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
      .on('*', ({ data }) => {
        let [eventName, args] = data

        if (reservedEvents.indexOf(eventName) > -1) return
        
        observeEvent(eventName, socket.channelName)
        
        if (typeof args !== 'object') {
          args = {data: args}
          args.altered = true
        }
        config.verbose && log(`${fullname(socket)} emitted event "${eventName}"${config.semiverbose ? '' : `, datas: ${args}`}`)

        if (!socket.clientName) return

        if (args._to !== null) {
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
  infos[channelName].clients = _.union(infos[channelName].clients, [socket.clientName])
  config.showdashboard && dashboard.setInfos(infos)
}

function quitChannel (socket, channelName) {
  if (!_.has(infos, channelName)) infos[channelName] = { events: [], clients: [] }
  _.remove(infos[channelName].clients, s => s === socket.clientName)
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
