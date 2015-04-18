'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let url = require('url');
let should = require('should');
let Stream = require('stream');
let httpMocks = require('node-mocks-http');
let strftime = require('strftime');
let AES = require('crypto-js/aes');

// my test modules
let init = require('./init');
let mocks = require('./mocks');
let helper = require('./helper');

// My modules
let app = require('../src/app');
let db = require('../src/db');
let config = require('../src/config');
let myutil = require('../src/util');
let promisize = myutil.promisize;
let CommonKey = require('../src/auth').CommonKey;


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

let dbUri = 'mongodb://localhost/bbstats-testing';
let dbModels = ['GameScore', 'BattingStats', 'PitchingStats',
                'CommonKey', 'TeamMember'];
init(dbUri, dbModels);

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('app.api', () => {
  describe('404', () => {
    it('GET unknown url', () => {
      let expected = 404;
      
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/path/to/invalid/url'
      });
      
      return app.api(req, res).then(() => {
        res.statusCode.should.equal(expected);
      });
    });
  });
  
  describe('201', () => {

    it('PUT /api/score', () => {
      let user = 'user';
      let key = 'password';
      let data = JSON.parse(mocks.dumped);
      data.timestamp = new Date();
      data.nonce = 'hogehoge';
      let json = JSON.stringify(data);
      let crypted = AES.encrypt(json, key).toString();
      
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/score',
        headers: {'X-BBStats-Authenticated-User': user},
      });
      req.pipe = helper.createPipeMock(crypted);
      let api = app.api.bind(null, req, res);

      return CommonKey.register(user, key).then(api).then(() => {
        res.statusCode.should.equal(201);
        let promises = [
          checkGameScoreKeysDB(1),
          checkBattingStatsKeysDB(data.battingStats.length),
          checkPitchingStatsKeysDB(data.pitchingStats.length),
        ];
        return Promise.all(promises);
      });
    });
    
  });

  describe('200 application/json', () => {

    it('GET /api/members', () => {
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/members',
      });
      let api = app.api.bind(null, req, res);

      return helper.saveMembers().then(api).then(() => {
        checkHeader(res);
      });
    });
    
    it('GET /api/score', () => {
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/score?year=2015',
      });
      let api = app.api.bind(null, req, res);

      return helper.saveScore().then(api).then(() => {
        let data = JSON.parse(res._getData());
        checkHeader(res);
        checkGameScoreKeys(data);
      });
    });

    it('GET /api/stats', () => {
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats?date=2015-03-27',
      });
      let api = app.api.bind(null, req, res);
      
      let promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      return Promise.all(promises).then(api).then(() => {
        let data = JSON.parse(res._getData());
        checkHeader(res);
        checkBattingResultsKeys(data.batting);
        checkPitchingResultsKeys(data.pitching);
      });
    });

    it('GET /api/player/stats', () => {
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/player/stats?playerId=6&year=2015',
      });
      let api = app.api.bind(null, req, res);

      return helper.saveResults('BattingStats').then(api).then(() => {
        let data = JSON.parse(res._getData());
        checkHeader(res);
        checkBattingResultsKeys(data.batting.results);
        checkPitchingResultsKeys(data.pitching.results);
        checkBattingStatsKeys(data.batting.stats.total);
        checkBattingStatsRispKeys(data.batting.stats.risp);
        checkPitchingStatsKeys(data.pitching.stats.total);
      });
    });

    it('GET /api/stats/both', () => {
      let res = httpMocks.createResponse();
      let req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats/both?year=2015',
      });
      let api = app.api.bind(null, req, res);

      let promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      return Promise.all(promises).then(api).then(() => {
        let data = JSON.parse(res._getData());
        checkHeader(res);
        data.batting.forEach(stats => {
          checkBattingStatsAllKeys(stats);
        });
        data.pitching.forEach(stats => {
          checkPitchingStatsAllKeys(stats);
        });
      });
    });
  });
  
});


// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------

