
var Promise = require('es6-promise').Promise;
var url = require('url');

var myutil = require('../src/util');
var db = require('../src/db');
var mocks = require('./mocks');

var helper = {};

helper.toObjects = function(docs) {
  return docs.map(function(doc) {
    return doc.toObject();
  });
}

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

helper.saveScores = function(numberOfScores) {
  var Model = db.model('GameScore');
  
  var promises = [];
  var len = mocks.gameScoreList.length;
  var score;
  for (var i = 0; i < numberOfScores; i++) {
    score = new Model(mocks.gameScoreList[i % len]);
    promises.push(myutil.promisize(score.save, score));
  }

  return Promise.all(promises);
};

helper.saveStats = function(model, numberOfStats) {
  var Model = db.model(model);
  var mockList;
  if (model === 'BattingStats') {
    mockList = mocks.battingStatsList;
  } else {
    mockList = mocks.pitchingStatsList;
  }

  var promises = [];
  var len = mockList.length;
  var stat;
  for (var i = 0; i < numberOfStats; i++) {
    stat = new Model(mockList[i % len]);
    promises.push(myutil.promisize(stat.save, stat));
  }

  return Promise.all(promises);
};

module.exports = helper;
