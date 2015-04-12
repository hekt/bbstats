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
    });
  });
  return this;
};

Action.prototype.loadEach = function(queries) {
  var _this = this;
  this._promise = this._promise.then(function() {
    _this._data = {};
    var promises = [];
    queries.forEach(function(q) {
      var dbQuery = db.model(q.name).find(q.query, '-_id -__v', q.option);
      var promise = promisize(dbQuery.exec, dbQuery).then(function(docs) {
        _this._data[q.name] = docs.map(function(doc) {
          return doc.toObject();
        });
      });
      promises.push(promise);
    });
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.save = function(modelName, uniqueKeys) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var Model = db.model(modelName);
    var data = _this._data;
    return buildSavePromise(Model, data, uniqueKeys);
  });
  return this;
};

Action.prototype.saveEach = function(models) {
  var _this = this;
  this._promise = this._promise.then(function() {
    var promises = [];

    models.forEach(function(model) {
      var Model = db.model(model.name);
      var data = _this._data[model.name];
      var keys = model.uniqueKeys;
      if (data instanceof Array)
        data.forEach(function(d) {
          promises.push(buildSavePromise(Model, d, keys));
        });
      else
        promises.push(buildSavePromise(Model, data, keys));
    });
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.format = function(formatFunc) {
  var _this = this;
  this._promise = this._promise.then(function() {
    _this._data = formatFunc(_this._data);
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

function buildSavePromise(Model, data, uniqueKeys) {
  if (!uniqueKeys || !uniqueKeys.length > 0) {
    var doc = new Model(data);
    return promisize(doc.save, doc);
  } else {
    var conds = {};
    uniqueKeys.forEach(function(key) {
      conds[key] = data[key];
    });
    var opts = {upsert: true, runValidators: true};
    var query = Model.findOneAndUpdate.bind(Model, conds, data, opts);
    return promisize(query);
  }
}


// -------------------------------------------------------------
// Export
// -------------------------------------------------------------

module.exports = {
  Action: Action
};
