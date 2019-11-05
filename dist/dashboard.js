'use strict';

var _blessed = require('blessed');

var _blessed2 = _interopRequireDefault(_blessed);

var _dateFns = require('date-fns');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var screen = null;
var logText = null;
var clientTable = null;
var eventTable = null;
var clientTableHeader = [['Name', 'IP', 'Host connexion', 'Channel']];

var color = 'blue';

function init() {
  // Create a screen object.
  screen = _blessed2.default.screen({
    smartCSR: true,
    title: 'spacebro server',
    dockBorders: false,
    fullUnicode: true,
    autoPadding: true
  });

  var logBox = _blessed2.default.box({
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
  screen.append(logBox);

  logText = _blessed2.default.log({
    parent: logBox,
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
    width: '50%',
    height: '40%',
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
    data: clientTableHeader
  });
  screen.append(clientBox);

  var eventBox = _blessed2.default.box({
    label: 'Events',
    tags: true,
    padding: 1,
    width: '50%',
    height: '40%',
    left: '51%',
    top: '70%',
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

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  // logText.log(...args)
  (_logText = logText).log.apply(_logText, [(0, _dateFns.format)(new Date(), 'yyyy:MM:dd-HH:mm:ss') + ' - '].concat(args));
}

function setInfos(data) {
  var events = [['Name', 'Channel']];
  var clients = clientTableHeader;

  var _loop = function _loop(channelName) {
    events = _lodash2.default.union(events, data[channelName].events.map(function (e) {
      return [e, channelName];
    }));
    clients = _lodash2.default.union(clients, data[channelName].clients.map(function (client) {
      return [client.clientName, client.ip, client.hostname, channelName];
    }));
  };

  for (var channelName in data) {
    _loop(channelName);
  }
  if (eventTable) {
    eventTable.setData(events);
  }
  if (clientTable) {
    clientTable.setData(clients);
  }
}

function observeEvent(infos, eventName, channelName) {
  if (!_lodash2.default.has(infos, channelName)) {
    infos[channelName] = { events: [], clients: [] };
  }
  infos[channelName].events = _lodash2.default.union(infos[channelName].events, [eventName]);
  setInfos(infos);
}

function joinChannel(infos, socket, channelName) {
  infos[channelName] = infos[channelName] || { events: [], clients: [] };
  infos[channelName].clients = _lodash2.default.union(infos[channelName].clients, [{
    'clientName': socket.clientName,
    'ip': socket.handshake.address,
    'hostname': socket.handshake.headers.host
  }]);
  setInfos(infos);
}

function quitChannel(infos, socket, channelName) {
  infos[channelName] = infos[channelName] || { events: [], clients: [] };
  _lodash2.default.remove(infos[channelName].clients, function (s) {
    return s.clientName === socket.clientName;
  });
  setInfos(infos);
}

module.exports = {
  init: init,
  log: log,
  setInfos: setInfos,
  observeEvent: observeEvent,
  joinChannel: joinChannel,
  quitChannel: quitChannel
};