import test from 'ava'
import sleep from 'sleep-promise'
import { SpacebroClient } from 'spacebro-client'

import { _initSocketIO } from '../src/index'
// import { Graph, getGraph, isValidConnection } from '../src/graph'
import { getGraph } from '../src/graph'

const waitTime = 3000
let port = 4200

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

test('Basic connection', async (t) => {
  initServer('test-channel-basic')
  initClient('test-channel-basic')
  port++

  const name = 'test-channel-basic-client'

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-channel-basic').listClients(),
    { [name]: { name, member: name } }
  )
})

test('Message - all', async (t) => {
  initServer('test-channel-message-all')
  const client1 = initClient('test-channel-message-all', 'client1')
  const client2 = initClient('test-channel-message-all', 'client2')
  port++

  await sleep(waitTime)

  client1.emit('hello', 'world')

  const messages = []
  client1.on('hello', data => messages.push(data))
  client2.on('hello', data => messages.push(data))

  await sleep(waitTime)

  t.deepEqual(messages, ['world', 'world'])
})

test('Message - _to', async (t) => {
  initServer('test-channel-message-_to')
  const client1 = initClient('test-channel-message-_to', 'client1')
  const client2 = initClient('test-channel-message-_to', 'client2')
  const client3 = initClient('test-channel-message-_to', 'client3')
  port++

  await sleep(waitTime)

  client1.sendTo('hello', 'client2', { str: 'world' })

  const messages = []
  client1.on('hello', data => t.fail())
  client2.on('hello', data => messages.push(data.str))
  client3.on('hello', data => t.fail())

  await sleep(waitTime)

  t.deepEqual(messages, ['world'])
})

test('Message - connection', async (t) => {
  initServer('test-channel-message-connection')
  const client1 = initClient('test-channel-message-connection', 'client1')
  const client2 = initClient('test-channel-message-connection', 'client2')
  const client3 = initClient('test-channel-message-connection', 'client3')
  port++

  await sleep(waitTime)

  client1.emit('helloOut', 'world')
  getGraph('test-channel-message-connection').addConnections([
    {
      src: { clientName: 'client1', eventName: 'helloOut' },
      tgt: { clientName: 'client3', eventName: 'helloIn' }
    }
  ])

  const messages = []
  client1.on('*', data => t.not(data, 'world'))
  client2.on('*', data => t.not(data, 'world'))
  client3.on('helloIn', data => messages.push(data))

  await sleep(waitTime)

  t.deepEqual(messages, ['world'])
})
