'use strict'

import jsonColorz from 'json-colorz'
import moment from 'moment'
import { getSettings } from 'standard-settings'
import dashboard from './dashboard'

const settings = getSettings()

const verbose = !settings.mute
const showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN
const semiverbose = (showdashboard || settings.semiverbose) && verbose
const deepIterator = require('deep-iterator').default

String.prototype.trunc = function (n) {
  return this.substr(0, n - 1) + (this.length > n ? '...' : '')
}

let recursiveEllipsis = function (data) {
  for (let { value, parent, key } of deepIterator(data)) {
    if (typeof value === 'string') {
      parent[key] = value.trunc(80)
    }
  }
  return data
}

function log (...args) {
  if (!verbose) {
    return
  }
  if (showdashboard) {
    dashboard.log(...args)
  } else {
    console.log(`${moment().format('YYYY-MM-DD-HH:mm:ss')} - `, ...args)
  }
}

function logData (data) {
  if (!verbose || semiverbose) {
    return
  }

  jsonColorz(recursiveEllipsis(JSON.parse(JSON.stringify(data))))
}

function logError (...args) {
  if (!verbose) {
    return
  }
  if (showdashboard) {
    dashboard.log(...args)
  } else {
    console.error(`${moment().format('YYYY-MM-DD-HH:mm:ss')} - `, ...args)
  }
}

function logErrorData (data) {
  if (!verbose || semiverbose) {
    return
  }
  jsonColorz(recursiveEllipsis(JSON.parse(JSON.stringify(data))))
}

module.exports = {
  log,
  logData,
  logError,
  logErrorData
}
