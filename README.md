# chywalry

> Here comes the chywalry.

Chywalry's here to help you connect your app together. You define a list of events, and make sure your client apps calls and listen to them. It also provide an image writer utility via the `write-img` event (see below).

## Installation

## Prerequisites

Chywalry uses:
* [socket.io](http://socket.io) to broadcast events
* [imagemagick-native](https://github.com/elad/node-imagemagick-native) to manipulate image before writing them to disk
* [mdns](https://github.com/agnat/node_mdns) to allow your app to connect seamlessly

It's compatible with node >= `v0.8.x`.

### Linux

```
$ sudo apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential
$ sudo apt-get install imagemagick libmagick++-dev
```

### OSX

```
$ brew install imagemagick
```

## Install dependencies

```
$ npm i
```

## Configure

```
$ cp config.example.json config.json
```

And fill it with your own settings.

## Usage

```
$ npm start
```

## Develop

You can test writing images with [`dev/send-img.js`](/dev/send-img.js) script. Run `$ npm run send-img`.

Please follow [standard style](https://github.com/feross/standard) conventions.
