'use strict'

const spacebro = require('../..')
spacebro.init({
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: true,
  showdashboard: true
})
