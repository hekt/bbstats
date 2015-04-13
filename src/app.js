'use strict';


// =============================================================
// Modules
// =============================================================

let url = require('url');
let bl = require('bl');
let strftime = require('strftime');

// app module
let error = require('./error.js');
let myutil = require('./util.js');
let Action = require('./action').Action;
let CommonKey = require('./auth').CommonKey;


// =============================================================
// Header
// =============================================================

let app = {};
app.api = api;


// =============================================================
// Implementation
// =============================================================

let apiActionSet = {
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
  let urlObj = url.parse(req.url, true);
  let target = urlObj.pathname.replace(/\/api\/([a-z_]+\/?[a-z_]*)/, '$1');
  let action = apiActionSet[req.method][target];
  let errorHandler = writeErrorResponse.bind(null, req, res);
  
  if (!action)
    return Promise.reject(new error.NotFoundError()).catch(errorHandler);
  else
    return action(req, res).catch(errorHandler);
}

function writeErrorResponse(req, res, err) {
  let data = error.toHttpData(err);
  let status = data.statusCode;
  let header = {'content-type': 'text/plain; charset=utf-8'};
  let content = data.message + '\n';

  res.writeHead(status, header);
  res.end(content);

  if (data.statusCode === 500)
    console.error(err, err.stack);
  
  return err;
}


// ------------------------------------------------------------
// PUT
// ------------------------------------------------------------

function saveScore(req, res) {
  let action = new Action();
  let models = new Map([
    ['GameScore',     ['date']],
    ['BattingStats',  ['date', 'playerId']],
    ['PitchingStats', ['date', 'playerId']],
  ]);
  return action.read(req).format(formatDataFromRequest)
    .saveEach(models).getPromise().then(data => {
      let u = url.parse(req.url);
      let loc = 'http://' + u.host + '/score/' +
            strftime('%F', data.GameScore.date);
      res.writeHead(201, {Location: loc});
      res.end();
    });
}


// -------------------------------------------------------------
// GET
// -------------------------------------------------------------

function getMembers(req, res) {
  let action = new Action();
  return action.load('TeamMember').write(res).getPromise();
}

function getScoresByYear(req, res) {
  let query = url.parse(req.url, true).query;

  if (!query || !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());
  
  let dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + '')
    },
  };
  let option = {
    sort: {date: -1}
  };
  let action = new Action();
  return action.load('GameScore', dbQuery, option).write(res).getPromise();
}

function getStatsByDate(req, res) {
  let query = url.parse(req.url, true).query;
  let date = query ? new Date(query.date) : null;

  if (!query || !myutil.isValidDate(date))
    return Promise.reject(new error.MissingParameterError());
  
  let dbQuery = {
    date: date,
  };
  let option = {
    sort: {order: 1, appearanceOrder: 1},
  };
  let dbQueries = new Map([
    ['BattingStats',  {query: dbQuery, option: option}],
    ['PitchingStats', {query: dbQuery, option: option}],
  ]);
  let format = data => {
    return {batting: data.BattingStats, pitching: data.PitchingStats};
  };
  
  let action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}

function getStatsByPlayer(req, res) {
  let query = url.parse(req.url, true).query;

  if (!query ||
      !/^\d{1,4}$/.test(query.playerId) ||
      !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());

  let dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + ''),
    },
    playerId: query.playerId,
  };
  let option = {
    sort: {date: -1},
  };
  let dbQueries = new Map([
    ['BattingStats',  {query: dbQuery, option: option}],
    ['PitchingStats', {query: dbQuery, option: option}],
  ]);
  let format = data => {
    let battings = formatBattingStats(data.BattingStats);
    let pitchings = formatPitchingStats(data.PitchingStats);
    let playerName = (battings.results[0] ||
                      pitchings.results[0] || {}).playerName;
    return {
      playerId: query.playerId,
      playerName: playerName,
      batting: battings,
      pitching: pitchings,
    };
  };
  let action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}

function getAllStats(req, res) {
  let query = url.parse(req.url, true).query;
  
  if (!query || !/^\d{4}$/.test(query.year))
    return Promise.reject(new error.MissingParameterError());
  
  let dbQuery = {
    date: {
      $gte: new Date(query.year),
      $lt: new Date(query.year - -1 + '')
    },
  };
  let option = {
    sort: {date: -1},
  };
  let dbQueries = new Map([
    ['BattingStats',  {query: dbQuery, option: option}],
    ['PitchingStats', {query: dbQuery, option: option}],
  ]);
  let format = data => {
    return {
      batting: formatBattingStatsAll(data.BattingStats),
      pitching: formatPitchingStatsAll(data.PitchingStats),
    };
  };

  let action = new Action();
  return action.loadEach(dbQueries).format(format).write(res).getPromise();
}


