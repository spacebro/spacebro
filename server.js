'use strict'

const fs = require('fs')
const _ = require('lodash')
const mdns = require('mdns')
const colors = require('colors')
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
      console.log('server.js - socket error: %s'.bold.red, err)
    })
    .on('write-img', function (imgDataURL) {
      let base64Data = imgDataURL.replace(/^data:image\/png;base64,/, '')
      let name = shortid.generate() + '.png'
      let path = config.image.path.final
      let tmpPath = config.image.path.tmp
      let destinationFile = pathHelper.join(path, name)
      let tmpDestinationFile = pathHelper.join(tmpPath, name)

      fs.writeFile(tmpDestinationFile, base64Data, 'base64', (err) => {
        if (err) {
          console.log('server.js - error writing tmp: %s'.bold.red, err)
        } else {
          console.log('server.js - tmp file %s written'.cyan, tmpDestinationFile)
          let resized = imagemagick.convert({
            srcData: fs.readFileSync(tmpDestinationFile),
            width: config.image.resized.width,
            height: config.image.resized.height,
            resizeStyle: config.image.resized.style, // is the default, or 'aspectfit' or 'fill'
            gravity: config.image.resized.gravity // optional: position crop area when using 'aspectfill'
          })
          fs.writeFileSync(destinationFile, resized, {encoding: 'base64'}, (err) => {
            if (err) {
              console.log('server.js - error writing file: %s'.bold.red, err)
            } else {
              console.log('server.js - file %s written'.green, destinationFile)
            }
          })
        }
      })
    })

  for (let event of config.events) {
    socket.on(event, function (datas) {
      console.log('server.js - event %s triggered with datas: %s', event, datas)
      io.emit(event, datas)
    })
  }
})