function checkHeader(res) {
  res.statusCode.should.equal(200);
  res.getHeader('content-type').should
    .equal('application/json; charset=utf-8');
}
function checkGameScoreKeys(data) {
  let keys = ['date', 'ground', 'result', 'awayTeam', 'homeTeam'];
  let teamKeys = ['teamName', 'totalRuns', 'totalHits', 'totalErrors', 'runs'];
  data.forEach(score => {
    score.should.have.keys(keys);
    score.awayTeam.should.have.keys(teamKeys);
    score.homeTeam.should.have.keys(teamKeys);
  });
}
function checkBattingResultsKeys(data) {
  let keys = ['playerId', 'playerName', 'order', 'appearanceOrder',
              'positions','date', 'ground', 'run', 'sb', 'error',
              'atbats'];
  let atbatKeys = ['inning', 'rbi', 'runners', 'outCount', 'result',
                   'resultKind'];
  let runnersKeys = ['first', 'second', 'third'];
  data.forEach(batter => {
    batter.should.have.keys(keys);
    batter.atbats.forEach(atbat => {
      atbat.should.have.keys(atbatKeys);
      atbat.runners.should.have.keys(runnersKeys);
    });
  });
}
function checkPitchingResultsKeys(data) {
  let keys = ['playerId', 'playerName', 'order', 'date', 'ground', 'out', 'bf',
              'run', 'erun', 'so', 'bb', 'h', 'hr', 'error', 'result'];
  data.forEach(pitcher => {
    pitcher.should.have.keys(keys);
  });
}
function checkBattingStatsKeys(data) {
  let keys = ['g', 'ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'run', 'sb',
              'error', 'avg', 'obp', 'slg', 'ops'];
  data.should.have.keys(keys);
}
function checkBattingStatsRispKeys(data) {
  let keys = ['ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'avg', 'obp',
              'slg', 'ops'];
  data.should.have.keys(keys);
}
function checkPitchingStatsKeys(data) {
  let keys = ['g', 'win', 'lose', 'save', 'hold', 'out', 'bf', 'run',
              'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error', 'era',
              'avg', 'whip', 'k9', 'wpct'];
  data.should.have.keys(keys);
}
function checkBattingStatsAllKeys(data) {
  let keys = ['g', 'ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'run', 'sb',
              'error', 'avg', 'obp', 'slg', 'ops', 'playerId', 'playerName'];
  data.should.have.keys(keys);
}
function checkPitchingStatsAllKeys(data) {
  let keys = ['g', 'win', 'lose', 'save', 'hold', 'out', 'bf', 'run',
              'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error', 'era',
              'avg', 'whip', 'k9', 'wpct', 'playerId', 'playerName'];
  data.should.have.keys(keys);
}

function checkGameScoreKeysDB(len) {
  let keys = ['date', 'ground', 'result', 'awayTeam', 'homeTeam'];
  let teamKeys = ['teamName', 'totalRuns', 'totalErrors', 'totalHits', 'runs'];
  let dbQuery = db.model('GameScore').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(docs => {
    docs.length.should.equal(len);
    docs.forEach(doc => {
      let obj = doc.toObject();
      obj.should.have.keys(keys);
      obj.awayTeam.should.have.keys(teamKeys);
      obj.homeTeam.should.have.keys(teamKeys);
    });
  });
}
function checkBattingStatsKeysDB(len) {
  let keys = ['playerId', 'playerName', 'order', 'appearanceOrder',
              'positions', 'date', 'ground', 'run', 'sb', 'error', 'atbats'];
  let atbatKeys = ['inning', 'rbi', 'runners', 'outCount', 'result',
                   'resultKind'];
  let runnersKeys = ['first', 'second', 'third'];
  let dbQuery = db.model('BattingStats').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(docs => {
    docs.length.should.equal(len);
    docs.forEach(doc => {
      let obj = doc.toObject();
      obj.should.have.keys(keys);
      obj.atbats.forEach(atbat => {
        atbat.should.have.keys(atbatKeys);
        atbat.runners.should.have.keys(runnersKeys);
      });
    });
  });
}
function checkPitchingStatsKeysDB(len) {
  let keys = ['playerId', 'playerName', 'order', 'date', 'ground', 'out',
              'bf', 'run', 'erun', 'so', 'bb', 'h', 'hr', 'error', 'result'];
  let dbQuery = db.model('PitchingStats').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(docs => {
    docs.length.should.equal(len);
    docs.forEach(doc => {
      let obj = doc.toObject();
      obj.should.have.keys(keys);
    });
  });
}
