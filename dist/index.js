'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _values = require('babel-runtime/core-js/object/values');

var _values2 = _interopRequireDefault(_values);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _socketioWildcard = require('socketio-wildcard');

var _socketioWildcard2 = _interopRequireDefault(_socketioWildcard);

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _dashboard = require('./dashboard');

var _dashboard2 = _interopRequireDefault(_dashboard);

var _graph = require('./graph');

var _loggers = require('./loggers');

var _standardSettings = require('standard-settings');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var settings = (0, _standardSettings.getSettings)();

// Variables
var sockets = [];
var infos = {};

var reservedEvents = ['register', 'addConnections', 'removeConnections', 'replaceConnections', 'getConnections', 'getClients', 'saveGraph'];

function init() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  settings = (0, _assign2.default)(options, settings);
  process.title = 'spacebro';
  settings.verbose = settings.mute === undefined || settings.mute === false;
  settings.showdashboard = !settings.hidedashboard && process.env.SPACEBRO_BIN;
  settings.semiverbose = settings.showdashboard || settings.semiverbose;
  if (settings.showdashboard) {
    _dashboard2.default.init();
  }
  if (settings.graph) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)(settings.graph)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var channelName = _step.value;

        var settingsGraph = settings.graph[channelName];
        var graph = (0, _graph.getGraph)(channelName);

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = (0, _getIterator3.default)((0, _keys2.default)(settingsGraph.clients)), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var clientName = _step2.value;

            graph.addClient(settingsGraph.clients[clientName]);
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        graph.addConnections(settingsGraph.connections);
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
  }

  (0, _loggers.log)('init socket.io');
  _initSocketIO(settings, sockets);
  (0, _loggers.log)('spacebro listening on port', settings.server.port);
}

var _prevGraph = settings.graph || {};

function saveGraph(channelName) {
  if (!settings.settings) {
    return;
  }
  var newSettings = {
    server: settings.server,
    mute: settings.mute,
    semiverbose: settings.semiverbose,
    hidedashboard: settings.hidedashboard,
    graph: _prevGraph
  };
  var newGraph = (0, _graph.getGraph)(channelName);
  _prevGraph[channelName] = JSON.parse((0, _stringify2.default)({
    clients: newGraph._clients,
    connections: newGraph._connections
  }));
  for (var key in _prevGraph[channelName].clients) {
    var entry = _prevGraph[channelName].clients[key];
    entry = _lodash2.default.omit(entry, '_isConnected');
    _prevGraph[channelName].clients[key] = entry;
  }

  _fs2.default.writeFile(settings.settings, (0, _stringify2.default)(newSettings, null, 2) + '\n', function (err) {
    err && (0, _loggers.log)(err);
  });
}

