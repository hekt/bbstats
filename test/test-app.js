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

// My modules
var app = require('../src/app');
var db = require('../src/db');
var config = require('../src/config');
var myutil = require('../src/util');

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

var dbUri = 'mongodb://localhost/bbstats-testing';
var dbModels = ['GameScore', 'BattingStats', 'PitchingStats'];
init(dbUri, dbModels);

describe('app.js', function() {
  describe('app.api called with GET', function() {
    
    // invalid url
    
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

    // game_score
    
    it('/api/game_score responses 200', function(done) {
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
    it('/api/game_score responses scores', function(done) {
      var expected = viaJSON(gameScoreMocks.slice(0, 2));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      saveScores(2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms order option', function(done) {
      var input = 'asc';
      var expected = viaJSON(gameScoreMocks.slice(0).reverse());

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {order: input}),
      });

      saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms date option', function(done) {
      var input = '2012-05-20';
      var expected = viaJSON(gameScoreMocks.slice(0, 1));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {date: input}),
      });

      saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms year option', function(done) {
      var input = '2012';
      var expected = viaJSON(gameScoreMocks.slice(0,3));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {year: input}),
      });

      saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
    it('/api/game_score conforms ground option', function(done) {
      var input = 'マツダスタジアム';
      var expected = viaJSON(gameScoreMocks.slice(0,2));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {ground: input}),
      });

      saveScores(4).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });

    // batting_stats
    
    it('/api/batting_stats responses 200', function(done) {
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
    it('/api/batting_stats responses stats', function(done) {
      var expected = viaJSON(battingMocks);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      saveStats('BattingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
    it('/api/batting_stats confirms player option', function(done) {
      var input = 1;
      var expected = viaJSON(battingMocks.slice(0, 1));

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/batting_stats', {player: input}),
      });

      saveStats('BattingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });

    // pitching_stats
    
    it('/api/pitching_stats responses stats', function(done) {
      var expected = viaJSON(pitchingMocks);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/pitching_stats',
      });

      saveStats('PitchingStats', 2).then(app.api.bind(null, req, res))
        .then(function() {
          var data = JSON.parse(res._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
  });

  describe('app.api with POST', function() {
    it('invalid url responses 404', function(done) {
      var expectedStatus = 404;
      var expectedContent = 'NotFoundError: Not Found\n';
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/path/to/invalid/url'
      });
      req.pipe = createPipeMock('');
      
      app.api(req, res).then(function() {
        res.statusCode.should.equal(expectedStatus);
        res._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });

    // game_score
    
    it('/api/game_score responses status code 204', function(done) {
      var data = JSON.stringify(gameScoreMocks[0]);
      var expectedStatus = 204;
      var expectedContent = '';
      
      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/game_score',
      });
      req.pipe = createPipeMock(data);
      
      app.api(req, res).then(function() {
        res.statusCode.should.equal(expectedStatus);
        res._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });
    it('/api/game_score with valid data saves data', function(done) {
      var data = JSON.stringify(gameScoreMocks[0]);
      var expected = gameScoreMocks.slice(0, 1);

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/game_score',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        return findOne('GameScore');
      }).then(function(doc) {
        doc.toObject().should.eql(gameScoreMocks[0]);
        done();
      }).catch(done);
    });
    it('/api/game_score with empty body returns 400', function(done) {
      var data = null;
      var expected = 400;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/game_score',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('/api/game_score winth invalid json returns 400', function(done) {
      var data = JSON.stringify({});
      var expected = 400;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/game_score',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });

    // batting_stats

    it('/api/batting_stats responses 204', function(done) {
      var data = JSON.stringify(battingMocks);
      var expectedStatus = 204;
      var expectedContent = '';

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/batting_stats',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        res.statusCode.should.equal(expectedStatus);
        res._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });
    it('/api/batting_stats with valid data saves data', function(done) {
      var data = JSON.stringify(battingMocks);
      var expected = battingMocks;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/batting_stats',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        return findAll('BattingStats');
      }).then(function(docs) {
        var objs = docs.map(function(doc) {
          return doc.toObject();
        });
        objs.should.eql(expected);
        done();
      }).catch(done);
    });

    // pitching_stats

    it('/api/pitching_stats with valid data saves data', function(done) {
      var data = JSON.stringify(pitchingMocks);
      var expected = pitchingMocks;

      var res = httpMocks.createResponse();
      var req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/pitching_stats',
      });
      req.pipe = createPipeMock(data);

      app.api(req, res).then(function() {
        return findAll('PitchingStats');
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


// -------------------------------------------------------------
// mock data
// -------------------------------------------------------------

var scoreMock = {
  firstTeam: {
    name: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  secondTeam: {
    name: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
};
var gameScoreMocks = [
  { date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    result: 'win',
    score: scoreMock, },
  { date: new Date('2012-05-19T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    result: 'lose',
    score: scoreMock },
  { date: new Date('2012-05-17T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
    score: scoreMock },
  { date: new Date('2011-05-16T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
    score: scoreMock },
];

var atbatsMock = [{
  inning: 1,
  runners: {first: true, second: false, third: true},
  outCount: 2,
  result: 'ヒット',
  resultKind: 'h'
}];
var battingMocks = [
  { playerId: 1,
    date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    rbi: 2,
    run: 3,
    sb: 4,
    error: 5,
    atbats: atbatsMock },
  { playerId: 10,
    date: new Date('2012-05-19T00:00:00.000Z'),
    ground: '甲子園',
    rbi: 0,
    run: 0,
    sb: 0,
    error: 0,
    atbats: atbatsMock },
];

var pitchingMocks = [
  { playerId: 18,
    date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    out: 27,
    run: 0,
    erun: 0,
    so: 18,
    bb: 0,
    hit: 0,
    error: 1 },
  { playerId: 19,
    date: new Date('2012-05-19T00:00:00.000Z'),
    ground: '甲子園',
    out: 3,
    run: 4,
    erun: 0,
    so: 1,
    bb: 2,
    hit: 5,
    error: 0 },
];


// -------------------------------------------------------------
// helpers
// -------------------------------------------------------------

function viaJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function findAll(model, query) {
  var Model = db.model(model);
  var dbQuery = Model.find(query, '-_id -__v');

  return myutil.promisize(dbQuery.exec, dbQuery);
}

function findOne(model, query) {
  var Model = db.model(model);
  var dbQuery = Model.findOne(query, '-_id -__v');

  return myutil.promisize(dbQuery.exec, dbQuery);
}

function createPipeMock(data) {
  return function(dist) { dist.end(data, 'utf-8'); };
}

function buildUrl(pathname, query) {
  return url.format({
    protocol: 'http',
    host: 'localhost',
    pathname: pathname,
    query: query,
  });
}

function saveScores(numberOfScores) {
  var Model = db.model('GameScore');
  
  var promises = [];
  var len = gameScoreMocks.length;
  var score;
  for (var i = 0; i < numberOfScores; i++) {
    score = new Model(gameScoreMocks[i % len]);
    promises.push(myutil.promisize(score.save, score));
  }

  return Promise.all(promises);
}

function saveStats(model, numberOfStats) {
  var Model = db.model(model);
  var mocks;
  if (model === 'BattingStats') {
    mocks = battingMocks;
  } else {
    mocks = pitchingMocks;
  }

  var promises = [];
  var len = mocks.length;
  var stat;
  for (var i = 0; i < numberOfStats; i++) {
    stat = new Model(mocks[i % len]);
    promises.push(myutil.promisize(stat.save, stat));
  }

  return Promise.all(promises);
}
