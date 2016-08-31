'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _socketioWildcard = require('socketio-wildcard');

var _socketioWildcard2 = _interopRequireDefault(_socketioWildcard);

var _dashboard = require('./dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _cliTable = require('cli-table');

var _cliTable2 = _interopRequireDefault(_cliTable);

var _mdns = require('mdns');

var _mdns2 = _interopRequireDefault(_mdns);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Default Config
var config = {
  server: {
    port: 8888,
    serviceName: 'spacebro'
  },
  verbose: true,
  events: [], // Useless
  _isCLI: false // Should be private
};

// Variables
var io = null;
var sockets = [];
var infos = {};

var reservedEvents = ['register'];
var table = new _cliTable2.default({
  head: ['Clients', 'Channel', 'Status'],
  colWidths: [25, 25, 15]
});

function init(configOption) {
  config = _lodash2.default.merge(config, configOption);
  process.title = config.server.serviceName;
  initSocketIO();
  initBroadcast();
  _dashboard2.default.init(config);
  log(config.server.serviceName, 'listening on port', config.server.port);
}

function initSocketIO() {
  io = (0, _socket2.default)(config.server.port);
  io.use((0, _socketioWildcard2.default)());
  io.on('connection', function (socket) {
    log('New socket connected');
    sockets.push(socket);
    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      log(fullname(socket), 'disconnected');
      quitChannel(socket, socket.channelName);
      updateTable();
    }).on('error', function (err) {
      log(fullname(socket), 'error:', err);
    }).on('register', function (data) {
      data = objectify(data);
      socket.clientName = data.clientName || socket.id;
      socket.channelName = data.channelName || 'default';
      socket.join(socket.channelName);
      log(fullname(socket), 'registered');
      joinChannel(socket, socket.channelName);
      updateTable();
    }).on('*', function (_ref) {
      var data = _ref.data;

      var _data = (0, _slicedToArray3.default)(data, 2);

      var eventName = _data[0];
      var args = _data[1];

      if ((typeof args === 'undefined' ? 'undefined' : (0, _typeof3.default)(args)) !== 'object') {
        args = { data: args };
        args.altered = true;
      }
      if (reservedEvents.indexOf(eventName) !== -1) return;
      if (!socket.clientName) {
        log(fullname(socket), 'tried to trigger', eventName, 'with data:', args);
        return;
      }
      log(fullname(socket), 'triggered', eventName, 'with data:', args);
      registerEvent(eventName, socket.channelName);

      if (args._to !== null) {
        var target = sockets.find(function (s) {
          return s.clientName === args._to && s.channelName === socket.channelName;
        });
        if (target) {
          log('Target found:', args._to);
          if (args.altered) {
            args = args.data;
          }
          io.to(target.id).emit(eventName, args);
          return;
        } else {
          log('Target not found:', args._to);
        }
      }
      if (args.altered) {
        args = args.data;
      }
      io.to(socket.channelName).emit(eventName, args);
    });
  });
}

function initBroadcast() {
  _mdns2.default.createAdvertisement(_mdns2.default.tcp(config.server.serviceName), config.server.port).start();
}

module.exports = { init: init, infos: infos };

// = Helpers ===
function log() {
  if (!config.verbose) return;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (config._isCLI) {
    _dashboard2.default.log.apply(_dashboard2.default, args);
  } else {
    var _console;

    (_console = console).log.apply(_console, ['SpaceBro -'].concat(args));
  }
}

function joinChannel(socket, channelName) {
  socket.join(channelName);
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].clients = _lodash2.default.union(infos[channelName].clients, [socket.clientName]);
  _dashboard2.default.setInfos(infos);
}

function quitChannel(socket, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  _lodash2.default.remove(infos[channelName].clients, function (s) {
    return s === socket.clientName;
  });
  _dashboard2.default.setInfos(infos);
}

function registerEvent(eventName, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].events = _lodash2.default.union(infos[channelName].events, [eventName]);
  _dashboard2.default.setInfos(infos);
}

function updateTable() {
  if (!config.verbose || config._isCLI) return;
  table.length = 0;
  sockets.forEach(function (socket) {
    if (socket && socket.clientName && socket.channelName) {
      table.push([socket.clientName, socket.channelName, socket.connected ? 'online' : 'offline']);
    }
  });
  console.log(table.toString());
}

function objectify(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.log('Socket error:', e);
      return {};
    }
  }
  return data;
}

function fullname(socket) {
  return !socket.clientName ? 'unregistered socket #' + socket.id : socket.channelName + '@' + socket.clientName;
}