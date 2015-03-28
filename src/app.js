'use strict';

// =============================================================
// Modules
// =============================================================

var url = require('url');
var bl = require('bl');
var strftime = require('strftime');

// polyfill
var Promise = require('es6-promise').Promise;

// app module
var config = require('./config');
var db = require('./db');
var error = require('./error.js');
var myutil = require('./util.js');
var promisize = myutil.promisize;
var AccessToken = require('./auth').AccessToken;


// =============================================================
// Header
// =============================================================

var app = {};

// app#api(req:http.clientRequest, res:http.ServerResponse): Promise(result)
app.api = api;


// =============================================================
// Implementation
// =============================================================

var apiActionSet = {
  GET: {
    score: getGameScore,
    batting: getBattingStats,
    pitching: getPitchingStats,
  },
  PUT: {
    score: saveScore,
  },
  DELETE: {},
  POST: {},
};

function api(req, res) {
  var urlObj = url.parse(req.url, true);
  
  var authorize = function() {
    var authRequired = req.method !== 'GET';
    return  authRequired ?
      authorization(req.headers.authorization) : Promise.resolve();
  };
  var getQuery = function() {
    var requestHasBody = req.method === 'POST' || req.method === 'PUT';
    return requestHasBody ?
      getRequestBodyAsync(req).then(JSON.parse) :
      Promise.resolve(urlObj.query);
  };
  var target = urlObj.pathname.replace(/\/api\/([a-z_]+)/, '$1');
  var action = function() {
    var act = apiActionSet[req.method][target];
    return act ? getQuery().then(act) :
      Promise.reject(new error.NotFoundError());
  };

  return authorize().then(action)
    .then(writeSuccessResponse.bind(null, req, res))
    .catch(writeErrorResponse.bind(null, req, res));
}

function writeSuccessResponse(req, res, result) {
  var status, header, content;
  var responseHasBody = req.method === 'GET';
  var resourcesCreated = req.method === 'PUT';
  if (responseHasBody) {
    status = 200;
    header = {'content-type': 'application/json; charset=utf-8'};
    content = JSON.stringify(result) + '\n';
  } else if (resourcesCreated) {
    var u = url.parse(req.url);
    var loc = 'http://' + u.host + '/score/' + strftime('%F', result);
    status = 201;
    header = {'Location': loc};
  } else {
    status = 204;
  }

  res.writeHead(status, header);
  res.end(content);

  return 'success';
}

function writeErrorResponse(req, res, err) {
  var data = error.toHttpData(err);
  var status = data.statusCode;
  var header = {'content-type': 'text/plain; charset=utf-8'};
  var content = data.message + '\n';

  res.writeHead(status, header);
  res.end(content);

  if (data.statusCode === 500) console.error(err);
  return err;
}


// -------------------------------------------------------------
// GET
// -------------------------------------------------------------

function getGameScore(query) {
  var dbQuery = db.model('GameScore').find(null, '-_id -__v');
  dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
  
  return myutil.promisize(dbQuery.exec, dbQuery);
}

function getBattingStats(query) {
  var dbQuery = db.model('BattingStats').find(null, '-_id -__v');
  dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
  if (query.player) dbQuery = dbQuery.where('playerId', query.player);
  
  return myutil.promisize(dbQuery.exec, dbQuery);
}

function getPitchingStats(query) {
  var dbQuery = db.model('PitchingStats').find(null, '-_id -__v');
  dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
  if (query.player) dbQuery = dbQuery.where('playerId', query.player);

  return myutil.promisize(dbQuery.exec, dbQuery);
}


// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

function saveScore(obj) {
  var dateStr = obj.score.date;
  var promises = [
    saveGameScore(obj.score),
    saveStats('BattingStats', obj.batting),
    saveStats('PitchingStats', obj.pitching),
  ];

  return Promise.all(promises).then(function() {
    return new Date(dateStr);
  });
}

function saveGameScore(obj) {
  obj.date = new Date(obj.date);
  var Model = db.model('GameScore');
  var conds = {'date': obj.date};
  var opts = {'upsert': true};
  var query = Model.findOneAndUpdate.bind(Model, conds, obj, opts);

  return promisize(query);
}

function saveStats(modelName, objs) {
  var Model = db.model(modelName);
  var promises = objs.map(function(obj) {
    obj.date = new Date(obj.date);
    var conds = {'date': obj.date, 'playerId': obj.playerId};
    var opts = {'upsert': true};
    var query = Model.findOneAndUpdate.bind(Model, conds, obj, opts);

    return promisize(query);
  });

  return Promise.all(promises);
}


// -------------------------------------------------------------
// authorization
// -------------------------------------------------------------

function authorization(authHeader) {
  var err = new error.AuthorizationError();
  if (!authHeader || typeof authHeader !== 'string')
    return Promise.reject(err);
  return Promise.resolve(authHeader)
    .then(parseAuthorizationHeader)
    .then(function(auth) {
      if (auth.scheme !== 'Token') return Promise.reject(err);
      return AccessToken.verify(auth.param);
    });
}

function parseAuthorizationHeader(header) {
  var splited = header.split(' ');
  return {
    scheme: splited[0],
    param: splited[1],
  };
}


// ------------------------------------------------------------
// Utils
// ------------------------------------------------------------

function setGeneralOptionsToDBQuery(dbq, q) {
  dbq = (q.order && q.order === 'asc') ?
    dbq.sort('date') : dbq.sort('-date');
  if (q.date) dbq = dbq.where('date', new Date(q.date));
  if (q.year) {
    dbq = dbq.gte('date', new Date(q.year));
    dbq = dbq.lte('date', new Date(q.year + '-12-31'));
  }
  if (q.ground) dbq = dbq.where('ground', q.ground);

  return dbq;
}

function getRequestBodyAsync(req) {
  return new Promise(function(resolve, reject) {
    req.pipe(bl(function(err, data) {
      err ? reject(err) : resolve(data.toString());
    }));
  });
}


//==============================================================
// Export
//==============================================================

module.exports = app;
