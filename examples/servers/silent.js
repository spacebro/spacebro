'use strict'

const spacebro = require('../..')
spacebro.init({
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: false,
  showdashboard: false
})
