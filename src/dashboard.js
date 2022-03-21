import blessed from 'blessed'
import { format } from 'date-fns'
import _ from 'lodash'

let screen = null
let logText = null
let clientTable = null
let eventTable = null
const clientTableHeader = [['Name', 'IP', 'Host connexion', 'Channel']]

const color = 'blue'

function init () {
  // Create a screen object.
  screen = blessed.screen({
    smartCSR: true,
    title: 'spacebro server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  })

  const logBox = blessed.box({
    label: 'Log',
    padding: 1,
    width: '100%',
    height: '70%',
    left: '0%',
    top: '0%',
    border: { type: 'line' },
    style: {
      // fg: -1,
      transparent: false,
      border: { fg: color }
    }
  })
  screen.append(logBox)

  logText = blessed.log({
    parent: logBox,
    tags: true,
    width: '100%-5',
    scrollable: true,
    input: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true
  })

  const clientBox = blessed.box({
    label: 'Clients',
    tags: true,
    padding: 1,
    width: '50%',
    height: '40%',
    left: '0%',
    top: '70%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  })

  clientTable = blessed.table({
    parent: clientBox,
    height: '100%',
    width: '100%',
    align: 'left',
    pad: 1,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true,
    data: clientTableHeader
  })
  screen.append(clientBox)

  const eventBox = blessed.box({
    label: 'Events',
    tags: true,
    padding: 1,
    width: '50%',
    height: '40%',
    left: '51%',
    top: '70%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  })

  eventTable = blessed.table({
    parent: eventBox,
    height: '100%',
    width: '100%-5',
    align: 'left',
    pad: 1,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true,
    data: [['Name', 'Channel']]
  })

  screen.append(eventBox)

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0)
  })

  // Render the screen.
  screen.render()
}

function log (...args) {
  // logText.log(...args)
  logText.log(`${format(new Date(), 'yyyy:MM:dd-HH:mm:ss')} - `, ...args)
}

function setInfos (data) {
  let events = [['Name', 'Channel']]
  let clients = clientTableHeader
  for (const channelName in data) {
    events = _.union(events, data[channelName].events.map(e => [e, channelName]))
    clients = _.union(clients, data[channelName].clients.map(client => [client.clientName, client.ip, client.hostname, channelName]))
  }
  if (eventTable) {
    eventTable.setData(events)
  }
  if (clientTable) {
    clientTable.setData(clients)
  }
}

function observeEvent (infos, eventName, channelName) {
  if (!_.has(infos, channelName)) {
    infos[channelName] = { events: [], clients: [] }
  }
  infos[channelName].events = _.union(infos[channelName].events, [eventName])
  setInfos(infos)
}

function joinChannel (infos, socket, channelName) {
  infos[channelName] = infos[channelName] || { events: [], clients: [] }
  infos[channelName].clients = _.union(infos[channelName].clients, [{
    clientName: socket.clientName,
    ip: socket.handshake.address,
    hostname: socket.handshake.headers.host
  }])
  setInfos(infos)
}

function quitChannel (infos, socket, channelName) {
  infos[channelName] = infos[channelName] || { events: [], clients: [] }
  _.remove(infos[channelName].clients, s => s.clientName === socket.clientName)
  setInfos(infos)
}

module.exports = {
  init,
  log,
  setInfos,
  observeEvent,
  joinChannel,
  quitChannel
}
