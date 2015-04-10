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
var error = require('./error.js');
var myutil = require('./util.js');
var Action = require('./action').Action;
var CommonKey = require('./auth').CommonKey;


// =============================================================
// Header
// =============================================================

var app = {};
app.api = api;


// =============================================================
// Implementation
// =============================================================

var apiActionSet = {
  GET: {
    members: getMembers,
    score: getScoresByYear,
    stats: getStatsByDate,
    'player/stats': getStatsByPlayer,
    'stats/both': getAllStats,
  },
  PUT: {
    score: saveScore,
  },
  // DELETE: {},
  // POST: {},
};

function api(req, res) {
  var urlObj = url.parse(req.url, true);
  var target = urlObj.pathname.replace(/\/api\/([a-z_]+\/?[a-z_]*)/, '$1');
  var action = apiActionSet[req.method][target];
  var errorHandler = writeErrorResponse.bind(null, req, res);
  
  if (!action)
    return Promise.reject(new error.NotFoundError()).catch(errorHandler);
  else
    return action(req, res).catch(errorHandler);
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


// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

function saveScore(req, res) {
  var action = new Action();
  var models = ['GameScore', 'BattingStats', 'PitchingStats'];
  return action.read(req).format(formatDataFromRequest)
    .saveEach(models).getPromise().then(function(data) {
      var u = url.parse(req.url);
      var loc = 'http://' + u.host + '/score/' +
            strftime('%F', data.GameScore.date);
      res.writeHead(201, {Location: loc});
      res.end();
    });
}


// -------------------------------------------------------------
// GET
// -------------------------------------------------------------

function getMembers(req, res) {
  var action = new Action();
  return action.load('TeamMember').write(res).getPromise();
}

function getScoresByYear(req, res) {
  var query = url.parse(req.url, true).query;

  if (!query || !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());
  
  var dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + '')
    },
  };
  var option = {
    sort: {date: -1}
  };
  var action = new Action();
  return action.load('GameScore', dbQuery, option).write(res).getPromise();
}

function getStatsByDate(req, res) {
  var query = url.parse(req.url, true).query;
  var date = query ? new Date(query.date) : null;

  if (!query || !myutil.isValidDate(date))
    return Promise.reject(new error.MissingParameterError());
  
  var dbQuery = {
    date: date,
  };
  var option = {
    sort: {order: 1, appearanceOrder: 1},
  };
  var dbQueries = {
    'BattingStats': {query: dbQuery, option: option},
    'PitchingStats': {query: dbQuery, option: option},
  };
  var format = function(data) {
    return {batting: data.BattingStats, pitching: data.PitchingStats};
  };
  
  var action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}

function getStatsByPlayer(req, res) {
  var query = url.parse(req.url, true).query;

  if (!query ||
      !/^\d{1,4}$/.test(query.playerId) ||
      !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());

  var dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + ''),
    },
    playerId: query.playerId,
  };
  var option = {
    sort: {date: -1},
  };
  var dbQueries = {
    'BattingStats': {query: dbQuery, option: option},
    'PitchingStats': {query: dbQuery, option: option},
  };
  var format = function(data) {
    var battings = formatBattingStats(data.BattingStats);
    var pitchings = formatPitchingStats(data.PitchingStats);
    var playerName = (battings.results[0] ||
                      pitchings.results[0] || {}).playerName;
    return {
      playerId: query.playerId,
      playerName: playerName,
      batting: battings,
      pitching: pitchings,
    };
  };
  var action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}

function getAllStats(req, res) {
  var query = url.parse(req.url, true).query;
  
  if (!query || !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());
  
  var dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + '')
    },
  };
  var option = {
    sort: {date: -1},
  };
  var dbQueries = {
    'BattingStats': {query: dbQuery, option: option},
    'PitchingStats': {query: dbQuery, option: option},
  };
  var format = function(data) {
    return {
      batting: formatBattingStatsAll(data.BattingStats),
      pitching: formatPitchingStatsAll(data.PitchingStats),
    };
  };

  var action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}


// ------------------------------------------------------------
// Format
// ------------------------------------------------------------

function formatDataFromRequest(data) {
  var date = new Date(data.date);
  var ground = data.ground;

  var score = data.gameScore;
  score.date = date;
  score.ground = ground;

  var batters = filterEmptyPlayer(data.battingStats);
  batters.forEach(function(batter) {
    batter.date = date;
    batter.ground = ground;
    batter.atbats = filterEmptyAtbat(batter.atbats);
  });
  addAppearanceOrderToBatters(batters);

  var pitchers = filterEmptyPlayer(data.pitchingStats);
  pitchers.forEach(function(pitcher) {
    pitcher.date = date;
    pitcher.ground = ground;
  });

  return {
    'GameScore': score,
    'BattingStats': batters,
    'PitchingStats': pitchers,
  };
}

function formatBattingStats(data) {
  return {
    results: data,
    stats: {
      total: calcBattingStats(data),
      risp: calcBattingStatsRisp(data),
    },
  };
}

function formatPitchingStats(data) {
  return {
    results: data,
    stats: {
      total: calcPitchingStats(data)
    },
  };
}

function formatBattingStatsAll(data) {
  var players = [];
  var groups = groupResultsByPlayer(data);
  for (var pid in groups) {
    var stats = calcBattingStats(groups[pid]);
    stats.playerId = pid;
    stats.playerName = groups[pid][0].playerName;
    players.push(stats);
  }
  return players;
}

function formatPitchingStatsAll(data) {
  var players = [];
  var groups = groupResultsByPlayer(data);
  for (var pid in groups) {
    var stats = calcPitchingStats(groups[pid]);
    stats.playerId = pid;
    stats.playerName = groups[pid][0].playerName;
    players.push(stats);
  }
  return players;
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

function filterEmptyPlayer(players) {
  return players.filter(function(player) {
    return player.playerName !== null;
  });
}

function filterEmptyAtbat(atbats) {
  return atbats.filter(function(atbat) {
    return atbat.result !== null;
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
    'go', 'fo', 'dp', 'so', 'uts', 'e', 'she',
  ];
  var noAtbatKinds = ['bb', 'ibb', 'hbp', 'sf', 'sh', 'she'];
  
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
  r.sh = r.sh + r.she;
  r.e = r.e + r.she;
  
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
  stats.avg = s.h / (s.bf - s.bb);
  stats.whip = (s.h + s.bb) / (s.out / 3);
  stats.k9 = (s.so * 9) / (s.out / 3);
  stats.wpct = s.win / (s.win + s.lose);

  return stats;
}


//==============================================================
// Export
//==============================================================

module.exports = app;
