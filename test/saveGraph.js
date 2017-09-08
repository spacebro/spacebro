const { SpacebroClient } = require('spacebro-client')

const { _initSocketIO } = require('../dist/index')
const { getGraph } = require('../dist/graph')

const waitTime = 5000
const port = 4400

function initServer (channelName) {
  const sockets = []
  const server = _initSocketIO({ server: {port} }, sockets)

  return { sockets, server }
}

function initClient (channelName, clientName) {
  clientName = clientName || `${channelName}-client`

  const client = new SpacebroClient({
    host: 'localhost',
    port,
    channelName,
    client: {name: clientName}
  })

  client.on('error', console.error)
  client.on('connect_error', console.error)
  return client
}

initServer('test-saveGraph')

const client1 = initClient('test-saveGraph', 'client1')
initClient('test-saveGraph', 'client2')
initClient('test-saveGraph', 'client3')

setTimeout(() => {
  getGraph('test-saveGraph').addConnections([
    {
      src: { clientName: 'client1', eventName: 'helloOut' },
      tgt: { clientName: 'client3', eventName: 'helloIn' }
    }
  ])
  client1.emit('saveGraph')
}, waitTime)

setTimeout(() => {
  process.exit(0)
}, waitTime * 2)
