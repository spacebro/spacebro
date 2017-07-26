import test from 'ava'
import sleep from 'sleep-promise'
import { SpacebroClient } from 'spacebro-client'

import { _initSocketIO } from '../src/index'
import { getGraph } from '../src/graph'

const waitTime = 1000
let port = 4300

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

const connections = [
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in1' }
  },
  {
    src: { clientName: 'clientA', eventName: 'out2' },
    tgt: { clientName: 'clientB', eventName: 'in2' }
  },
  // duplicate
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in1' }
  }
]

test('Event - addConnections', async (t) => {
  initServer('test-events-addConnections')
  const client1 = initClient('test-events-addConnections')
  port++

  await sleep(waitTime)

  const messages = []
  client1.on('connections', data => messages.push(data))

  client1.emit('addConnections', connections)

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-events-addConnections').listConnections(),
    connections.slice(0, 2)
  )
  t.deepEqual(messages, [ connections.slice(0, 2) ])
})

test('Event - removeConnections', async (t) => {
  initServer('test-events-removeConnections')
  const client1 = initClient('test-events-removeConnections')
  port++

  await sleep(waitTime)

  const messages = []
  client1.on('connections', data => messages.push(data))

  client1.emit('addConnections', connections)
  await sleep(100)
  client1.emit('removeConnections', connections.slice(0, 1))

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-events-removeConnections').listConnections(),
    connections.slice(1, 2)
  )
  t.deepEqual(messages, [
    connections.slice(0, 2),
    connections.slice(1, 2)
  ])
})
