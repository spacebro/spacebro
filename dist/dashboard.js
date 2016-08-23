'use strict';

var _blessed = require('blessed');

var _blessed2 = _interopRequireDefault(_blessed);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var screen = void 0,
    logText = void 0,
    clientTable = void 0,
    eventTable = void 0;

var color = 'green';

function init(config) {
  // Create a screen object.
  screen = _blessed2.default.screen({
    smartCSR: true,
    title: 'SpaceBro Server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  var log = _blessed2.default.box({
    label: 'Log',
    padding: 1,
    width: '100%',
    height: '50%',
    left: '0%',
    top: '0%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  });

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

  screen.append(log);

  var clientBox = _blessed2.default.box({
    label: 'Clients',
    tags: true,
    padding: 1,
    width: '50%',
    height: '50%',
    left: '0%',
    top: '50%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  });

  clientTable = _blessed2.default.table({
    parent: clientBox,
    height: '100%',
    width: '100%-5',
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

  var eventBox = _blessed2.default.box({
    label: 'Events',
    tags: true,
    padding: 1,
    width: '50%',
    height: '50%',
    left: '50%',
    top: '50%',
    border: { type: 'line' },
    style: {
      fg: -1,
      border: { fg: color }
    }
  });

  eventTable = _blessed2.default.table({
    parent: eventBox,
    height: '100%',
    width: '100%-5',
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

  screen.append(eventBox);

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
  var events = [['Name', 'Channel']];
  var clients = [['Name', 'Channel']];

  var _loop = function _loop(channelName) {
    events = _lodash2.default.union(events, data[channelName].events.map(function (e) {
      return [e, channelName];
    }));
    clients = _lodash2.default.union(clients, data[channelName].clients.map(function (c) {
      return [c, channelName];
    }));
  };

  for (var channelName in data) {
    _loop(channelName);
  }
  eventTable.setData(events);
  clientTable.setData(clients);
}

module.exports = { init: init, log: log, setInfos: setInfos };