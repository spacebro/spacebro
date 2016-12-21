import blessed from 'blessed'
import moment from 'moment'
import _ from 'lodash'

let screen = null
let logText = null
let clientTable = null

const color = 'blue'

function init (config) {
  // Create a screen object.
  screen = blessed.screen({
    smartCSR: true,
    title: 'spacebro server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  })

  let log = blessed.box({
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
  screen.append(log)

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

  let clientBox = blessed.box({
    label: 'Clients',
    tags: true,
    padding: 1,
    width: '100%',
    height: '30%',
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
    data: [['Name', 'Channel']]
  })
  screen.append(clientBox)

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0)
  })

  // Render the screen.
  screen.render()
}

function log (...args) {
  // logText.log(...args)
  logText.log(`${moment().format('YYYY:MM:DD-HH:mm:ss')} - `, ...args)
}

function setInfos (data) {
  let clients = [['Name', 'Channel']]
  for (let channelName in data) {
    clients = _.union(clients, data[channelName].clients.map(c => [c, channelName]))
  }
  if (clientTable) {
    clientTable.setData(clients)
  }
}

module.exports = { init, log, setInfos }
