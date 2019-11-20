'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

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
var deepIterator = require('deep-iterator').default;

String.prototype.trunc = function (n) {
  return this.substr(0, n - 1) + (this.length > n ? '...' : '');
};

var recursiveEllipsis = function recursiveEllipsis(data) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)(deepIterator(data)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = _step.value,
          value = _step$value.value,
          parent = _step$value.parent,
          key = _step$value.key;

      if (typeof value === 'string') {
        parent[key] = value.trunc(80);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return data;
};

function log() {
  if (!verbose) {
    return;
  }

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (showdashboard) {
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

  (0, _jsonColorz2.default)(recursiveEllipsis(JSON.parse((0, _stringify2.default)(data))));
}

function logError() {
  if (!verbose) {
    return;
  }

  for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }

  if (showdashboard) {
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
  (0, _jsonColorz2.default)(recursiveEllipsis(JSON.parse((0, _stringify2.default)(data))));
}

module.exports = {
  log: log,
  logData: logData,
  logError: logError,
  logErrorData: logErrorData
};