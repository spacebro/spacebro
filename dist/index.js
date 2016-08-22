'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _socketioWildcard = require('socketio-wildcard');

var _socketioWildcard2 = _interopRequireDefault(_socketioWildcard);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

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
  events: [] // Useless
};

// Variables
var io = null;
var sockets = [];

var reservedEvents = ['register'];

function init(configOption) {
  config = _lodash2.default.merge(config, configOption);
  process.title = config.server.serviceName;
  initSocketIO();
  initBroadcast();
  log(config.server.serviceName, 'listening on port', config.server.port);
}

function initSocketIO() {
  io = (0, _socket2.default)(config.server.port);
  io.use((0, _socketioWildcard2.default)());
  io.on('connection', function (socket) {
    log('New socket connected');
    sockets.push(socket);
    socket.on('disconnect', function () {
      log(fullname(socket), 'disconnected');
      sockets.splice(sockets.indexOf(socket), 1);
    }).on('error', function (err) {
      log(fullname(socket), 'error:', err);
    }).on('register', function (data) {
      data = objectify(data);
      socket.clientName = data.clientName || socket.id;
      socket.channelName = data.channel || 'default';
      socket.join(socket.channelName);
      log(fullname(socket), 'registered');
    }).on('*', function (_ref) {
      var data = _ref.data;

      var _data = _slicedToArray(data, 2);

      var eventName = _data[0];
      var args = _data[1];

      if (reservedEvents.indexOf(eventName) !== -1) return;
      if (!socket.clientName) {
        log(fullname(socket), 'tried to trigger', eventName, 'with data:', args);
        return;
      }
      log(fullname(socket), 'triggered', eventName, 'with data:', args);
      io.to(socket.channelName).emit(eventName, args);
    });
  });
}

function initBroadcast() {
  _mdns2.default.createAdvertisement(_mdns2.default.tcp(config.server.serviceName), config.server.port).start();
}

module.exports = { init: init };

// = Helpers ===
function log() {
  var _console;

  if (!config.verbose) return;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  (_console = console).log.apply(_console, ['SpaceBro -'].concat(args));
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