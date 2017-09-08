# 🚀 Spacebro 💫

> In reference to [Spacebrew](http://docs.spacebrew.cc/) by Rockwell Lab (http://www.rockwellgroup.com/search/LAB)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![node](https://img.shields.io/badge/node-4.0.x-brightgreen.svg)](https://nodejs.org/en/)
[![node](https://img.shields.io/badge/node-5.3.x-brightgreen.svg)](https://nodejs.org/en/)
[![node](https://img.shields.io/badge/node-6.x.x-brightgreen.svg)](https://nodejs.org/en/)

*Spacebro* automagically links apps between them. It binds them with `events`. You just start a spacebro server somewhere, connect your spacebro clients and listen to events`.

## Prerequisites

Spacebro uses:

* [socket.io](http://socket.io) to broadcast events.

## Usage

### As a CLI tool

Install it globally

```bash
$ npm i -g spacebro
# or
$ yarn global add spacebro
```

And just run the `bin` :

```bash
$ spacebro
```

You can configure it via CLI args:

```bash
$ spacebro --server.port 8888
# to view all possible arguments
$ spacebro --help
```

> NOTE: Spacebro uses
> [standard-settings](https://github.com/soixantecircuits/standard-settings/), see the doc there to change settings via argv, env or file

### As a module

```bash
$ npm i --save spacebro
# or
$ yarn add spacebro
```

And then connection with a `spacebro-client` as is. The spacebro client allows to connect your node application to spacebro server, just by requiring it.

See [spacebro-client](https://github.com/soixantecircuits/spacebro-client) to learn more.

For openFramework you can also use [ofxSpaceBro](https://github.com/soixantecircuits/ofxSpacebroClient).

For python you can also use [pySpacebroClient](https://github.com/spacebro/pySpacebroClient).

## Options

|flag|what it does|
|:---|:---|
|`-h, --help`|output usage information|
|`-V, --version`|output the version number|
|`-P, --server.port <n>`|give a port to spacebro|
|`-M, --mute`|option to hide informations|
|`--semiverbose`|do not show events datas in logs|
|`-H, --hidedashboard`|Allow to hide dashboard|

## API

Once connected, you can interact with spacebro, to know which other
client is connected, what are the connections between them, add your own
connections, ...

A `connection` is a link between an output of a client and an input of
an other client. It is explained in details below.

#### `register`

Mandatory event for a client to send to spacebro, this is implemented
inside `spacebro-client` so you should not have to use this, unless you
are writing a client plugin in an other language.

The data sent with the `register` event should include the keys below:

```
{
  channelName: 'media-stream', // the socket.io channel to connect to
  client: {
    name: 'myclientname',
    description: 'Describe here what your client does',
    in: {// input events your client will react to
      inMedia: {
        eventName: "inMedia",
        description: "Describe the input event here",
        type: "all" // use all by default, or mention a type of data
expected
      },
      otherInput: {
        ...
      }
    },
    out: { // output events your client will send
      outMedia: {
        eventName: "outMedia",
        description: "Describe the input event here",
        type: "all" // use all by default, or mention a type of data
      }
    }
  }
}
```

#### `addConnections`

Add a connection between an output of a client and the input of an other
client.

The data can be a connection or an array of connections with a
connection respecting this schema

```
{
  src: {
    clientName: 'myclient',
    eventName: 'outMedia'
  },
  tgt: {
    clientName: 'myotherclient',
    eventName: 'inMedia'
  }
}
```

or a string or array of strings with this syntax:

```
myclient/outMedia => myotheclient/inMedia
```

When `myclient` emits a `outMedia` event, it will be forwarded to
`myotherclient` with the event name `inMedia`

A `connection` event is emitted to all clients with the updated

#### `removeConnections`

Removes all connections listed in the data of this event: an array or
single connection, in the schema seen above.  
A `connection` event is emitted to all clients with the updated
connections list

#### `replaceConnections`

Removes all connections on the current channel, and add the connections
listed in the data of this event.  
A `connection` event is emitted to all clients with the updated
connections list

#### `getConnections`

Ask for a `connection` event, which is emitted to all clients with the
current connection list on the current channel.

#### `getClients`

Ask for a `clients` event, which is emitted to all clients with the
current client list on the current channel.

#### `saveGraph`

Save the current state: list of clients and list of connections, into
the settings file mentioned when running spacebro  

For example, run 

```
spacebro --settings /path/to/my-settings-file.json
```

Connect some clients, add some connections, send a `saveGraph` event, and the state of the graph will be saved in this settings file.

## Events

#### `newClient`

spacebro broadcasts a `newClient` event when a new connection is created, with the client name as `client.name` property value. Typically, you'd do on the client side:

```js
spacebroClient.on('newClient', (data) => {
  console.log(`${data.client.name} has joined.`)
})
```

#### `clients`

spacebro broadcasts a `clients` event after a client registered or after
receiving a `getClients` event.

data is an array of clients.

#### `connections`

spacebro broadcasts a `connections` event after a new connection is added or after
receiving a `getConnections` event.

data is an array of connections in the schema descibed below:

```
{
  src: {
    clientName: 'myclient',
    eventName: 'outMedia'
  },
  tgt: {
    clientName: 'myiotherclient',
    eventName: 'inMedia'
  }
}
```


## Troubleshooting

### ping pong

Do not try to test with `'ping'` and `'pong'` events, those are reserved.

```
- `ping`. Fired when a ping packet is written out to the server.
- `pong`. Fired when a pong is received from the server.
```
*[source](https://github.com/socketio/socket.io-client/issues/1022)*

## Test

```
npm run test
```

## Contribute

You can develop on spacebro, by running:

`yarn dev`

you can build with `yarn build`

We use galaxies names for our release name, listed here [here](https://en.wikipedia.org/wiki/List_of_galaxies). We are currently at Black Eye.

You can check the `examples/` folder, as well as the [spacebro-client](https://github.com/soixantecircuits/spacebro-client) examples for real life examples.

Please follow [standard style](https://github.com/feross/standard) conventions.
