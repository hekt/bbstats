'use strict';


// =============================================================
// Modules
// =============================================================

var util = require('util');
var bl = require('bl');

// polyfill
var Promise = require('es6-promise').Promise;

// my modules
var db = require('./db');
var CommonKey = require('./auth').CommonKey;
var promisize = require('./util').promisize;


// -------------------------------------------------------------
// Action
// -------------------------------------------------------------

var Action = function(data) {
  this._data = data || null;
  this._promise = Promise.resolve();
};

Action.prototype.getPromise = function() {
  return this._promise.then(function() {
    return this._data;
  }.bind(this));
};

Action.prototype.load = function(modelName, query, option) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var dbQuery = db.model(modelName).find(query, '-_id -__v', option);
    return promisize(dbQuery.exec, dbQuery).then(function(docs) {
      _this._data = docs.map(function(doc) {
        return doc.toObject();
      });
      return _this._data;
    });
  });
  return this;
};

Action.prototype.loadEach = function(queries) {
  var _this = this;
  this._promise = this._promise.then(function() {
    _this._data = {};
    var promises = [];
    for (var name in queries) {
      var q = queries[name];
      var dbQuery = db.model(name).find(q.query, '-_id -__v', q.option);
      var func = function(name, docs) {
        _this._data[name] = docs.map(function(doc) {
          return doc.toObject();
        });
      }.bind(null, name);
      var promise = promisize(dbQuery.exec, dbQuery).then(func);
      promises.push(promise);
    }
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.save = function(modelName) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var Model = db.model(modelName);
    var data = _this._data;
    return buildSavePromise(Model, data);
  });
  return this;
};

Action.prototype.saveEach = function(modelNames) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var promises = [];
    modelNames.forEach(function(modelName) {
      var Model = db.model(modelName);
      var data = _this._data[modelName];
      if (data instanceof Array)
        data.forEach(function(d) {
          promises.push(buildSavePromise(Model, d));
        });
      else
        promises.push(buildSavePromise(Model, data));
    });
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.format = function(formatFunc) {
  var _this = this;
  this._promise = this._promise.then(function() {
    _this._data = formatFunc(_this._data);
    return Promise.resolve(_this._data);
  });
  return this;
};

Action.prototype.read = function(req) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var user = req.headers['X-BBStats-Authenticated-User'];
    var decrypt = CommonKey.decrypt.bind(null, user);
    return getRequestBody(req).then(decrypt).then(function(data) {
      _this._data = data;
      return _this._data;
    });
  });
  return this;
};

Action.prototype.write = function(res) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var status = 200;
    var header = {'content-type': 'application/json; charset=utf-8'};
    var content = JSON.stringify(_this._data) + '\n';
    res.writeHead(status, header);
    res.end(content);
    return Promise.resolve();
  });
  return this;
};


// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

function getRequestBody(req) {
  return new Promise(function(resolve ,reject) {
    req.pipe(bl(function(err, data) {
      err ? reject(err) : resolve(data.toString());
    }));
  });
}

function buildSavePromise(Model, data) {
  var conds = {date: data.date};
  if (data.playerId) conds.playerId = data.playerId;
  var opts = {upsert: true, runValidators: true};
  var query = Model.findOneAndUpdate.bind(Model, conds, data, opts);
  return promisize(query);
}


// -------------------------------------------------------------
// Export
// -------------------------------------------------------------

module.exports = {
  Action: Action
};
