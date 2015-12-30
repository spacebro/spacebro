'use strict'

const fs = require('fs')
const _ = require('lodash')
const mdns = require('mdns')
const shortid = require('shortid')
const pathHelper = require('path')
const config = require('./config.json')
const imagemagick = require('imagemagick-native')
let io = require('socket.io')(config.server.port)
let triggers = ['#supermarche', '#appartement-shazam', '#appartement-mi-temps', '#dans-la-ville', '#fan-zone-precommande', '#fan-zone-selfie', '#bar']

let triggersA = _.map(triggers, function (n) { return 'A' + n })
let triggersB = _.map(triggers, function (n) { return 'B' + n })
triggers = triggers.concat(triggersA).concat(triggersB)

console.log('server.js - listening on port', config.server.port)

var ad = mdns.createAdvertisement(mdns.tcp(config.server.serviceName), config.server.port)
ad.start()

io.on('connection', function (socket) {
  console.log('connection'.bold.green)
  socket
    .on('disconnect', function () {
      console.log('disconnect'.bold.red)
    })
    .on('error', function (err) {
      console.log('error'.bold.red)
      console.log(err)
    })
    .on('write-img', function (img) {
      console.log('img'.cyan)

      let base64Data = img.replace(/^data:image\/png;base64,/, '')
      let name = shortid.generate() + '.png'
      let path = config.server.destinationPath
      let tmpPath = config.server.tmpDestinationPath
      let destinationFile = pathHelper.join(path, name)
      let tmpDestinationFile = pathHelper.join(tmpPath, name)

      console.log('server.js - tmpDestinationFile:', tmpDestinationFile)

      fs.writeFile(tmpDestinationFile, base64Data, 'base64', function (err) {
        if (err) {
          console.log('server.js - error while writing: '.bold.red)
          console.log(err)
        } else {
          fs.writeFileSync(destinationFile, imagemagick.convert({
            srcData: fs.readFileSync(tmpDestinationFile),
            width: 1920,
            height: 1080,
            resizeStyle: 'aspectfill', // is the default, or 'aspectfit' or 'fill'
            gravity: 'Center' // optional: position crop area when using 'aspectfill'
          }))
        }
      })
    })
    .on('new-media', function (data) {
      io.emit('new-media', data)
    })
    .on('goLive', function () {
      io.emit('live')
    })
    .on('goScreensaver', function () {
      io.emit('screensaver')
    })
    .on('shootHands', function () {
      console.log('shootHands')
      io.emit('shootHands')
    })
    .on('tactileConnection', function () {
      console.log('Tactile connexion'.bold.cyan)
    })
    .on('signature', function (data) {
      // data contains property img with the dataURL of the signature
      io.emit('addSignature', data)
    })
    .on('confirm-image', function () {
      io.emit('confirm-image')
    })
    .on('retry', function () {
      io.emit('retry')
    })
    .on('backHome', function () {
      io.emit('backHome')
    })
    .on('startTimer', function () {
      io.emit('startTimer')
    })
    .on('shoot', function (data) {
      io.emit('shoot', data)
    })
    .on('visuReady', function () {
      io.emit('visuReady')
    })
})
