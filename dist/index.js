'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

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

var settings = require('standard-settings').getSettings();
var jsonColorz = require('json-colorz');

// Variables
var io = null;
var sockets = [];
var connections = [];
var infos = {};

var reservedEvents = ['register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients'];

function init() {
  process.title = 'spacebro';
  settings.verbose = settings.mute === undefined || settings.mute === false;
  settings.showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN;
  settings.semiverbose = settings.showdashboard || settings.semiverbose;
  if (settings.showdashboard) {
    _dashboard2.default.init();
  }
  if (settings.connections) {
    addConnectionsFromSettings(settings.connections);
  }
  settings.verbose && log('init socket.io');
  initSocketIO();
  settings.verbose && log('spacebro listening on port', settings.server.port);
}

function observeEvent(eventName, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].events = _lodash2.default.union(infos[channelName].events, [eventName]);
  _dashboard2.default.setInfos(infos);
}

function sendToConnections(socket, eventName, args) {
  var matchingConnections = connections[socket.channelName].filter(function (c) {
    return c.src && c.src.clientName === socket.clientDescription.name && c.src.eventName === eventName;
  });
  if (matchingConnections) {
    matchingConnections.forEach(function (c) {
      var target = sockets.find(function (s) {
        return s.clientDescription.name === c.tgt.clientName && s.channelName === socket.channelName;
      });
      if (target) {
        io.to(target.id).emit(c.tgt.eventName, args);
        settings.verbose && log(fullname(socket) + ' emitted event "' + eventName + '" connected to ' + fullname(target) + ' event "' + c.tgt.eventName + '"');
      } else {
        settings.verbose && log('target not found:', c.tgt.clientName);
      }
    });
  }
}

function addConnectionsFromSettings(data) {
  var description = {
    clientDescription: {
      name: 'initial settings'
    }
  };
  (0, _keys2.default)(data).forEach(function (channelName) {
    description.channelName = channelName;
    addConnections(data[channelName], description);
  });
}

function addConnections(data, socket) {
  data = objectify(data);
  if (data) {
    if (Array.isArray(data)) {
      data.forEach(function (connection) {
        return addConnection(connection, socket);
      });
    } else {
      addConnection(data, socket);
    }
    // remove duplicated
    connections[socket.channelName] = _lodash2.default.uniqWith(connections[socket.channelName], _lodash2.default.isEqual);
    io && io.to(socket.channelName).emit('connections', connections[socket.channelName]);
  }
}

function addConnection(data, socket) {
  if (typeof data === 'string' || typeof data.data === 'string') {
    data = data.altered ? data.data : data;
    data = parseConnection(data);
  } else {
    // clean data
    data = {
      src: data.src,
      tgt: data.tgt
    };
  }
  if (data) {
    connections[socket.channelName] = connections[socket.channelName] || [];
    connections[socket.channelName].push(data);
    settings.verbose && log((socket ? fullname(socket) : '') + ' added connection');
    !settings.semiverbose && jsonColorz(data);
  }
}

function parseConnection(data, socket) {
  var regex = / ?([^ ]+) ?\/ ?([^ ]+) ?=> ?([^ ]+) ?\/ ?([^ ]+) ?/g;
  var match = regex.exec(data);
  var connection = void 0;
  if (match.length > 4) {
    connection = {
      src: {
        clientName: match[1],
        eventName: match[2]
      },
      tgt: {
        clientName: match[3],
        eventName: match[4]
      }
    };
  } else {
    log('can\'t parse connection \'$data');
  }
  return connection;
}

function removeConnections(data, socket) {
  data = objectify(data);
  if (data) {
    if (Array.isArray(data)) {
      data.forEach(function (connection) {
        return removeConnection(connection, socket);
      });
    } else {
      // clean data
      var connection = {
        src: data.src,
        tgt: data.tgt
      };
      removeConnection(connection, socket);
    }
  }
  io && io.to(socket.channelName).emit('connections', connections[socket.channelName]);
}

