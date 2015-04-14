'use strict';


// =============================================================
// Modules
// =============================================================

let bl = require('bl');

// my modules
let db = require('./db');
let CommonKey = require('./auth').CommonKey;
let promisize = require('./util').promisize;


// -------------------------------------------------------------
// Action
// -------------------------------------------------------------

let _data = Symbol('data');
let _promise = Symbol('promise');

let Action = function(data) {
  this[_data] = data || null;
  this[_promise] = Promise.resolve();
};

Action.prototype.getPromise = function() {
  let that = this;
  return this[_promise].then(() => {
    return that[_data];
  });
};

Action.prototype.load = function(modelName, query, option) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let dbQuery = db.model(modelName).find(query, '-_id -__v', option);
    return promisize(dbQuery.exec, dbQuery).then(docs => {
      that[_data] = docs.map(doc => doc.toObject());
    });
  });
  return this;
};

Action.prototype.loadEach = function(queryMap) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    that[_data] = {};
    let promises = [];
    queryMap.forEach((q, name) => {
      let dbQuery = db.model(name).find(q.query, '-_id -__v', q.option);
      let promise = promisize(dbQuery.exec, dbQuery).then(docs => {
        that[_data][name] = docs.map(doc => doc.toObject());
      });
      promises.push(promise);
    });
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.save = function(modelName, uniqueKeys) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let Model = db.model(modelName);
    let data = that[_data];
    return buildSavePromise(Model, data, uniqueKeys);
  });
  return this;
};

Action.prototype.saveEach = function(modelMap) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let promises = [];
    modelMap.forEach((uniqueKeys, name) => {
      let Model = db.model(name);
      let data = that[_data][name];
      if (data instanceof Array)
        data.forEach(d => {
          promises.push(buildSavePromise(Model, d, uniqueKeys));
        });
      else
        promises.push(buildSavePromise(Model, data, uniqueKeys));
    });
    return Promise.all(promises);
  });
  return this;
};

Action.prototype.format = function(formatFunc) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let result = formatFunc(that[_data]);
    if (result instanceof Promise)
      return result.then(data => { that[_data] = data; });
    that[_data] = formatFunc(that[_data]);
    return that[_data];
  });
  return this;
};

Action.prototype.read = function(req) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let user = req.headers['X-BBStats-Authenticated-User'];
    let decrypt = CommonKey.decrypt.bind(null, user);
    return getRequestBody(req).then(decrypt).then(data => {
      that[_data] = data;
    });
  });
  return this;
};

Action.prototype.write = function(res) {
  let that = this;
  this[_promise] = this[_promise].then(() => {
    let status = 200;
    let header = {'content-type': 'application/json; charset=utf-8'};
    let content = JSON.stringify(that[_data]) + '\n';
    res.writeHead(status, header);
    res.end(content);
  });
  return this;
};


// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

function getRequestBody(req) {
  return new Promise((resolve ,reject) => {
    req.pipe(bl((err, data) => {
      err ? reject(err) : resolve(data.toString());
    }));
  });
}

function buildSavePromise(Model, data, uniqueKeys) {
  if (!uniqueKeys || !uniqueKeys.length > 0) {
    let doc = new Model(data);
    return promisize(doc.save, doc);
  } else {
    let conds = {};
    uniqueKeys.forEach(key => {
      conds[key] = data[key];
    });
    let opts = {upsert: true, runValidators: true};
    let query = Model.findOneAndUpdate.bind(Model, conds, data, opts);
    return promisize(query);
  }
}


// -------------------------------------------------------------
// Export
// -------------------------------------------------------------

module.exports = {
  Action: Action
};
