'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _socketioWildcard = require('socketio-wildcard');

var _socketioWildcard2 = _interopRequireDefault(_socketioWildcard);

var _dashboard = require('./dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isBin = process.env.SPACEBRO_BIN || false;

// Default Config
var config = {
  server: {
    port: 6060,
    serviceName: 'spacebro'
  },
  verbose: true,
  showdashboard: isBin
};

// Variables
var io = null;
var sockets = [];
var infos = {};

var reservedEvents = ['register'];

function init(configOption) {
  (0, _assign2.default)(config, configOption);
  process.title = config.server.serviceName;
  if (config.showdashboard) {
    _dashboard2.default.init(config);
  }
  config.verbose && log('init socket.io');
  initSocketIO();
  config.verbose && log(config.server.serviceName, 'listening on port', config.server.port);
}

function observeEvent(eventName, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].events = _lodash2.default.union(infos[channelName].events, [eventName]);
  _dashboard2.default.setInfos(infos);
}

function initSocketIO() {
  io = (0, _socket2.default)(config.server.port);
  io.use((0, _socketioWildcard2.default)());
  io.on('connection', function (socket) {
    config.verbose && log('new socket connected');
    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      config.verbose && log(fullname(socket), 'disconnected');
      quitChannel(socket, socket.channelName);
    }).on('error', function (err) {
      config.verbose && log(fullname(socket), 'error:', err);
    }).on('register', function (data) {
      data = objectify(data);
      socket.clientName = data.clientName || socket.id;
      socket.channelName = data.channelName || 'default';
      socket.join(socket.channelName);
      config.verbose && log(fullname(socket), 'registered');
      joinChannel(socket, socket.channelName);
      io.to(socket.channelName).emit('new-member', { member: socket.clientName });
    }).on('*', function (_ref) {
      var data = _ref.data;

      var _data = (0, _slicedToArray3.default)(data, 2),
          eventName = _data[0],
          args = _data[1];

      if (reservedEvents.indexOf(eventName) > -1) return;

      observeEvent(eventName, socket.channelName);

      if ((typeof args === 'undefined' ? 'undefined' : (0, _typeof3.default)(args)) !== 'object') {
        args = { data: args };
        args.altered = true;
      }
      config.verbose && log(fullname(socket) + ' emitted event "' + eventName + '"' + (config.semiverbose ? '' : ', datas: ' + args));

      if (!socket.clientName) return;

      if (args._to !== null) {
        var target = sockets.find(function (s) {
          return s.clientName === args._to && s.channelName === socket.channelName;
        });
        if (target) {
          config.verbose && log('target found:', args._to);
          if (args.altered) {
            args = args.data;
          }
          io.to(target.id).emit(eventName, args);
          return;
        } else {
          config.verbose && log('target not found:', args._to);
        }
      }
      if (args.altered) {
        args = args.data;
      }
      io.to(socket.channelName).emit(eventName, args);
    });
  });
}

module.exports = { init: init, infos: infos };

/*
 * Helpers
 */
function log() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (config.showdashboard) {
    _dashboard2.default.log.apply(_dashboard2.default, args);
  } else {
    var _console;

    (_console = console).log.apply(_console, [(0, _moment2.default)().format('YYYY-MM-DD-HH:mm:ss') + ' - '].concat(args));
  }
}

function joinChannel(socket, channelName) {
  socket.join(channelName);
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].clients = _lodash2.default.union(infos[channelName].clients, [{ 'clientName': socket.clientName, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host }]);
  config.showdashboard && _dashboard2.default.setInfos(infos);
}

function quitChannel(socket, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  _lodash2.default.remove(infos[channelName].clients, function (s) {
    return s.clientName === socket.clientName;
  });
  config.showdashboard && _dashboard2.default.setInfos(infos);
}

function objectify(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      log('socket error:', e);
      return {};
    }
  }
  return data;
}

function fullname(socket) {
  return socket.clientName ? socket.clientName + '@' + socket.channelName : 'unregistered socket #' + socket.id;
}