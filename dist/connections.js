'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _loggers = require('./loggers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connections = void 0;

function init(_connections) {
  connections = _connections;
}

function addConnectionsFromSettings(settingsConnections) {
  var description = {
    clientDescription: {
      name: 'initial settings'
    }
  };
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)((0, _keys2.default)(settingsConnections)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var channelName = _step.value;

      description.channelName = channelName;
      addConnections(settingsConnections[channelName], description);
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

function addConnections(data, socket) {
  data = _objectify(data);
  if (data) {
    if (Array.isArray(data)) {
      data.forEach(function (connection) {
        return addConnection(connection, socket);
      });
    } else {
      addConnection(data, socket);
    }
    // remove duplicates
    connections[socket.channelName] = _lodash2.default.uniqWith(connections[socket.channelName], _lodash2.default.isEqual);
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
    (0, _loggers.log)((socket ? _fullname(socket) : '') + ' added connection');
    (0, _loggers.logData)(data);
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
    (0, _loggers.log)('can\'t parse connection "' + data + '"');
  }
  return connection;
}

function removeConnections(data, socket) {
  data = _objectify(data);
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
}

function removeConnection(data, socket) {
  _lodash2.default.remove(connections[socket.channelName], data);
  (0, _loggers.log)((socket ? _fullname(socket) : '') + ' removed connection');
  (0, _loggers.logData)(data);
}

module.exports = {
  init: init,
  addConnectionsFromSettings: addConnectionsFromSettings,
  addConnections: addConnections,
  addConnection: addConnection,
  parseConnection: parseConnection,
  removeConnections: removeConnections,
  removeConnection: removeConnection
};

function _objectify(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      (0, _loggers.log)('socket error:', e);
      return {};
    }
  }
  return data;
}

function _fullname(socket) {
  return socket.clientDescription.name ? socket.clientDescription.name + '@' + socket.channelName : 'unregistered socket #' + socket.id;
}