// ------------------------------------------------------------
// Format
// ------------------------------------------------------------

function formatDataFromRequest(data) {
  let date = new Date(data.date);
  let ground = data.ground;

  let score = data.gameScore;
  score.date = date;
  score.ground = ground;

  let batters = filterEmptyPlayer(data.battingStats);
  batters.forEach(batter => {
    batter.date = date;
    batter.ground = ground;
    batter.atbats = filterEmptyAtbat(batter.atbats);
  });
  addAppearanceOrderToBatters(batters);

  let pitchers = filterEmptyPlayer(data.pitchingStats);
  pitchers.forEach(pitcher => {
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
  let players = [];
  let groups = groupResultsByPlayer(data);
  for (let pid in groups) {
    let stats = calcBattingStats(groups[pid]);
    stats.playerId = pid;
    stats.playerName = groups[pid][0].playerName;
    players.push(stats);
  }
  return players;
}

function formatPitchingStatsAll(data) {
  let players = [];
  let groups = groupResultsByPlayer(data);
  for (let pid in groups) {
    let stats = calcPitchingStats(groups[pid]);
    stats.playerId = pid;
    stats.playerName = groups[pid][0].playerName;
    players.push(stats);
  }
  return players;
}

function groupResultsByPlayer(results) {
  let obj = {};
  results.forEach(result => {
    let pid = result.playerId;
    obj[pid] = obj[pid] || [];
    obj[pid].push(result);
  });
  return obj;
}

function filterEmptyPlayer(players) {
  return players.filter(player => player.playerName !== null);
}

function filterEmptyAtbat(atbats) {
  return atbats.filter(atbat => atbat.result !== null);
}

function addAppearanceOrderToBatters(batters) {
  let tempOrder = 0;
  let tempAppear = 0;
  batters.forEach(batter => {
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
  let atbats = [];
  results.forEach(result => {
    atbats = atbats.concat(result.atbats);
  });

  let stats = calcBattingStatsInner(atbats);
  stats.g = results.length;
  ['run', 'sb', 'error'].forEach(stat => {
    stats[stat] = myutil.sum(results.map(result => Number(result[stat]) || 0));
  });
  
  return stats;
}

function calcBattingStatsRisp(results) {
  let atbats = [];
  results.forEach(result => {
    atbats = atbats.concat(result.atbats);
  });
  atbats = atbats.filter(atbat => atbat.runners.second || atbat.runners.third);

  return calcBattingStatsInner(atbats);
}

function calcBattingStatsInner(atbats) {
  let counts = getResultCounts(atbats);
  let stats = {
    ab: counts.ab,
    h: counts.h,
    hr: counts.hr,
    so: counts.so,
    bb: counts.bb,
    hbp: counts.hbp,
  };

  stats.rbi = myutil.sum(atbats.map(atbat => Number(atbat.rbi) || 0));
  
  let c = counts; // i want to use with statement in strict mode...
  stats.avg = c.h / c.ab;
  stats.obp = (c.h + c.bb + c.hbp) / (c.ab + c.bb + c.hbp + c.sf);
  stats.slg = c.tb / c.ab;
  stats.ops = stats.obp + stats.slg;

  return stats;
}

function getResultCounts(atbats) {
  let kinds = atbats.map(atbat => atbat.resultKind);
  let knownKinds = [
    'h', 'dbl', 'tpl', 'hr', 'bb', 'ibb', 'hbp', 'sf', 'sh',
    'go', 'fo', 'dp', 'so', 'uts', 'e', 'she',
  ];
  let noAtbatKinds = ['bb', 'ibb', 'hbp', 'sf', 'sh', 'she'];
  
  let r = {pa: 0, ab: 0};
  knownKinds.forEach(k => {
    r[k] = 0;
  });
  
  kinds.forEach(kind => {
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
  let stats = {
    g: results.length,
    win: 0,
    lose: 0,
    hold: 0,
    save: 0,
  };

  results.forEach(result => {
    let r = result.result;
    if (r) stats[r]++;
  });

  let statKinds = [
    'out', 'bf', 'run', 'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error'
  ];
  statKinds.forEach(stat => {
    stats[stat] = myutil.sum(results.map(result => Number(result[stat]) || 0));
  });

  let s = stats;
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
