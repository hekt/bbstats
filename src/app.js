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
    score: getGameScoresByYear,
    stats: getStatsByDate,
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

  // if (data.statusCode === 500)
    console.error(err, err.stack);
  return err;
}


// -------------------------------------------------------------
// GET
// -------------------------------------------------------------

function getStatsByDate(query) {
  var date = new Date(query.date);
  
  if (!isValidDate(date))
    return Promise.reject(new error.MissingParameterError());
  
  return getPlayerNames().then(function(nameDic) {
    var formatBatting = formatBattingStatsForResponse.bind(null, nameDic);
    var formatPitching = formatPitchingStatsForResponse.bind(null, nameDic);
    var stats = {};
    var promises = [
      getRawStatsByDate('BattingStats', date).then(formatBatting)
        .then(function(result) { stats.battingStats = result; }),
      getRawStatsByDate('PitchingStats', date).then(formatPitching)
        .then(function(result) { stats.pitchingStats = result; }),
    ];
    return Promise.all(promises).then(function() {
      return stats;
    });
  });
}

function getGameScoresByYear(query) {
  var year = query.year || (new Date()).getFullYear().toString();

  if (year.match(/^20\d\d$/) === null)
    return Promise.reject(new error.MissingParameterError());
  
  var dbQuery = db.model('GameScore').find(null, '-_id -__v');
  dbQuery.sort('-date');
  dbQuery.gte('date', new Date(year));
  dbQuery.lte('date', new Date(year + '-12-31'));
  
  return promisize(dbQuery.exec, dbQuery);
}

function getRawStatsByDate(statsKind, date) {
  var dbQuery = db.model(statsKind)
        .find(null, '-_id -__v').where({date: date}).sort('order appearanceOrder');
  return promisize(dbQuery.exec, dbQuery);
}


// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

function saveScore(data) {
  return formatDataFromRequest(data).then(function(results) {
    var score = results[0];
    var batting = results[1];
    var pitching = results[2];

    var promises = [
      saveGameScore(score),
      saveStats('BattingStats', batting),
      saveStats('PitchingStats', pitching),
    ];

    return Promise.all(promises).pass(data.date);
  });
}

function saveGameScore(obj) {
  var Model = db.model('GameScore');
  var conds = {'date': obj.date};
  var opts = {upsert: true, runValidators: true};
  var query = Model.findOneAndUpdate.bind(Model, conds, obj, opts);

  return promisize(query);
}

function saveStats(modelName, objs) {
  var Model = db.model(modelName);
  var promises = objs.map(function(obj) {
    var conds = {'date': obj.date, 'playerId': obj.playerId};
    var opts = {upsert: true, runValidators: true};
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
// Formatting
// ------------------------------------------------------------

function formatDataFromRequest(data) {
  data.date = new Date(data.date);

  return playerDic.initAsync().then(function() {
    var promises = [
      formatGameScoreFromRequest(data),
      formatBattingStatsFromRequest(data),
      formatPitchingStatsFromRequest(data),
    ];
    return Promise.all(promises);
  });
}

function formatGameScoreFromRequest(data) {
  var score = data.gameScore;
  score.date = new Date(data.date);
  score.ground = data.ground;

  return Promise.resolve(score);
}

function formatBattingStatsFromRequest(data) {
  var batters = filterEmptyPlayer(data.battingStats);

  batters.forEach(function(batter) {
    batter.atbats = filterEmptyAtbat(batter.atbats);
  });
  addAppearanceOrderToBatters(batters);
  addDateAndGroundToPlayers(data, batters);

  return batters.map(addIdToPlayer);
}

function formatPitchingStatsFromRequest(data) {
  var pitchers = filterEmptyPlayer(data.pitchingStats);
  addDateAndGroundToPlayers(data, pitchers);

  return pitchers.map(addIdToPlayer);
}

function filterEmptyPlayer(players) {
  return players.filter(function(player) {
    return !!player.name;
  });
}

function filterEmptyAtbat(atbats) {
  return atbats.filter(function(atbat) {
    return !!atbat.result;
  });
}

function addAppearanceOrderToBatters(batters) {
  var tempOrder = 0;
  var tempAppear = 0;
  batters.forEach(function(batter) {
    if (batter.order === tempOrder) {
      batter.appearanceOrder = ++tempAppear;
    } else {
      batter.appearanceOrder = 0;
      tempOrder = batter.order;
      tempAppear = 0;
    }
  });
  return batters;
}

function addIdToPlayer(player) {
  player.playerId = playerDic.getId(player.name);
  return player;
}

function addDateAndGroundToPlayers(obj, players) {
  var date = obj.date;
  var ground = obj.ground;
  players.forEach(function(player) {
    player.date = date;
    player.ground = ground;
  });
}

function formatBattingStatsForResponse(nameDic, docs) {
  var players = [];
  docs.forEach(function(doc) {
    var player = doc.toObject();

    delete player.date;
    delete player.ground;

    player.name = nameDic[player.playerId] || player.playerId;
    player.atbats = player.atbats.filter(function(atbat) {
      return !!atbat.result;
    });
    
    players.push(player);
  });

  return players;
}

function formatPitchingStatsForResponse(nameDic, docs) {
  var players = [];
  docs.forEach(function(doc) {
    var player = doc.toObject();

    delete player.date;
    delete player.ground;

    player.name = nameDic[player.playerId] || 'anonymous';

    players.push(player);
  });

  return players;
}


// ------------------------------------------------------------
// Utils
// ------------------------------------------------------------

function getRequestBodyAsync(req) {
  return new Promise(function(resolve, reject) {
    req.pipe(bl(function(err, data) {
      err ? reject(err) : resolve(data.toString());
    }));
  });
}

function getPlayerNames() {
  var dbQuery = db.model('TeamMember').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(function(docs) {
    var obj = {};
    docs.forEach(function(doc) {
      obj[doc.playerId] = doc.playerName;
    });
    return obj;
  });
}
function getPlayerIdFromNameDic(nameDic, name) {
  for (var k in nameDic) {
    if (nameDic[k] === name) return k;
  }
  var ids = Object.keys(nameDic);
  var newId = Math.max.apply(null, ids.push(1000)) + 1;
  
  return newId;
}

function isValidDate(date) {
  return date instanceof Date && date.toString() !== 'Invalid Date';
}

var playerDic = (function() {
  var _dic = {};
  var status = 0;

  return {
    status: status,
    initAsync: init,
    getName: getName,
    getId: getId,
  };

  function init() {
    return status === 1 ? Promise.resolve() :
      getPlayerNames().then(function(dic) {
        _dic = dic;
        status = 1;
      });
  }

  function getName(playerId) {
    if (status !== 1) console.warn('playerDic: not initialized');
    return _dic[playerId];
  }

  function getId(playerName) {
    if (status !== 1) console.warn('playerDic: not initialized');
    for (var k in _dic) {
      if (_dic[k] === playerName) return k;
    }
    return createNewId(playerName);
  }

  function createNewId(playerName) {
    var newId = Math.max.apply(null, Object.keys(_dic).concat(999)) + 1;
    _dic[newId] = playerName;

    var Model = db.model('TeamMember');
    var player = new Model({
      playerName: playerName,
      playerId: newId,
    });
    promisize(player.save, player).catch(function(err) {
      console.error(err);
    });
    
    return newId;
  }
}());


//==============================================================
// Export
//==============================================================

module.exports = app;
