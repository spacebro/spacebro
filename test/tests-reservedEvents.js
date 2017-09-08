import test from 'ava'
import sleep from 'sleep-promise'
import { SpacebroClient } from 'spacebro-client'

import { _initSocketIO } from '../src/index'
import { getGraph } from '../src/graph'

const waitTime = 5000
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

test('Event - addConnections, getConnections', async (t) => {
  initServer('test-events-addConnections')
  const client1 = initClient('test-events-addConnections')
  port++

  await sleep(waitTime)

  const messages = []
  client1.on('connections', data => messages.push(data))

  client1.emit('addConnections', connections)
  client1.emit('getConnections')

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-events-addConnections').listConnections(),
    connections.slice(0, 2)
  )
  t.deepEqual(messages, [ connections.slice(0, 2), connections.slice(0, 2) ])
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

test('Event - replaceConnections', async (t) => {
  initServer('test-events-replaceConnections')
  const client1 = initClient('test-events-replaceConnections')
  port++

  await sleep(waitTime)

  const messages = []
  client1.on('connections', data => messages.push(data))

  client1.emit('addConnections', connections)
  await sleep(100)
  client1.emit('replaceConnections', connections.slice(0, 1))

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-events-replaceConnections').listConnections(),
    connections.slice(0, 1)
  )
  t.deepEqual(messages, [
    connections.slice(0, 2),
    connections.slice(0, 1)
  ])
})

test('Event - getClients', async (t) => {
  const channelName = 'test-events-getClients'
  const clientNames = ['client1', 'client2', 'client3', 'client4']
  const { sockets } = initServer(channelName)
  const client1 = initClient(channelName, 'client1')
  initClient(channelName, 'client2')
  initClient(channelName, 'client3')
  initClient(channelName, 'client4')
  port++

  await sleep(waitTime)

  const messages = []
  client1.on('clients', data => messages.push(data))

  client1.emit('getClients', connections.slice(0, 1))

  await sleep(waitTime)

  t.deepEqual(
    sockets.map(s => [ s.clientName, s.channelName ]),
    clientNames.map((name) => [ name, channelName ])
  )

  const clients = {}
  for (const name of clientNames) {
    clients[name] = { name, member: name, _isConnected: true }
  }
  t.deepEqual(messages, [ clients ])
})

test('Connections - add connection with client/event => client/event model', async (t) => {
  const channelName = 'test-connection-model'
  initServer(channelName)
  const clientEmitter = initClient(channelName, 'clientEmitter')
  const clientReceiver1 = initClient(channelName, 'clientReceiver')
  port++

  await sleep(waitTime)

  clientEmitter.emit('addConnections', 'clientEmitter/outMessage => clientReceiver/inMessage')
  const messages = []
  clientEmitter.on('connections', data => messages.push(data))
  await sleep(waitTime)
  t.deepEqual(messages[0][0].src.eventName, 'outMessage')

  const messagesReceiver1 = []
  clientReceiver1.on('inMessage', data => messagesReceiver1.push(data))

  const message = {value: 5}
  clientEmitter.emit('outMessage', message)

  await sleep(waitTime)

  t.deepEqual(messagesReceiver1[0].value, message.value)
})

test('Connections - two clients with same name, both get events', async (t) => {
  const channelName = 'test-twoClients'
  initServer(channelName)
  const clientEmitter = initClient(channelName, 'clientEmitter')
  const clientReceiver1 = initClient(channelName, 'clientReceiver')
  const clientReceiver2 = initClient(channelName, 'clientReceiver')
  port++

  await sleep(waitTime)

  clientEmitter.emit('addConnections', 'clientEmitter/outMessage => clientReceiver/inMessage')
  const messagesReceiver1 = []
  const messagesReceiver2 = []
  clientReceiver1.on('inMessage', data => messagesReceiver1.push(data))
  clientReceiver2.on('inMessage', data => messagesReceiver2.push(data))

  const message = {value: 5}
  clientEmitter.emit('outMessage', message)

  await sleep(waitTime)

  t.deepEqual(messagesReceiver1[0].value, message.value)
  t.deepEqual(messagesReceiver2[0].value, message.value)
})

test('Connections - send an array of regex strings', async (t) => {
  const channelName = 'test-arraystrings'
  initServer(channelName)
  const clientEmitter = initClient(channelName, 'clientEmitter')
  const clientReceiver1 = initClient(channelName, 'clientReceiver')
  const clientReceiver2 = initClient(channelName, 'clientReceiver')
  const clientReceiver3 = initClient(channelName, 'clientReceiver3')
  port++

  await sleep(waitTime)

  clientEmitter.emit('addConnections', [
    'clientEmitter/outMessage => clientReceiver/inMessage',
    'clientEmitter/outMessage => clientReceiver3/inMessage'
  ])
  const messagesReceiver1 = []
  const messagesReceiver2 = []
  const messagesReceiver3 = []
  clientReceiver1.on('inMessage', data => messagesReceiver1.push(data))
  clientReceiver2.on('inMessage', data => messagesReceiver2.push(data))
  clientReceiver3.on('inMessage', data => messagesReceiver3.push(data))

  const message = {value: 5}
  clientEmitter.emit('outMessage', message)

  await sleep(waitTime)

  t.deepEqual(messagesReceiver1[0].value, message.value)
  t.deepEqual(messagesReceiver2[0].value, message.value)
  t.deepEqual(messagesReceiver3[0].value, message.value)
})
