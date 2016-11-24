'use strict';

var _blessed = require('blessed');

var _blessed2 = _interopRequireDefault(_blessed);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var screen = null;
var logText = null;
var clientTable = null;
var eventTable = null;

var color = 'blue';

function init(config) {
  // Create a screen object.
  screen = _blessed2.default.screen({
    smartCSR: true,
    title: 'spacebro server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  var log = _blessed2.default.box({
    label: 'Log',
    padding: 1,
    width: '100%',
    height: '70%',
    left: '0%',
    top: '0%',
    border: { type: 'line' },
    style: {
      // fg: -1,
      transparent: false,
      border: { fg: color }
    }
  });
  screen.append(log);

  logText = _blessed2.default.log({
    parent: log,
    tags: true,
    width: '100%-5',
    scrollable: true,
    input: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true
  });

  var clientBox = _blessed2.default.box({
    label: 'Clients',
    tags: true,
    padding: 1,
    width: '100%',
    height: '30%',
    left: '0%',
    top: '70%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  });

  clientTable = _blessed2.default.table({
    parent: clientBox,
    height: '100%',
    width: '100%',
    align: 'left',
    pad: 1,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
      ch: ' ',
      inverse: true
    },
    keys: true,
    vi: true,
    mouse: true,
    data: [['Name', 'Channel']]
  });
  screen.append(clientBox);

  // Quit on Escape, q, or Control-C.
  screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
  });

  // Render the screen.
  screen.render();
}

function log() {
  var _logText;

  (_logText = logText).log.apply(_logText, arguments);
}

function setInfos(data) {
  var clients = [['Name', 'Channel']];

  var _loop = function _loop(channelName) {
    clients = _lodash2.default.union(clients, data[channelName].clients.map(function (c) {
      return [c, channelName];
    }));
  };

  for (var channelName in data) {
    _loop(channelName);
  }
  if (clientTable) {
    clientTable.setData(clients);
  }
}

module.exports = { init: init, log: log, setInfos: setInfos };