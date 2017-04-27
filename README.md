# 🚀 Spacebro 💫

> In reference to [Spacebrew](http://docs.spacebrew.cc/) by Rockwell Lab (http://www.rockwellgroup.com/search/LAB)

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![node](https://img.shields.io/badge/node-4.0.x-brightgreen.svg)](https://nodejs.org/en/)
[![node](https://img.shields.io/badge/node-5.3.x-brightgreen.svg)](https://nodejs.org/en/)
[![node](https://img.shields.io/badge/node-6.x.x-brightgreen.svg)](https://nodejs.org/en/)

*Spacebro* automagically links apps between them. It binds them with `events`. You just start a spacebro server somewhere, connect your spacebro clients thanks to mdns/zeroconf/bonjour and listen to them events`.

## Prerequisites

Spacebro uses:

* [mdns](https://github.com/agnat/node_mdns) to allow your apps to connect seamlessly.
* [socket.io](http://socket.io) to broadcast events.

#### Linux

```bash
$ sudo apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential
```

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
$ spacebro --port 8888
# or
$ spacebro --port 8888 --servicename woowoo
# to view all possible arguments
$ spacebro --help
```

> NOTE: Default service name is `"spacebro"` and port number is `8888`.

### As a module

```bash
$ npm i --save spacebro
# or
$ yarn add spacebro
```

And configure it through a config JSON object:

```json
{
  "server": {
    "serviceName": "spacebro",
    "port": 8888
  }
}
```

* `serviceName` is the name that Spacebro will use over Zeroconf.
* `port` defines where the spacebro websocket (socket.io) will listen.

> NOTE: Default service name is `"spacebro"` and port number is `8888`.

This is useful if you want to use the `spacebro-client` as is. The spacebro client allows to connect your node application to spacebro server, just by requiring it.

See [spacebro-client](https://github.com/soixantecircuits/spacebro-client) to learn more.

For openFramework you can also use [ofxSpaceBro](https://github.com/soixantecircuits/ofxSpacebroClient).

## Options

|flag|what it does|
|:---|:---|
|`-h, --help`|output usage information|
|`-V, --version`|output the version number|
|`-S, --servicename [value]`|give the service a name|
|`-P, --port <n>`|give a port to spacebro|
|`-M, --mute`|option to hide informations|
|`--semiverbose`|do not show events datas in logs|
|`-H, --hidedashboard`|Allow to hide dashboard|
|`-C, --config [value]`|give a path to config.json file|

## Events

#### `new-member`

spacebro broadcasts a `new-member` event when a new connection is created, with the connection name as `member` property value. Typically, you'd do on the client side:

```js
spacebroClient.on('new-member', (data) => {
  console.log(`${data.member} has joined.`)
})
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

### CLI tool

The spacebro ecosystem is ever growing, and it now has a dedicated [spacebro-client-CLI](https://github.com/soixantecircuits/spacebro-client-cli) that is super useful for quick testing both servers and clients.

## Contribute

We use galaxies names for our release name, listed here [here](https://en.wikipedia.org/wiki/List_of_galaxies). We are currently at Black Eye.

You can check the `examples/` folder, as well as the [spacebro-client](https://github.com/soixantecircuits/spacebro-client) examples for real life examples.

Please follow [standard style](https://github.com/feross/standard) conventions.
