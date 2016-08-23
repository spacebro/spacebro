import blessed from 'blessed'
import _ from 'lodash'

let screen, logText, clientTable, eventTable

const color = 'green'

function init (config) {
  // Create a screen object.
  screen = blessed.screen({
    smartCSR: true,
    title: 'SpaceBro Server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  })

  let log = blessed.box({
    label: 'Log',
    padding: 1,
    width: '100%',
    height: '50%',
    left: '0%',
    top: '0%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  })

  logText = blessed.log({
    parent: log,
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

  screen.append(log)

  let clientBox = blessed.box({
    label: 'Clients',
    tags: true,
    padding: 1,
    width: '50%',
    height: '50%',
    left: '0%',
    top: '50%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  })

  clientTable = blessed.table({
    parent: clientBox,
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

  screen.append(clientBox)

  let eventBox = blessed.box({
    label: 'Events',
    tags: true,
    padding: 1,
    width: '50%',
    height: '50%',
    left: '50%',
    top: '50%',
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
  logText.log(...args)
}

function setInfos (data) {
  let events = [['Name', 'Channel']]
  let clients = [['Name', 'Channel']]
  for (let channelName in data) {
    events = _.union(events, data[channelName].events.map(e => [e, channelName]))
    clients = _.union(clients, data[channelName].clients.map(c => [c, channelName]))
  }
  eventTable.setData(events)
  clientTable.setData(clients)
}

module.exports = { init, log, setInfos }
