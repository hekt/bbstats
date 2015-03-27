'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var url = require('url');
var should = require('should');
var Stream = require('stream');
var Promise = require('es6-promise').Promise;
var httpMocks = require('node-mocks-http');

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
// Tests
// ------------------------------------------------------------

var dbUri = 'mongodb://localhost/bbstats-testing';
var dbModels = ['GameScore', 'BattingStats', 'PitchingStats',
                'AccessToken'];
init(dbUri, dbModels);

describe('app.js', function() {
  describe('app.api with GET invalid url', function() {
    it('invalid url responses 404', function(done) {
      var expectedStatus = 404;
      var expectedContent = 'NotFoundError: Not Found\n';
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/path/to/invalid/url'
      });
      
      app.api(req, res).then(function() {
        res.statusCode.should.equal(expectedStatus);
        res._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });
  });

  describe('app.api with GET /api/game_score', function() {
    it('responses 200', function(done) {
      var expectedStatus = 200;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expectedStatus);
        done();
      }).catch(done);
    });
    it('responses scores', function(done) {
      var expected = helper.viaJSON(mocks.gameScoreList.slice(0, 2));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      helper.saveScores(2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
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
    it('responses 200', function(done) {
      var expected = 200;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('responses stats', function(done) {
      var expected = helper.viaJSON(mocks.battingStatsList);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      helper.saveStats('BattingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
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
    it('responses stats', function(done) {
      var expected = helper.viaJSON(mocks.pitchingStatsList);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/pitching_stats',
      });

      helper.saveStats('PitchingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
  });

  describe('app.api with Unauthorized POST', function() {
    it('responses 401 when no authorization header', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: 'unrelated',
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('responses 401 when invalid auth header', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: 'unrelated',
        headers: {'Authorization': 'foo bar'},
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('responses 401 when invalid token', function(done) {
      var expected = 401;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: 'unrelated',
        headers: {'Authorization': 'Token invalidtoken'},
      });

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
  });

  describe('app.api with Authorized POST invalid url', function() {
    it('responses 404', function(done) {
      var expectedStatus = 404;
      var expectedContent = 'NotFoundError: Not Found\n';

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/path/to/invalid/url',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock('');

        var api = app.api.bind(app, req, res);

        app.api(req, res).then(function() {
          res.statusCode.should.equal(expectedStatus);
          res._getData().should.equal(expectedContent);
          done();
        }).catch(done);
      });
    });
  });

  describe('app.api with Authorized POST /api/game_score', function() {    
    it('responses 204', function(done) {
      var data = JSON.stringify(mocks.gameScoreList[0]);
      var expectedStatus = 204;
      var expectedContent = '';
      
      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/game_score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);
        
        app.api(req, res).then(function() {
          res.statusCode.should.equal(expectedStatus);
          res._getData().should.equal(expectedContent);
          done();
        }).catch(done);
      });
    });
    it('saves data if receives valid data', function(done) {
      var data = JSON.stringify(mocks.gameScoreList[0]);
      var expected = mocks.gameScoreList.slice(0, 1);

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/game_score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          return helper.findOne('GameScore');
        }).then(function(doc) {
          doc.toObject().should.eql(mocks.gameScoreList[0]);
          done();
        }).catch(done);
      });
    });
    it('returns 400 if receives no data', function(done) {
      var data = null;
      var expected = 400;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/game_score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          res.statusCode.should.equal(expected);
          done();
        }).catch(done);
      });
    });
    it('returns 400 if receives invalid data', function(done) {
      var data = JSON.stringify({});
      var expected = 400;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/game_score',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          res.statusCode.should.equal(expected);
          done();
        }).catch(done);
      });
    });
  });

  describe('app.api with Authorized POST /api/batting_stats', function() {    
    it('responses 204', function(done) {
      var data = JSON.stringify(mocks.battingStatsList);
      var expectedStatus = 204;
      var expectedContent = '';

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/batting_stats',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          res.statusCode.should.equal(expectedStatus);
          res._getData().should.equal(expectedContent);
          done();
        }).catch(done);
      });
    });
    it('saves data if receives valid data', function(done) {
      var data = JSON.stringify(mocks.battingStatsList);
      var expected = mocks.battingStatsList;

      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/batting_stats',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          return helper.findAll('BattingStats');
        }).then(function(docs) {
          var objs = docs.map(function(doc) {
            return doc.toObject();
          });
          objs.should.eql(expected);
          done();
        }).catch(done);
      });
    });
  });

  describe('app.api with Authorized POST /api/pitching_stats', function() {    
    it('saves data if receives valid data', function(done) {
      var data = JSON.stringify(mocks.pitchingStatsList);
      var expected = mocks.pitchingStatsList;
      
      AccessToken.issue().then(function(token) {
        var res = httpMocks.createResponse();
        var req = httpMocks.createRequest({
          method: 'POST',
          url: '/api/pitching_stats',
          headers: {authorization: 'Token ' + token},
        });
        req.pipe = helper.createPipeMock(data);

        app.api(req, res).then(function() {
          return helper.findAll('PitchingStats');
        }).then(function(docs) {
          var objs = docs.map(function(doc) {
            return doc.toObject();
          });
          objs.should.eql(expected);
          done();
        }).catch(done);
      });
    });
  });
  
});


// -------------------------------------------------------------
// mock data
// -------------------------------------------------------------

