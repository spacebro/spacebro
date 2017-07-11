'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

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

var settings = require('standard-settings').getSettings();
var jsonColorz = require('json-colorz');

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
var connections = [];
var infos = {};

var reservedEvents = ['register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients'];

function init(configOption) {
  (0, _assign2.default)(config, configOption);
  process.title = config.server.serviceName;
  if (config.showdashboard) {
    _dashboard2.default.init(config);
  }
  addConnectionsFromSettings(settings.connections);
  config.verbose && log('init socket.io');
  initSocketIO();
  config.verbose && log(config.server.serviceName, 'listening on port', config.server.port);
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
        config.verbose && log(fullname(socket) + ' emitted event "' + eventName + '" connected to ' + fullname(target) + ' event "' + c.tgt.eventName + '"');
      } else {
        config.verbose && log('target not found:', c.tgt.clientName);
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
    config.verbose && log((socket ? fullname(socket) : '') + ' added connection');
    !config.semiverbose && jsonColorz(data);
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
  config.verbose && log((socket ? fullname(socket) : '') + ' removed connection');
  !config.semiverbose && jsonColorz(data);
}

function getClients() {
  var clients = {};
  sockets.forEach(function (s) {
    clients[s.clientDescription.name] = s.clientDescription;
  });
  return clients;
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
      socket.clientDescription = data.client || data.clientName || socket.id;
      // legacy
      if (typeof socket.clientDescription === 'string') {
        socket.clientDescription = { name: socket.clientDescription };
      }

      socket.channelName = data.channelName || 'default';
      socket.join(socket.channelName);
      config.verbose && log(fullname(socket), 'registered');
      !config.semiverbose && jsonColorz(data);

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
        config.verbose && log(fullname(socket) + ' replaced connections');
        !config.semiverbose && jsonColorz(data);
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
      config.verbose && log(fullname(socket) + ' emitted event "' + eventName + '"');
      !config.semiverbose && jsonColorz(data);

      sendToConnections(socket, eventName, args);

      if (!socket.clientDescription.name) return;

      if (args._to !== null && args._to !== undefined) {
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
  infos[channelName].clients = _lodash2.default.union(infos[channelName].clients, [{ 'clientName': socket.clientDescription.name, 'ip': socket.handshake.address, 'hostname': socket.handshake.headers.host }]);
  config.showdashboard && _dashboard2.default.setInfos(infos);
}

function quitChannel(socket, channelName) {
  if (!_lodash2.default.has(infos, channelName)) infos[channelName] = { events: [], clients: [] };
  _lodash2.default.remove(infos[channelName].clients, function (s) {
    return s.clientName === socket.clientDescription.name;
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
  return socket.clientDescription.name ? socket.clientDescription.name + '@' + socket.channelName : 'unregistered socket #' + socket.id;
}