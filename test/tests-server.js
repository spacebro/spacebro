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
