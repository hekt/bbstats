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

  
// ------------------------------------------------------------
// Tests
// ------------------------------------------------------------

var dbUri = 'mongodb://localhost/bbstats-testing';
var dbModels = ['GameScore', 'BattingStats', 'PitchingStats'];
init(dbUri, dbModels);

describe('app.js', function() {
  describe('app.api called with GET', function() {
    
    // invalid url
    it('invalid url responses status code 404', function(done) {
      var expectedStatus = 404;
      var expectedContent = 'NotFoundError: Not Found\n';
      
      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/path/to/invalid/url'
      });
      
      app.api(request, response).then(function() {
        response.statusCode.should.equal(expectedStatus);
        response._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });

    // game_score
    it('/api/game_score responses status code 200', function(done) {
      var expectedStatus = 200;

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      app.api(request, response).then(function() {
        response.statusCode.should.equal(expectedStatus);
        done();
      }).catch(done);
    });
    it('/api/game_score responses scores', function(done) {
      var expected = gameScoreMocks.slice(0, 2);

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/game_score',
      });

      saveScores(2).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms order option', function(done) {
      var input = 'asc';
      var expected = gameScoreMocks.slice(0).reverse();

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {order: input}),
      });

      saveScores(4).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms date option', function(done) {
      var input = '2012-05-20';
      var expected = gameScoreMocks.slice(0, 1);

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {date: input}),
      });

      saveScores(4).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        })
        .catch(done);
    });
    it('/api/game_score conforms year option', function(done) {
      var input = '2012';
      var expected = gameScoreMocks.slice(0,3);

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {year: input}),
      });

      saveScores(4).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
    it('/api/game_score conforms ground option', function(done) {
      var input = 'マツダスタジアム';
      var expected = gameScoreMocks.slice(0,2);

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/game_score', {ground: input}),
      });

      saveScores(4).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });

    // batting_stats
    it('/api/batting_stats responses status code 200', function(done) {
      var expected = 200;

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      app.api(request, response).then(function() {
        response.statusCode.should.equal(expected);
        done();
      }).catch(done);
    });
    it('/api/batting_stats responses stats', function(done) {
      var expected = battingMocks;

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/batting_stats',
      });

      saveStats('BattingStats', 2).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
    it('/api/batting_stats confirms player option', function(done) {
      var input = 1;
      var expected = battingMocks.slice(0, 1);

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: buildUrl('/api/batting_stats', {player: input}),
      });

      saveStats('BattingStats', 2).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });

    // pitching_stats
    it('/api/pitching_stats responses stats', function(done) {
      var expected = pitchingMocks;

      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'GET',
        url: '/api/pitching_stats',
      });

      saveStats('PitchingStats', 2).then(app.api.bind(null, request, response))
        .then(function() {
          var data = JSON.parse(response._getData());
          data.should.eql(expected);
          done();
        }).catch(done);
    });
  });

  describe('app.api with POST', function() {
    it('invalid url responses status code 404', function(done) {
      var expectedStatus = 404;
      var expectedContent = 'NotFoundError: Not Found\n';
      
      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'POST',
        url: '/path/to/invalid/url'
      });
      request.pipe = genPipeMock('');
      
      app.api(request, response).then(function() {
        response.statusCode.should.equal(expectedStatus);
        response._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });
    it('/api/game_score responses status code 204', function(done) {
      var data = JSON.stringify(gameScoreMocks[0]);
      
      var expectedStatus = 204;
      var expectedContent = '';
      
      var response = httpMocks.createResponse();
      var request = httpMocks.createRequest({
        method: 'POST',
        url: '/api/game_score',
      });
      request.pipe = genPipeMock(data);
      
      app.api(request, response).then(function() {
        response.statusCode.should.equal(expectedStatus);
        response._getData().should.equal(expectedContent);
        done();
      }).catch(done);
    });
  });

  // describe('app.api with POST then GET', function() {
  //   it('saves game score then responses it', function(done) {
  //     var input = JSON.stringify(gameScoreMock);

  //     var expectedStatus = 200;
  //     var expectedContent = [gameScoreMock];
      
  //     var postResponse = httpMocks.createResponse();
  //     var getResponse = httpMocks.createResponse();
  //     var postRequest = httpMocks.createRequest({
  //       method: 'POST',
  //       url: '/api/game_score',
  //     });
  //     postRequest.pipe = genPipeMock(input);
  //     var getRequest = httpMocks.createRequest({
  //       method: 'GET',
  //       url: '/api/game_score',
  //       param: {limit: 1},
  //     });

  //     app.api(postRequest, postResponse)
  //       .then(app.api.bind(null, getRequest, getResponse))
  //       .then(function() {
  //         var data = getResponse._getData();
  //         getResponse.statusCode.should.equal(expectedStatus);
  //         JSON.parse(data).should.eql(expectedContent);
  //         done();
  //       }).catch(done);
  //   });
  //   it('saves game score multiply then responses them', function(done) {
  //     var input = JSON.stringify(gameScoreMocks[0]);

  //     var expectedStatus = 200;
  //     var expectedContent = [gameScoreMock, gameScoreMock];

  //     var postResponse1 = httpMocks.createResponse();
  //     var postResponse2 = httpMocks.createResponse();
  //     var getResponse = httpMocks.createResponse();
  //     var postRequest1 = httpMocks.createRequest({
  //       method: 'POST',
  //       url: '/api/game_score',
  //     });
  //     postRequest1.pipe = genPipeMock(input);
  //     var postRequest2 = httpMocks.createRequest({
  //       method: "POST",
  //       url: '/api/game_score',
  //     });
  //     postRequest2.pipe = genPipeMock(input);
  //     var getRequest = httpMocks.createRequest({
  //       method: 'GET',
  //       url: '/api/game_score',
  //     });

  //     app.api(postRequest1, postResponse1)
  //       .then(app.api.bind(null, postRequest2, postResponse2))
  //       .then(app.api.bind(null, getRequest, getResponse))
  //       .then(function() {
  //         var data = getResponse._getData();
  //         getResponse.statusCode.should.equal(expectedStatus);
  //         JSON.parse(data).should.eql(expectedContent);
  //         done();
  //       }).catch(done);
  //   });
  // });
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
  { date: '2012-05-20T00:00:00.000Z',
    ground: 'マツダスタジアム',
    result: 'win',
    score: scoreMock, },
  { date: '2012-05-19T00:00:00.000Z',
    ground: 'マツダスタジアム',
    result: 'lose',
    score: scoreMock },
  { date: '2012-05-17T00:00:00.000Z',
    ground: '甲子園',
    result: 'win',
    score: scoreMock },
  { date: '2011-05-16T00:00:00.000Z',
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
    date: '2012-05-20T00:00:00.000Z',
    ground: 'マツダスタジアム',
    rbi: 2,
    run: 3,
    sb: 4,
    error: 5,
    atbats: atbatsMock },
  { playerId: 10,
    date: '2012-05-19T00:00:00.000Z',
    ground: '甲子園',
    rbi: 0,
    run: 0,
    sb: 0,
    error: 0,
    atbats: atbatsMock },
];

var pitchingMocks = [
  { playerId: 18,
    date: '2012-05-20T00:00:00.000Z',
    ground: 'マツダスタジアム',
    out: 27,
    run: 0,
    erun: 0,
    so: 18,
    bb: 0,
    hit: 0,
    error: 1 },
  { playerId: 19,
    date: '2012-05-19T00:00:00.000Z',
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

function genPipeMock(data) {
  return function(dist) {
    dist.write(data);
    dist.end();
    return dist;
  };
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
  for (var i = 0; i < numberOfScores; i++) {
    promises.push(new Promise(function(resolve, reject) {
      var j = i % gameScoreMocks.length;
      var score = new Model(gameScoreMocks[j]);
      score.save(function(err) {
        err ? reject(err) : resolve();
      });
    }));
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
  for (var i = 0; i < numberOfStats; i++) {
    promises.push(new Promise(function(resolve, reject) {
      var j = i % battingMocks.length;
      var stat = new Model(mocks[j]);
      stat.save(function(err) {
        err ? reject(err) :resolve();
      });
    }));
  }

  return Promise.all(promises);
}
