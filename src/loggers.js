'use strict'

import jsonColorz from 'json-colorz'
import { format } from 'date-fns'
import { getSettings } from 'standard-settings'
import dashboard from './dashboard'

const settings = getSettings()

const verbose = !settings.mute
const showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN
const semiverbose = (showdashboard || settings.semiverbose) && verbose

function log (...args) {
  if (!verbose) {
    return
  }
  if (showdashboard) {
    dashboard.log(...args)
  } else {
    console.log(`${format(new Date(), 'yyyy:MM:dd-HH:mm:ss')} - `, ...args)
  }
}

function logData (data) {
  if (!verbose || semiverbose) {
    return
  }
  jsonColorz(data)
}

function logError (...args) {
  if (!verbose) {
    return
  }
  if (showdashboard) {
    dashboard.log(...args)
  } else {
    console.error(`${format(new Date(), 'yyyy:MM:dd-HH:mm:ss')} - `, ...args)
  }
}

function logErrorData (data) {
  if (!verbose || semiverbose) {
    return
  }
  jsonColorz(data)
}

module.exports = {
  log,
  logData,
  logError,
  logErrorData
}