function _initSocketIO(settings, sockets) {
  var _this = this;

  var newServer = (0, _socket2.default)(settings.server.port);

  function findSockets(channelName, clientName) {
    return sockets.filter(function (socket) {
      return socket.channelName === channelName && socket.clientName === clientName;
    });
  }

  newServer.use((0, _socketioWildcard2.default)());
  newServer.on('connection', function (newSocket) {
    (0, _loggers.log)('new socket connected');
    sockets.push(newSocket);

    function sendBack(eventName, data) {
      // return newServer && newServer.to(newSocket.id).emit(eventName, data)
      var args = Array.prototype.slice.call(arguments, 0);
      return newServer && newServer.to(newSocket.id).emit.apply(newServer.to(newSocket.id), args);
    }

    function sendToChannel(eventName, data) {
      // return newServer && newServer.to(newSocket.channelName).emit(eventName, data)
      try {
        var args = Array.prototype.slice.call(arguments, 0);
        return newServer && newServer.to(newSocket.channelName).emit.apply(newServer.to(newSocket.channelName), args);
      } catch (e) {
        console.error(e);
      }
    }

    var channelGraph = function channelGraph() {
      return (0, _graph.getGraph)(newSocket.channelName);
    };

    function _listClients() {
      var clients = channelGraph().listClients();

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = (0, _getIterator3.default)((0, _values2.default)(clients)), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var client = _step3.value;

          var clientSockets = findSockets(newSocket.channelName, client.name);
          client._isConnected = clientSockets.length > 0;
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return clients;
    }

    newSocket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(newSocket), 1);
      (0, _loggers.log)(_fullname(newSocket), 'disconnected');
      settings.showdashboard && _dashboard2.default.quitChannel(infos, newSocket, newSocket.channelName);
      sendToChannel('clients', _listClients());
    }).on('error', function (err) {
      (0, _loggers.logError)(_fullname(newSocket), 'error:', err);
    }).on('register', function (data) {
      data = _objectify(data);

      // legacy
      var clientDescription = data.client || data.clientName || newSocket.id;
      if (typeof clientDescription === 'string') {
        clientDescription = { name: clientDescription };
      }
      // legacy
      clientDescription.member = clientDescription.name;

      newSocket.clientName = clientDescription.name;
      newSocket.channelName = data.channelName || 'default';
      newSocket.join(newSocket.channelName);

      (0, _loggers.log)(_fullname(newSocket), 'registered');
      (0, _loggers.logData)(data);

      settings.showdashboard && _dashboard2.default.joinChannel(infos, newSocket, newSocket.channelName);

      channelGraph().addClient(clientDescription);
      sendToChannel('clients', _listClients());
      sendToChannel('newClient', clientDescription);
      // legacy
      sendToChannel('new-member', clientDescription);
    });

    function parseConnection(data) {
      var regex = / ?([^/]+) ?\/ ?([^=]+[^ ]) ?=> ?([^/]+) ?\/ ?([^/]+[^ ]) ?/g;
      var match = regex.exec(data);
      var connection = void 0;
      if (match && match.length > 4) {
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
        (0, _loggers.log)('cannot parse connection ' + data);
      }
      return connection;
    }

    function filterNewConnections(connections) {
      return _arrayify(connections).map(function (c) {
        if (typeof c === 'string' || typeof c.data === 'string') {
          c = c.altered ? c.data : c;
          return parseConnection(c);
        } else {
          return { src: c.src, tgt: c.tgt };
        }
      }).filter(function (connection, index) {
        if (!(0, _graph.isValidConnection)(connection)) {
          (0, _loggers.logError)(_fullname(newSocket), 'invalid connection object');
          (0, _loggers.logErrorData)(connection);
          return false;
        }
        return true;
      });
    }

    newSocket.on('addConnections', function (connections) {
      if (settings.security.clientCanEditConnections) {
        connections = filterNewConnections(connections);

        channelGraph().addConnections(connections);
        sendToChannel('connections', channelGraph().listConnections());

        (0, _loggers.log)(_fullname(newSocket) + ' added connections');
        (0, _loggers.logData)(connections);
      } else if (Array.isArray(connections) && connections.length > 0) {
        (0, _loggers.log)(_fullname(newSocket) + ' asked to add connections. But spacebro is in secured mode: connections are not editable.');
      }
    }).on('removeConnections', function (connections) {
      if (settings.security.clientCanEditConnections) {
        connections = filterNewConnections(connections);

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = (0, _getIterator3.default)(connections), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var connection = _step4.value;

            channelGraph().removeConnection(connection);
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }

        sendToChannel('connections', channelGraph().listConnections());

        (0, _loggers.log)(_fullname(newSocket) + ' removed connections');
        (0, _loggers.logData)(connections);
      } else if (Array.isArray(connections) && connections.length > 0) {
        (0, _loggers.log)(_fullname(newSocket) + ' asked to remove connections. But spacebro is in secured mode: connections are not editable.');
      }
    }).on('replaceConnections', function (connections) {
      if (settings.security.clientCanEditConnections) {
        connections = filterNewConnections(connections);

        channelGraph().clearConnections();
        channelGraph().addConnections(connections);
        sendToChannel('connections', channelGraph().listConnections());

        (0, _loggers.log)(_fullname(newSocket) + ' replaced connections');
        (0, _loggers.logData)(connections);
      } else if (Array.isArray(connections) && connections.length > 0) {
        (0, _loggers.log)(_fullname(newSocket) + ' asked to replace connections. But spacebro is in secured mode: connections are not editable.');
      }
    }).on('getConnections', function (data) {
      sendBack('connections', channelGraph().listConnections());
    });

    newSocket.on('addClients', function (clients) {
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = (0, _getIterator3.default)(clients), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var client = _step5.value;

          channelGraph().addClient(client);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      sendToChannel('clients', _listClients());
    }).on('removeClients', function (clientNames) {
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = (0, _getIterator3.default)(clientNames), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var name = _step6.value;

          channelGraph().removeClient(name);
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      sendToChannel('clients', _listClients());
    }).on('getClients', function (data) {
      sendBack('clients', _listClients());
    });

    newSocket.on('saveGraph', function (data) {
      saveGraph(newSocket.channelName);
    }).on('*', function (_ref) {
      var data = _ref.data;

      var _data = (0, _slicedToArray3.default)(data, 2),
          eventName = _data[0],
          args = _data[1];

      var _args = args,
          _to = _args._to;


      if (reservedEvents.indexOf(eventName) > -1) {
        return;
      }

      if (settings.showdashboard) {
        _dashboard2.default.observeEvent(infos, eventName, newSocket.channelName);
      }

      (0, _loggers.log)(_fullname(newSocket) + ' emitted event "' + eventName + '"');
      (0, _loggers.logData)(data);

      if (args.altered) {
        args = args.data;
        data[1] = args;
      }

      function sendTo(clientName, eventName, args) {
        var targets = findSockets(newSocket.channelName, clientName);

        if (!targets.length) {
          return false;
        }
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = (0, _getIterator3.default)(targets), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var socket = _step7.value;

            var fullArgs = Array.prototype.slice.call(arguments, 3);
            fullArgs.unshift(eventName, args);
            // newServer && newServer.to(socket.id).emit(eventName, args)
            newServer && socket.emit.apply(socket, fullArgs);
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        return true;
      }

      if (_to != null) {
        if (!sendTo(_to, eventName, args)) {
          (0, _loggers.logError)('could not find target "' + _to + '"');
        }
        return;
      }

      var targets = channelGraph().getTargets(newSocket.clientName, eventName);
      if (targets.length) {
        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = (0, _getIterator3.default)(targets), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var target = _step8.value;

            // const res = sendTo(target.clientName, target.eventName, args)
            var fullArgs = data.slice(2);
            fullArgs.unshift(target.clientName, target.eventName, args);
            var res = sendTo.apply(_this, fullArgs);

            if (res) {
              (0, _loggers.log)(_fullname(newSocket) + ' emitted event "' + eventName + '" connected to ' + target.clientName + ' event "' + target.eventName + '"');
            } else {
              (0, _loggers.logError)('could not find target "' + target.clientName + '"');
            }
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }
      }

      sendToChannel.apply(_this, data);
      // sendToChannel(eventName, args)
    });
  });
  return newServer;
}

module.exports = { init: init, infos: infos, _initSocketIO: _initSocketIO

  /*
   * Helpers
   */

};function _arrayify(data) {
  // data = _objectify(data) || []

  if (!Array.isArray(data)) {
    data = [data];
  }

  // data = data.map(_objectify)
  data = data.filter(function (item) {
    return item != null;
  });

  return data;
}

function _objectify(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      (0, _loggers.logError)('socket error:', e);
      return null;
    }
  }
  return data;
}

function _fullname(socket) {
  return socket.clientName ? socket.clientName + '@' + socket.channelName : 'unregistered socket #' + socket.id;
}