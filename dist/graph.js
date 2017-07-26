'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Graph = function () {
  function Graph() {
    (0, _classCallCheck3.default)(this, Graph);

    this._clients = {};
    this._connections = [];
  }

  (0, _createClass3.default)(Graph, [{
    key: 'addClient',
    value: function addClient(client) {
      this._clients[client.name] = this._clients[client.name] || client;
    }
  }, {
    key: 'removeClient',
    value: function removeClient(clientName) {
      delete this._clients[clientName];
    }
  }, {
    key: 'listClients',
    value: function listClients() {
      return this._clients;
    }
  }, {
    key: 'clearClients',
    value: function clearClients() {
      this._clients = {};
    }
  }, {
    key: 'getClient',
    value: function getClient(name) {
      return this._clients[name];
    }
  }, {
    key: 'addConnections',
    value: function addConnections(connections) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(connections), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var connection = _step.value;

          this._addConnection(connection);
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

      this._removeDuplicates();
    }
  }, {
    key: '_addConnection',
    value: function _addConnection(connection) {
      this._connections.push(connection);
    }
  }, {
    key: '_removeDuplicates',
    value: function _removeDuplicates() {
      this._connections = _lodash2.default.uniqWith(this._connections, _deepEqual2.default);
    }
  }, {
    key: 'removeConnection',
    value: function removeConnection(connection) {
      _lodash2.default.remove(this._connections, connection);
    }
  }, {
    key: 'listConnections',
    value: function listConnections() {
      return this._connections;
    }
  }, {
    key: 'clearConnections',
    value: function clearConnections() {
      this._connections = [];
    }

    /*
    ** Filters all connections which start from the given client and port
    ** Returns list of { clientName, eventName } tuples
    */

  }, {
    key: 'getTargets',
    value: function getTargets(clientName, outputPort) {
      return this._connections.filter(function (connection) {
        return connection.src.clientName === clientName && connection.src.eventName === outputPort;
      }).map(function (connection) {
        return connection.tgt;
      });
    }
  }]);
  return Graph;
}();

var _channelGraphs = {};

function getGraph(channelName) {
  if (!_channelGraphs[channelName]) {
    _channelGraphs[channelName] = new Graph();
  }
  return _channelGraphs[channelName];
}

function isValidConnection(connection) {
  return (0, _deepEqual2.default)((0, _keys2.default)(connection), ['src', 'tgt']) && (0, _deepEqual2.default)((0, _keys2.default)(connection.src), ['clientName', 'eventName']) && (0, _deepEqual2.default)((0, _keys2.default)(connection.tgt), ['clientName', 'eventName']);
}

module.exports = {
  Graph: Graph,
  getGraph: getGraph,
  isValidConnection: isValidConnection
};