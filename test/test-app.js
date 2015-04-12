'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var url = require('url');
var should = require('should');
var Stream = require('stream');
var Promise = require('es6-promise').Promise;
var httpMocks = require('node-mocks-http');
var strftime = require('strftime');
var AES = require('crypto-js/aes');

// my test modules
var init = require('./init');
var mocks = require('./mocks');
var helper = require('./helper');

// My modules
var app = require('../src/app');
var db = require('../src/db');
var config = require('../src/config');
var myutil = require('../src/util');
var promisize = myutil.promisize;
var CommonKey = require('../src/auth').CommonKey;


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

var dbUri = 'mongodb://localhost/bbstats-testing';
var dbModels = ['GameScore', 'BattingStats', 'PitchingStats',
                'AccessToken', 'TeamMember'];
init(dbUri, dbModels);

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('app.api', function() {
  describe('404', function() {
    it('GET unknown url', function() {
      var expected = 404;
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/path/to/invalid/url'
      });
      
      return app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
      });
    });
  });
  
  describe('201', function() {

    it('PUT /api/score', function() {
      var user = 'user';
      var key = 'password';
      var data = JSON.parse(mocks.dumped);
      data.timestamp = new Date();
      data.nonce = 'hogehoge';
      var json = JSON.stringify(data);
      var crypted = AES.encrypt(json, key).toString();
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/score',
        headers: {'X-BBStats-Authenticated-User': user},
      });
      req.pipe = helper.createPipeMock(crypted);
      var api = app.api.bind(null, req, res);

      return CommonKey.register(user, key).then(api).then(function() {
        res.statusCode.should.equal(201);
        var promises = [
          checkGameScoreKeysDB(1),
          checkBattingStatsKeysDB(data.battingStats.length),
          checkPitchingStatsKeysDB(data.pitchingStats.length),
        ];
        return Promise.all(promises);
      });
    });
    
  });

  describe('200 application/json', function() {

    it('GET /api/members', function() {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/members',
      });
      var api = app.api.bind(null, req, res);

      return helper.saveMembers().then(api).then(function() {
        checkHeader(res);
      });
    });
    
    it('GET /api/score', function() {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/score?year=2015',
      });
      var api = app.api.bind(null, req, res);

      return helper.saveScore().then(api).then(function() {
        var data = JSON.parse(res._getData());
        checkHeader(res);
        checkGameScoreKeys(data);
      });
    });

    it('GET /api/stats', function() {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats?date=2015-03-27',
      });
      var api = app.api.bind(null, req, res);
      
      var promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      return Promise.all(promises).then(api).then(function() {
        var data = JSON.parse(res._getData());
        checkHeader(res);
        checkBattingResultsKeys(data.batting);
        checkPitchingResultsKeys(data.pitching);
      });
    });

    it('GET /api/player/stats', function() {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/player/stats?playerId=6&year=2015',
      });
      var api = app.api.bind(null, req, res);

      return helper.saveResults('BattingStats').then(api).then(function() {
        var data = JSON.parse(res._getData());
        checkHeader(res);
        checkBattingResultsKeys(data.batting.results);
        checkPitchingResultsKeys(data.pitching.results);
        checkBattingStatsKeys(data.batting.stats.total);
        checkBattingStatsRispKeys(data.batting.stats.risp);
        checkPitchingStatsKeys(data.pitching.stats.total);
      });
    });

    it('GET /api/stats/both', function() {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats/both?year=2015',
      });
      var api = app.api.bind(null, req, res);

      var promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      return Promise.all(promises).then(api).then(function() {
        var data = JSON.parse(res._getData());
        checkHeader(res);
        data.batting.forEach(function(stats) {
          checkBattingStatsAllKeys(stats);
        });
        data.pitching.forEach(function(stats) {
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
  var keys = ['date', 'ground', 'result', 'awayTeam', 'homeTeam'];
  var teamKeys = ['teamName', 'totalRuns', 'totalHits', 'totalErrors', 'runs'];
  data.forEach(function(score) {
    score.should.have.keys(keys);
    score.awayTeam.should.have.keys(teamKeys);
    score.homeTeam.should.have.keys(teamKeys);
  });
}
function checkBattingResultsKeys(data) {
  var keys = ['playerId', 'playerName', 'order', 'appearanceOrder',
              'positions','date', 'ground', 'run', 'sb', 'error',
              'atbats'];
  var atbatKeys = ['inning', 'rbi', 'runners', 'outCount', 'result',
                   'resultKind'];
  var runnersKeys = ['first', 'second', 'third'];
  data.forEach(function(batter) {
    batter.should.have.keys(keys);
    batter.atbats.forEach(function(atbat) {
      atbat.should.have.keys(atbatKeys);
      atbat.runners.should.have.keys(runnersKeys);
    });
  });
}
function checkPitchingResultsKeys(data) {
  var keys = ['playerId', 'playerName', 'date', 'ground', 'out', 'bf',
              'run', 'erun', 'so', 'bb', 'h', 'hr', 'error', 'result'];
  data.forEach(function(pitcher) {
    pitcher.should.have.keys(keys);
  });
}
function checkBattingStatsKeys(data) {
  var keys = ['g', 'ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'run', 'sb',
              'error', 'avg', 'obp', 'slg', 'ops'];
  data.should.have.keys(keys);
}
function checkBattingStatsRispKeys(data) {
  var keys = ['ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'avg', 'obp',
              'slg', 'ops'];
  data.should.have.keys(keys);
}
function checkPitchingStatsKeys(data) {
  var keys = ['g', 'win', 'lose', 'save', 'hold', 'out', 'bf', 'run',
              'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error', 'era',
              'avg', 'whip', 'k9', 'wpct'];
  data.should.have.keys(keys);
}
function checkBattingStatsAllKeys(data) {
  var keys = ['g', 'ab', 'h', 'hr', 'so', 'bb', 'hbp', 'rbi', 'run', 'sb',
              'error', 'avg', 'obp', 'slg', 'ops', 'playerId', 'playerName'];
  data.should.have.keys(keys);
}
function checkPitchingStatsAllKeys(data) {
  var keys = ['g', 'win', 'lose', 'save', 'hold', 'out', 'bf', 'run',
              'erun', 'so', 'bb', 'h', 'hit', 'hr', 'error', 'era',
              'avg', 'whip', 'k9', 'wpct', 'playerId', 'playerName'];
  data.should.have.keys(keys);
}

function checkGameScoreKeysDB(len) {
  var keys = ['date', 'ground', 'result', 'awayTeam', 'homeTeam'];
  var teamKeys = ['teamName', 'totalRuns', 'totalErrors', 'totalHits', 'runs'];
  var dbQuery = db.model('GameScore').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(function(docs) {
    docs.length.should.equal(len);
    docs.forEach(function(doc) {
      var obj = doc.toObject();
      obj.should.have.keys(keys);
      obj.awayTeam.should.have.keys(teamKeys);
      obj.homeTeam.should.have.keys(teamKeys);
    });
  });
}
function checkBattingStatsKeysDB(len) {
  var keys = ['playerId', 'playerName', 'order', 'appearanceOrder',
              'positions', 'date', 'ground', 'run', 'sb', 'error', 'atbats'];
  var atbatKeys = ['inning', 'rbi', 'runners', 'outCount', 'result',
                   'resultKind'];
  var runnersKeys = ['first', 'second', 'third'];
  var dbQuery = db.model('BattingStats').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(function(docs) {
    docs.length.should.equal(len);
    docs.forEach(function(doc) {
      var obj = doc.toObject();
      obj.should.have.keys(keys);
      obj.atbats.forEach(function(atbat) {
        atbat.should.have.keys(atbatKeys);
        atbat.runners.should.have.keys(runnersKeys);
      });
    });
  });
}
function checkPitchingStatsKeysDB(len) {
  var keys = ['playerId', 'playerName', 'date', 'ground', 'out', 'bf', 'run',
              'erun', 'so', 'bb', 'h', 'hr', 'error', 'result'];
  var dbQuery = db.model('PitchingStats').find(null, '-_id -__v');
  return promisize(dbQuery.exec, dbQuery).then(function(docs) {
    docs.length.should.equal(len);
    docs.forEach(function(doc) {
      var obj = doc.toObject();
      obj.should.have.keys(keys);
    });
  });
}
