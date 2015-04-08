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
                'AccessToken', 'TeamMember'];
init(dbUri, dbModels);

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

describe('app.api', function() {
  describe('404', function() {
    it('GET unknown url', function(done) {
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

  describe('200 application/json', function() {
    function json200(res) {
      res.statusCode.should.equal(200);
      res.getHeader('content-type').should
        .equal('application/json; charset=utf-8');
      JSON.parse(res._getData());
    }
    
    it('GET /api/score', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/score',
      });
      var api = app.api.bind(null, req, res);

      helper.saveScore().then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });

    it('GET /api/stats', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/stats', {date: '2015-03-27'}),
      });
      var api = app.api.bind(null, req, res);
      
      var promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      Promise.all(promises).then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });

    it('GET /api/player/stats', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: helper.buildUrl('/api/player/stats', {playerId: 6}),
      });
      var api = app.api.bind(null, req, res);

      helper.saveResults('BattingStats').then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });

    it('GET /api/stats/batting', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats/batting',
      });
      var api = app.api.bind(null, req, res);

      helper.saveResults('BattingStats').then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });

    it('GET /api/stats/pitching', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats/pitching',
      });
      var api = app.api.bind(null, req, res);

      helper.saveResults('PitchingStats').then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });

    it('GET /api/stats/both', function(done) {
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/stats/both',
      });
      var api = app.api.bind(null, req, res);

      var promises = [
        helper.saveResults('BattingStats'),
        helper.saveResults('PitchingStats'),
      ];

      Promise.all(promises).then(api).then(function() {
        json200(res);
        done();
      }).catch(done);
    });
  });
  
});
