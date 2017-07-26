'use strict';

var _jsonColorz = require('json-colorz');

var _jsonColorz2 = _interopRequireDefault(_jsonColorz);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _standardSettings = require('standard-settings');

var _dashboard = require('./dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var settings = (0, _standardSettings.getSettings)();

var verbose = !settings.mute;
var showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN;
var semiverbose = (showdashboard || settings.semiverbose) && verbose;

function log() {
  if (!verbose) {
    return;
  }

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (settings.showdashboard) {
    _dashboard2.default.log.apply(_dashboard2.default, args);
  } else {
    var _console;

    (_console = console).log.apply(_console, [(0, _moment2.default)().format('YYYY-MM-DD-HH:mm:ss') + ' - '].concat(args));
  }
}

function logData(data) {
  if (!verbose || semiverbose) {
    return;
  }
  (0, _jsonColorz2.default)(data);
}

function logError() {
  if (!verbose) {
    return;
  }

  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  if (settings.showdashboard) {
    _dashboard2.default.log.apply(_dashboard2.default, args);
  } else {
    var _console2;

    (_console2 = console).error.apply(_console2, [(0, _moment2.default)().format('YYYY-MM-DD-HH:mm:ss') + ' - '].concat(args));
  }
}

function logErrorData(data) {
  if (!verbose || semiverbose) {
    return;
  }
  (0, _jsonColorz2.default)(data);
}

module.exports = {
  log: log,
  logData: logData,
  logError: logError,
  logErrorData: logErrorData
};