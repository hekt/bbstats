'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var Promise = require('es6-promise').Promise;
var url = require('url');

var myutil = require('../src/util');
var db = require('../src/db');
var mocks = require('./mocks');


// ------------------------------------------------------------
// helper
// ------------------------------------------------------------

var helper = {};

helper.toObjects = function(docs) {
  return docs.map(function(doc) {
    return doc.toObject();
  });
};

helper.viaJSON = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

helper.findAll = function(model, query) {
  var Model = db.model(model);
  var dbQuery = Model.find(query, '-_id -__v');

  return myutil.promisize(dbQuery.exec, dbQuery);
};

helper.findOne = function(model, query) {
  var Model = db.model(model);
  var dbQuery = Model.findOne(query, '-_id -__v');

  return myutil.promisize(dbQuery.exec, dbQuery);
};

helper.createPipeMock = function(data) {
  return function(dist) { dist.end(data, 'utf-8'); };
};

helper.buildUrl = function(pathname, query) {
  return url.format({
    protocol: 'http',
    host: 'localhost',
    pathname: pathname,
    query: query,
  });
};

helper.saveScore = function() {
  var Model = db.model('GameScore');
  var score = new Model(mocks.scoreMock);
  return  myutil.promisize(score.save, score);
};

helper.saveResults = function(model) {
  var Model = db.model(model);
  var mock;
  if (model === 'BattingStats') {
    mock = mocks.battingMock;
  } else {
    mock = mocks.pitchingMock;
  }

  var results = new Model(mock);
  return myutil.promisize(results.save, results);
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = helper;
