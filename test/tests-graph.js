import test from 'ava'

import { Graph, getGraph, isValidConnection } from '../src/graph'

test('Graph - clients - construction', (t) => {
  const graph = new Graph()

  t.deepEqual(graph.listClients(), {})
})

test('Graph - clients - add', (t) => {
  const graph = new Graph()

  graph.addClient(
    { name: 'myClient', description: 'Dummy Client' }
  )
  graph.addClient(
    { name: 'myClient_2', description: 'Other Dummy Client' }
  )
  t.deepEqual(graph.listClients(), {
    myClient: { name: 'myClient', description: 'Dummy Client' },
    myClient_2: { name: 'myClient_2', description: 'Other Dummy Client' }
  })
})

test('Graph - clients - add duplicate', (t) => {
  const graph = new Graph()

  let i = 0
  for (const name of ['myClient', 'myClient', 'myClient_2']) {
    graph.addClient({
      name,
      description: `Client n${i}`
    })
    i++
  }
  t.deepEqual(graph.listClients(), {
    myClient: { name: 'myClient', description: 'Client n0' },
    myClient_2: { name: 'myClient_2', description: 'Client n2' }
  })
})

test('Graph - clients - remove', (t) => {
  const graph = new Graph()

  let i = 0
  for (const name of ['myClient', 'myClient', 'myClient_2', 'myClient_3']) {
    graph.addClient({
      name,
      description: `Client n${i}`
    })
    i++
  }
  graph.removeClient('myClient')
  graph.removeClient('myClient_2')
  t.deepEqual(graph.listClients(), {
    myClient_3: { name: 'myClient_3', description: 'Client n3' }
  })
})

test('Graph - clients - clear', (t) => {
  const graph = new Graph()

  for (const name of ['myClient', 'myClient', 'myClient_2', 'myClient_3']) {
    graph.addClient({
      name,
      description: `Whatever`
    })
  }
  graph.clearClients()
  t.deepEqual(graph.listClients(), {})
})

test('Graph - clients - get', (t) => {
  const graph = new Graph()

  let i = 0
  for (const name of ['myClient', 'myClient', 'myClient_2', 'myClient_3']) {
    graph.addClient({
      name,
      description: `Client n${i}`
    })
    i++
  }
  t.deepEqual(
    graph.getClient('myClient'),
    { name: 'myClient', description: 'Client n0' }
  )
  t.deepEqual(
    graph.getClient('myClient_3'),
    { name: 'myClient_3', description: 'Client n3' }
  )
})

test('Graph - connections - construction', (t) => {
  const graph = new Graph()

  t.deepEqual(graph.listConnections(), [])
})

const connections = [
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in1' }
  },
  {
    src: { clientName: 'clientA', eventName: 'out2' },
    tgt: { clientName: 'clientB', eventName: 'in2' }
  },
  // almost duplicates
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in2' }
  },
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientC', eventName: 'in1' }
  },
  // duplicate
  {
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in1' }
  }
]

test('Graph - connections - add', (t) => {
  const graph = new Graph()

  graph.addConnections(connections.slice())
  t.deepEqual(graph.listConnections(), connections.slice(0, 4))
  graph.addConnections(connections.slice(0, 2))
  t.deepEqual(graph.listConnections(), connections.slice(0, 4))
})

test('Graph - connections - remove and clear', (t) => {
  const graph = new Graph()

  graph.addConnections(connections.slice(0, 2))
  graph.removeConnection({
    src: { clientName: 'clientA', eventName: 'out1' },
    tgt: { clientName: 'clientB', eventName: 'in1' }
  })
  t.deepEqual(graph.listConnections(), [{
    src: { clientName: 'clientA', eventName: 'out2' },
    tgt: { clientName: 'clientB', eventName: 'in2' }
  }])
  graph.addConnections(connections.slice(2, 4))
  graph.clearConnections()
  t.deepEqual(graph.listConnections(), [])
})

test('Graph - connections - getTargets', (t) => {
  const graph = new Graph()

  graph.addConnections(connections.slice())
  t.deepEqual(graph.listConnections(), connections.slice(0, 4))

  t.deepEqual(graph.getTargets('clientA', 'doesntExist'), [])
  t.deepEqual(graph.getTargets('doesntExist', 'out1'), [])

  t.deepEqual(graph.getTargets('clientA', 'out1'), [
    { clientName: 'clientB', eventName: 'in1' },
    { clientName: 'clientB', eventName: 'in2' },
    { clientName: 'clientC', eventName: 'in1' }
  ])
})

test('Graph - getGraph', (t) => {
  const graph = getGraph('foobar')

  t.deepEqual(graph, new Graph())

  getGraph('foobar').addClient(
    { name: 'myClient', description: 'Dummy Client' }
  )
  t.deepEqual(graph.listClients(), {
    myClient: { name: 'myClient', description: 'Dummy Client' }
  })
})

test('Graph - isValidConnection', (t) => {
  for (const connection of connections) {
    t.true(isValidConnection(connection))
  }

  const invalidConnections = [
    [],
    {},
    {
      src: { clientName: 'clientA' },
      tgt: { clientName: 'clientB', eventName: 'in1' }
    },
    {
      src: { clientName: 'clientA', eventName: 'out1' },
      tgt: { eventName: 'in1' }
    },
    {
      src: { clientName: 'clientA', eventName: 'out1' }
    },
    {
      tgt: { clientName: 'clientB', eventName: 'in1' }
    },
    {
      src: { clientName: 'clientA', eventName: 'out1', hello: 'world' },
      tgt: { clientName: 'clientB', eventName: 'in1' }
    },
    {
      src: { clientName: 'clientA', eventName: 'out1' },
      tgt: { clientName: 'clientB', eventName: 'in1', foo: 'bar' }
    }
  ]

  for (const connection of invalidConnections) {
    t.false(isValidConnection(connection))
  }
})