function removeConnection(data, socket) {
  _lodash2.default.remove(connections[socket.channelName], data);
  settings.verbose && log((socket ? fullname(socket) : '') + ' removed connection');
  !settings.semiverbose && jsonColorz(data);
}

function getClients() {
  var clients = {};
  sockets.forEach(function (s) {
    clients[s.clientDescription.name] = s.clientDescription;
  });
  return clients;
}

function initSocketIO() {
  io = (0, _socket2.default)(settings.server.port);
  io.use((0, _socketioWildcard2.default)());
  io.on('connection', function (socket) {
    settings.verbose && log('new socket connected');
    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      settings.verbose && log(fullname(socket), 'disconnected');
      quitChannel(socket, socket.channelName);
    }).on('error', function (err) {
      settings.verbose && log(fullname(socket), 'error:', err);
    }).on('register', function (data) {
      data = objectify(data);
      socket.clientDescription = data.client || data.clientName || socket.id;
      // legacy
      if (typeof socket.clientDescription === 'string') {
        socket.clientDescription = { name: socket.clientDescription };
      }

      socket.channelName = data.channelName || 'default';
      socket.join(socket.channelName);
      settings.verbose && log(fullname(socket), 'registered');
      !settings.semiverbose && jsonColorz(data);

      joinChannel(socket, socket.channelName);

      socket.clientDescription.member = socket.clientDescription.name; // legacy
      io.to(socket.channelName).emit('new-member', socket.clientDescription); // legacy
      io.to(socket.channelName).emit('newClient', socket.clientDescription);
    })
    // TODO: filter by channel
    .on('addConnections', function (data) {
      return addConnections(data, socket);
    })
    // TODO: filter by channel
    .on('removeConnections', function (data) {
      return removeConnections(data, socket);
    })
    // TODO: filter by channel
    .on('getConnections', function (data) {
      io.to(socket.id).emit('connections', connections[socket.channelName]);
    })
    // TODO: filter by channel
    .on('getClients', function (data) {
      io.to(socket.id).emit('clients', getClients());
    }).on('replaceConnections', function (data) {
      data = objectify(data);
      if (data) {
        if (Array.isArray(data)) {
          connections[socket.channelName] = data;
        } else {
          connections[socket.channelName] = [data];
        }
        settings.verbose && log(fullname(socket) + ' replaced connections');
        !settings.semiverbose && jsonColorz(data);
        // remove duplicated
        connections[socket.channelName] = _lodash2.default.uniqWith(connections[socket.channelName], _lodash2.default.isEqual);
      }
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
      settings.verbose && log(fullname(socket) + ' emitted event "' + eventName + '"');
      !settings.semiverbose && jsonColorz(data);

      sendToConnections(socket, eventName, args);

      if (!socket.clientDescription.name) return;

      if (args._to !== null && args._to !== undefined) {
        var target = sockets.find(function (s) {
          return s.clientName === args._to && s.channelName === socket.channelName;
        });
        if (target) {
          settings.verbose && log('target found:', args._to);
          if (args.altered) {
            args = args.data;
          }
          io.to(target.id).emit(eventName, args);
          return;
        } else {
          settings.verbose && log('target not found:', args._to);
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

  if (settings.showdashboard) {
    _dashboard2.default.log.apply(_dashboard2.default, args);
  } else {
    var _console;

    (_console = console).log.apply(_console, [(0, _moment2.default)().format('YYYY-MM-DD-HH:mm:ss') + ' - '].concat(args));
  }
}

function joinChannel(socket, channelName) {
  socket.join(channelName);
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  infos[channelName].clients = _lodash2.default.union(infos[channelName].clients, [{ 'clientName': socket.clientDescription.name, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host }]);
  settings.showdashboard && _dashboard2.default.setInfos(infos);
}

function quitChannel(socket, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  _lodash2.default.remove(infos[channelName].clients, function (s) {
    return s.clientName === socket.clientDescription.name;
  });
  settings.showdashboard && _dashboard2.default.setInfos(infos);
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
  return socket.clientDescription.name ? socket.clientDescription.name + '@' + socket.channelName : 'unregistered socket #' + socket.id;
}