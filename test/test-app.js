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

// my test modules
var init = require('./init');
var mocks = require('./mocks');
var helper = require('./helper');

// My modules
var app = require('../src/app');
var db = require('../src/db');
var config = require('../src/config');
var myutil = require('../src/util');
var AccessToken = require('../src/auth').AccessToken;


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

var dbUri = 'mongodb://localhost/bbstats-testing';
var dbModels = ['GameScore', 'BattingStats', 'PitchingStats',
                'AccessToken'];
init(dbUri, dbModels);

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('app.js', function() {
  describe('app.api with GET invalid url', function() {
    it('sends 404', function(done) {
      var expected = 404;
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/path/to/invalid/url'
      });
      
      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
  });

  describe('app.api with GET /api/game_score', function() {
    it('sends 200 with json', function(done) {
      var expectedStatus = 200;
      var expectedType = 'application/json; charset=utf-8';
      var expectedContent = helper.viaJSON(mocks.gameScoreList.slice(0, 2));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      helper.saveScores(2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          res.statusCode.should.equal(expectedStatus);
          res.getHeader('content-type').should.equal(expectedType);
          data.should.eql(expectedContent);
          done();
        })
        .catch(done);
    });
    it('conforms order option', function(done) {
      var input = 'asc';
      var expected = helper.viaJSON(mocks.gameScoreList.slice(0).reverse());

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/game_score', {order: input}),
      });

      helper.saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('conforms date option', function(done) {
      var input = '2012-05-20';
      var expected = helper.viaJSON(mocks.gameScoreList.slice(0, 1));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/game_score', {date: input}),
      });

      helper.saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('conforms year option', function(done) {
      var input = '2012';
      var expected = helper.viaJSON(mocks.gameScoreList.slice(0,3));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/game_score', {year: input}),
      });

      helper.saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
    it('conforms ground option', function(done) {
      var input = 'マツダスタジアム';
      var expected = helper.viaJSON(mocks.gameScoreList.slice(0,2));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/game_score', {ground: input}),
      });

      helper.saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
  });

  describe('app.api with GET /api/batting_stats', function() {    
    it('sends 200 with json', function(done) {
      var expectedStatus = 200;
      var expectedType = 'application/json; charset=utf-8';
      var expectedContent = helper.viaJSON(mocks.battingStatsList);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      helper.saveStats('BattingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          res.statusCode.should.equal(expectedStatus);
          res.getHeader('content-type').should.equal(expectedType);
          data.should.eql(expectedContent);
          done();
        }).catch(done);
    });
    it('confirms player option', function(done) {
      var input = 1;
      var expected = helper.viaJSON(mocks.battingStatsList.slice(0, 1));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/batting_stats', {player: input}),
      });

      helper.saveStats('BattingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
  });

  describe('app.api with GET /api/pitching_stats', function() {    
    it('sends 200 with json', function(done) {
      var expectedStatus = 200;
      var expectedType = 'application/json; charset=utf-8';
      var expectedContent = helper.viaJSON(mocks.pitchingStatsList);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/pitching_stats',
      });

      helper.saveStats('PitchingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          res.statusCode.should.equal(expectedStatus);
          res.getHeader('content-type').should.equal(expectedType);
          data.should.eql(expectedContent);
          done();
        }).catch(done);
    });
  });

  describe('app.api with Unauthorized PUT', function() {
    it('sends 401 when no authorization header', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'PUT',
        url: 'unrelated',
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('sends 401 when invalid auth header', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'PUT',
        url: 'unrelated',
        headers: {'Authorization': 'foo bar'},
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('sends 401 when invalid token', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'PUT',
        url: 'unrelated',
        headers: {'Authorization': 'Token invalidtoken'},
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
  });

  describe('app.api with Authorized PUT invalid url', function() {
    it('sends 404', function(done) {
      var expected = 404;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'PUT',
          url: '/path/to/invalid/url',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock('');

        var api = app.api.bind(app, req, res);

        return app.api(req, res).then(function() {
          res.statusCode.should.equal(expected);
          done();
        });
      }).catch(done);
    });
  });

  describe('app.api with Authorized PUT /api/score', function() {
    it('sends 400 if receives no data', function(done) {
      var data = '';
      var expected = 400;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'PUT',
          url: '/api/score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        return app.api(req, res).then(function() {
          res.statusCode.should.equal(expected);
          done();
        });
      }).catch(done);
    });
    it('sends 400 if receives invalid data', function(done) {
      var data = 'invalid';
      var expected = 400;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'PUT',
          url: '/api/score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        return app.api(req, res).then(function() {
          res.statusCode.should.equal(expected);
          done();
        });
      }).catch(done);
    });
    it('sends 201 and Location header', function(done) {
      var data = JSON.stringify(mocks.allData);
      var expectedStatus = 201;
      var expectedLocation = 'http://localhost/score/' +
            strftime('%F', mocks.allData.score.date);

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'PUT',
          url: 'http://localhost/api/score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        return app.api(req, res).then(function() {
          res.statusCode.should.equal(expectedStatus);
          res.getHeader('Location').should.equal(expectedLocation);
          done();
        });
      }).catch(done);
    });
    it('saves data if receives valid data', function(done) {
      var data = JSON.stringify(mocks.allData);
      var expectedScore = helper.viaJSON(mocks.allData.score);
      var expectedBattingStats = helper.viaJSON(mocks.allData.batting);
      var expectedPitchingStats = helper.viaJSON(mocks.allData.pitching);

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'PUT',
          url: '/api/score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        return app.api(req, res).then(function() {
          var promises = [];
          promises.push(function() {
            return helper.findOne('GameScore').then(function(doc) {
              doc.toObject().should.eql(expectedScore);
            });
          });
          promises.push(function() {
            return helper.findAll('BattingStats').then(function(docs) {
              helper.toObjects(docs).should.eql(expectedBattingStats);
            });
          });
          promises.push(function() {
            return helper.findAll('Pitchingstats').then(function(docs) {
              helper.toObjects(docs).should.eql(expectedPitchingStats);
            });
          });

          return Promise.all(promises).then(function() { done(); });
        });
      }).catch(done);
    });
  });
  
});
