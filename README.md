# Spacebro
> In reference to Spacebrew by Rockwell Lab (http://www.rockwellgroup.com/search/LAB) 

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/) [![node](https://img.shields.io/badge/node-0.10.x-brightgreen.svg)](https://nodejs.org/en/) [![node](https://img.shields.io/badge/node-0.12.x-brightgreen.svg)](https://nodejs.org/en/) [![node](https://img.shields.io/badge/node-4.0.x-brightgreen.svg)](https://nodejs.org/en/) [![node](https://img.shields.io/badge/node-5.3.x-brightgreen.svg)](https://nodejs.org/en/)


*Spacebro* automagically links apps between them. It binds them based on `events`. It is here to help you connect your apps together.
You define a list of events, and make sure your client apps emits and listen to them.

It follow a centralized model where each apps automagically connects thru zeroconf and socket.io to the Spacebro server.
Then each of them register a supplementary list of events.

## Prerequisites

Space bro use:

* [mdns](https://github.com/agnat/node_mdns) to allow your app to connect seamlessly
* [socket.io](http://socket.io) to broadcast events
* [cli-table]() to display a list of connected clients
* [lodash]() to easily handle array manipulation

### Linux

```
$ sudo apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential
```

## Install Spacebro

```
$ npm i --save spacebro
```

You can install globally by using :

```
$ npm i -g --save spacebro
```


## Configure

Spacebro is awaiting a config file that looks like : 

```
{
  "server": {
    "port": 8888,
    "serviceName": "spacebro"
  },
  "events": ["event-1", "event-2", "event-3"]
}
```

The `port` define where Spacebro (socket.io) will listen.
The `serviceName` is the name that Spacebro will use over Zeroconf.
The `events` array allows you to define a list of events that you want
to register.



## Usage

```
const config = require('../config.json')
var spacebro = require('spacebro')
spacebro.init(config)
```

You can use the `bin` : 

`spacebro --port 8888`

or
`spacebro --port 8888 --servicename woowoo`

By default the service name is `spacebro` 

This is useful if you want to use the `spacebro-client` 

## Develop

You can test sending events with the [`dev/send-events.js`](/dev/send-events.js) script. Run `$ npm run send-events`.

Please follow [standard style](https://github.com/feross/standard) conventions.
