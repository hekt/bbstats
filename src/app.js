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
var CommonKey = require('./auth').CommonKey;
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
    'player/stats': getStatsByPlayerId,
    'stats/batting': getBattingStats,
    'stats/pitching': getPitchingStats,
  },
  PUT: {
    score: saveScore,
  },
  DELETE: {},
  POST: {},
};

function api(req, res) {
  var urlObj = url.parse(req.url, true);

  var getQuery = function() {
    var requestHasBody = req.method !== 'GET';
    return requestHasBody ?
      getRequestBodyAsync(req) : Promise.resolve(urlObj.query);
  };
  var decrypt = function(body) {
    var decryptRequired = req.method !== 'GET';
    if (!decryptRequired) {
      return Promise.resolve(body);
    } else {
      var user = req.headers['x-bbstats-authenticated-user'];
      return CommonKey.decrypt(user, body);
    }
  };
  
  var action = function() {
    var target = urlObj.pathname.replace(/\/api\/([a-z_]+\/?[a-z_]*)/, '$1');
    var act = apiActionSet[req.method][target];
    return act ? getQuery().then(decrypt).then(act) :
      Promise.reject(new error.NotFoundError());
  };

  return action()
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

function getBattingStats(query) {
  var Model = db.model('BattingStats');
  var dbQuery = Model.find('-_id -__v');
  var promise = promisize.bind(null, dbQuery.exec, dbQuery);
  return playerDic.initAsync()
    .pure(promise)
    .then(formatBattingStatsForResponse)
    .then(function(results) {
      var groups = groupResultsByPlayer(results);
      var l = [];
      for (var pid in groups) {
        l.push(calcBattingStats(groups[pid]));
      }
      return l;
    });
}

function getPitchingStats(query) {
  var Model = db.model('PitchingStats');
  var dbQuery = Model.find('-_id -__v');
  var promise = promisize.bind(null, dbQuery.exec, dbQuery);
  return playerDic.initAsync()
    .pure(promise)
    .then(formatPitchingStatsForResponse)
    .then(function(results) {
      var groups = groupResultsByPlayer(results);
      var l = [];
      for (var pid in groups) {
        var stats = calcPitchingStats(groups[pid]);
        l.push(stats);
      }
      return l;
    });
}

function groupResultsByPlayer(results) {
  var obj = {};
  results.forEach(function(result) {
    var pid = result.playerId;
    obj[pid] = obj[pid] || [];
    obj[pid].push(result);
  });
  return obj;
}

function getStatsByDate(query) {
  var date = new Date(query.date);
  
  if (!isValidDate(date))
    return Promise.reject(new error.MissingParameterError());
  
  return playerDic.initAsync().then(function() {
    var stats = {batting: {}, pitching: {}};
    var promises = [
      getRawStatsByDate('BattingStats', date)
        .then(formatBattingStatsForResponse)
        .then(function(result) { stats.batting.results = result; }),
      getRawStatsByDate('PitchingStats', date)
        .then(formatPitchingStatsForResponse)
        .then(function(result) { stats.pitching.results = result; }),
    ];
    return Promise.all(promises).pass(stats);
  });
}

function getStatsByPlayerId(query) {
  var pid = Number(query.playerId);

  if (!isValidPlayerId(pid))
    return Promise.reject(new error.MissingParameterError());

  return playerDic.initAsync().then(function() {
    var player = {
      id: pid,
      name: playerDic.getName(pid),
      batting: {},
      pitching: {},
    };
    var promises = [
      getRawStatsByPlayerId('BattingStats', pid)
        .then(formatBattingStatsForResponse)
        .then(function(results) {
          player.batting.results = results;
          if (results.length)
            player.batting.stats = {
              total: calcBattingStats(results),
              risp: calcBattingStatsRisp(results),
            };
        }),
      getRawStatsByPlayerId('PitchingStats', pid)
        .then(formatPitchingStatsForResponse)
        .then(function(results) {
          player.pitching.results = results;
          if (results.length)
            player.pitching.stats = {
              total: calcPitchingStats(results),
            };
        }),
    ];
    return Promise.all(promises).then(function() {
      return player;
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
  var dbQuery = db.model(statsKind).find(null, '-_id -__v')
        .where({date: date}).sort('order appearanceOrder');
  return promisize(dbQuery.exec, dbQuery);
}

function getRawStatsByPlayerId(statsKind, pid) {
  var dbQuery = db.model(statsKind).find(null, '-_id -__v')
        .where({playerId: pid}).sort('-date');
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
// Calculate stats
// ------------------------------------------------------------

function calcBattingStats(results) {
  var atbats = [];
  results.forEach(function(result) {
    atbats = atbats.concat(result.atbats);
  });

  var stats = calcBattingStatsInner(atbats);
  stats.g = results.length;
  ['run', 'sb', 'error'].forEach(function(stat) {
    stats[stat] = myutil.sum(results.map(function(result) {
      return Number(result[stat]) || 0;
    }));
  });
  
  return stats;
}

function calcBattingStatsRisp(results) {
  var atbats = [];
  results.forEach(function(result) {
    atbats = atbats.concat(result.atbats);
  });
  atbats = atbats.filter(function(atbat) {
    return atbat.runners.scond || atbat.runners.third;
  });

  return calcBattingStatsInner(atbats);
}

function calcBattingStatsInner(atbats) {
  var counts = getResultCounts(atbats);
  var stats = {
    ab: counts.ab,
    h: counts.h,
    hr: counts.hr,
    so: counts.so,
    bb: counts.bb,
    hbp: counts.hbp,
  };

  stats.rbi = myutil.sum(atbats.map(function(atbat) {
    return Number(atbat.rbi) || 0;
  }));
  
  var c = counts; // i want to use with statement in strict mode...
  stats.avg = c.h / c.ab;
  stats.obp = (c.h + c.bb + c.hbp) / (c.ab + c.bb + c.hbp + c.sf);
  stats.slg = c.tb / c.ab;
  stats.ops = stats.obp + stats.slg;

  return stats;
}

function getResultCounts(atbats) {
  var kinds = atbats.map(function(atbat) {
    return atbat.resultKind;
  });
  var knownKinds = [
    'h', 'dbl', 'tpl', 'hr', 'bb', 'ibb', 'hbp', 'sf', 'sh',
    'go', 'fo', 'dp', 'so', 'uts', 'e',
  ];
  var noAtbatKinds = ['bb', 'ibb', 'hbp', 'sf', 'sh'];
  
  var r = {pa: 0, ab: 0};
  knownKinds.forEach(function(k) { r[k] = 0; });
  
  kinds.forEach(function(kind) {
    r.pa++;
    if (noAtbatKinds.indexOf(kind) < 0) r.ab++;
    if (r[kind] !== undefined) {
      r[kind]++;
    } else {
      r[kind] = 1;
      console.warn('unknown kind:', kind);
    }
  });

  r.h = r.h + + r.dbl + r.tpl + r.hr;
  r.bb = r.bb + r.ibb;
  r.tb = r.h + r.dbl + r.tpl*2 + r.hr*3;
  r.out = r.fo + r.go + r.dp;
  r.so = r.so + r.uts;
  
  return r;
}

function calcPitchingStats(results) {
  var stats = {
    g: results.length,
    win: 0,
    lose: 0,
    hold: 0,
    save: 0,
  };

  results.forEach(function(result) {
    var r = result.result;
    if (r) stats[r]++;
  });

  var statKinds = [
    'out', 'bf', 'run', 'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error'
  ];
  statKinds.forEach(function(stat) {
    stats[stat] = myutil.sum(results.map(function(result) {
      return Number(result[stat]) || 0;
    }));
  });

  var s = stats;
  stats.h = stats.h | stats.hit;
  stats.bf = stats.bf || s.out + s.bb + s.h + s.error;
  stats.era = (s.erun * 3 * 9) / s.out;
  stats.avg = s.f / (s.bf - s.bb);
  stats.whip = (s.h + s.bb) / (s.out / 3);
  stats.k9 = (s.so * 9) / (s.out / 3);
  stats.wpct = s.win / s.win + s.lose;

  return stats;
}


// ------------------------------------------------------------
// Formatting
// ------------------------------------------------------------

function formatDataFromRequest(data) {
  data.date = new Date(data.date);

  return playerDic.initAsync().then(function() {
    return [
      formatGameScoreFromRequest(data),
      formatBattingStatsFromRequest(data),
      formatPitchingStatsFromRequest(data),
    ];
  });
}

function formatGameScoreFromRequest(data) {
  var score = data.gameScore;
  score.date = new Date(data.date);
  score.ground = data.ground;

  return score;
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

function formatBattingStatsForResponse(docs) {
  var players = [];
  docs.forEach(function(doc) {
    var player = doc.toObject();
    player.name = playerDic.getName(player.playerId);
    player.atbats = player.atbats.filter(function(atbat) {
      return !!atbat.result;
    });
    players.push(player);
  });

  return players;
}

function formatPitchingStatsForResponse(docs) {
  var players = [];
  docs.forEach(function(doc) {
    var player = doc.toObject();
    player.name = playerDic.getName(player.playerId);
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

function isValidDate(date) {
  return date && date instanceof Date && date.toString() !== 'Invalid Date';
}

function isValidPlayerId(pid) {
  return pid && typeof pid === 'number' && pid >= 0 &&
    pid.toString() !== 'NaN' && pid.toString() !== 'Infinity';
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
    if (status === 1) {
      return Promise.resolve();
    } else {
      var dbQuery = db.model('TeamMember').find(null, '-_id -__v');
      return promisize(dbQuery.exec, dbQuery).then(function(docs) {
        var obj = {};
        docs.forEach(function(doc) {
          obj[doc.playerId] = doc.playerName;
        });
        _dic = obj;
        status = 1;
      });
    }
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
