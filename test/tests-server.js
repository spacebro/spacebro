import test from 'ava'
import sleep from 'sleep-promise'
import { SpacebroClient } from 'spacebro-client'

import { _initSocketIO } from '../src/index'
import { getGraph } from '../src/graph'

const waitTime = 5000
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
  initServer('test-basic')
  initClient('test-basic')
  port++

  const name = 'test-basic-client'

  await sleep(waitTime)

  t.deepEqual(
    getGraph('test-basic').listClients(),
    { [name]: { name, member: name, _isConnected: true } }
  )
})

test('Message - all', async (t) => {
  initServer('test-message-all')
  const client1 = initClient('test-message-all', 'client1')
  const client2 = initClient('test-message-all', 'client2')
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
  initServer('test-message-_to')
  const client1 = initClient('test-message-_to', 'client1')
  const client2 = initClient('test-message-_to', 'client2')
  const client3 = initClient('test-message-_to', 'client3')
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
  initServer('test-message-connection')
  const client1 = initClient('test-message-connection', 'client1')
  const client2 = initClient('test-message-connection', 'client2')
  const client3 = initClient('test-message-connection', 'client3')
  port++

  await sleep(waitTime)

  client1.emit('helloOut', 'world')
  getGraph('test-message-connection').addConnections([
    {
      src: { clientName: 'client1', eventName: 'helloOut' },
      tgt: { clientName: 'client3', eventName: 'helloIn' }
    }
  ])

  const messages = []
  client1.on('*', data => t.deepEqual(data, 'world'))
  client2.on('*', data => t.deepEqual(data, 'world'))
  client3.on('helloIn', data => messages.push(data))

  await sleep(waitTime)

  t.deepEqual(messages, ['world'])
})
