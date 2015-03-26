'use strict';

// =============================================================
// Modules
// =============================================================

var url = require('url');
var bl = require('bl');

// polyfill
var Promise = require('es6-promise').Promise;

// app module
var config = require('./config');
var db = require('./db');
var error = require('./error.js');
var myutil = require('./util.js');


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
    game_score: getGameScore,
    batting_stats: getBattingStats,
    pitching_stats: getPitchingStats,
  },
  DELETE: {},
  POST: {
    game_score: createGameScore,
    batting_stats: createBattingStats,
    pitching_stats: createPitchingStats,
  },
  PUT: {},
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

  return action().then(writeResponse.bind(null, req, res))
    .catch(writeErrorResponse.bind(null, req, res));
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


// -------------------------------------------------------------
// POST
// -------------------------------------------------------------

function createGameScore(obj) {
  obj.date = new Date(obj.date);
  var Model = db.model('GameScore');
  var score = new Model(obj);

  return myutil.promisize(score.save, score);
}

function createStats(modelName, objs) {
  var Model = db.model(modelName);
  var promises = objs.map(function(obj) {
    obj.date = new Date(obj.date);
    var stat = new Model(obj);
    
    return myutil.promisize(stat.save, stat);
  });

  return Promise.all(promises);
}

function createBattingStats(objs) {
  return createStats('BattingStats', objs);
}

function createPitchingStats(objs) {
  return createStats('PitchingStats', objs);
}


// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------

function authorization(authHeader) {
  return Promise.resolve();
  // return new Promise(function(resolve, reject) {
  //   var err = new error.AuthorizationError();
  //   if (!authHeader) reject(err);

  //   var auth = parseAuthorizationHeader(authHeader);
  //   if (auth.scheme !== 'Basic') reject(err);
  //   if (!auth.param) reject(err);

  //   resolve();
  // });
}

function parseAuthorizationHeader(header) {
  var splited = header.split(' ');
  return {
    scheme: splited[0],
    param: splited[1],
  };
}

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

function errorCode(err) {
  if (err.statusCode) return err.statusCode;
  switch (err.name) {
    case 'SyntaxError':
      return 400;
    case 'ValidationError':
      return 400;
    default:
      return 500;
  }
}

function writeResponse(req, res, result) {
  var status, header, content;
  var responseHasBody = req.method === 'GET';
  if (responseHasBody) {
    status = 200;
    header = {'content-type': 'application/json; charset=utf-8'};
    content = JSON.stringify(result) + '\n';
  } else {
    status = 204;
  }

  res.writeHead(status, header);
  res.end(content);

  return 'success';
}

function writeErrorResponse(req, res, err) {
  var status = errorCode(err);
  var header = {'content-type': 'text/plain; charset=utf-8'};
  var content = err.toString() + '\n';
  if (err.statusCode === 401)
    header['WWW-Authenticate'] = 'Basic realm="secret"';

  res.writeHead(status, header);
  res.end(content);

  return err;
}

  
//==============================================================
// Export
//==============================================================

module.exports = app;
