(function(global) {
  'use strict';

  // ------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------

  var PORT = 52002;
  var DB_URL = 'mongodb://localhost/bbstats-test';
  
  // ------------------------------------------------------------
  // Modules
  // ------------------------------------------------------------

  // core
  var http = require('http');
  var url = require('url');

  // third party
  var bl = require('bl');

  // polyfill
  var Promise = require('es6-promise').Promise;

  // my module
  var db = require('./db');


  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------

  function main() {
    db.connect(DB_URL);
    Server.runServer(PORT);
  }
  

  // ------------------------------------------------------------
  // Server
  // ------------------------------------------------------------

  var Server = (function() {
    function runServer(port) {
      var server = http.createServer(function(req, res) {
        var parsed = url.parse(req.url, true);
        var result;

        if (req.method === 'POST') {
          result = post(req, res);
        } else {
          result = get(req, res);
        }
        result = result || Promise.reject(new Error('not found'));

        result.then(function(content) {
          res.writeHead(200, {'content-type':
                              'application/json; charset=utf-8'});
          res.end(JSON.stringify(content));
        }).catch(function(err) {
          res.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
          res.end(err);
        });
      });
      server.listen(port);
      console.log('Running server on http://localhost:' + port + '/');
    }

    return {
      runServer: runServer
    };

    // Utils ------------------------------------------------------

    function setGeneralOptionsToDBQuery(dbq, q) {
      if (q.order && q.order === 'asc') dbq = dbq.sort('date');
      else dbq = dbq.sort('-date');
      if (q.limit) dbq = dbq.limit(Number(q.limit));
      if (q.offset) dbq = dbq.skip(Number(q.offset));
      if (q.date) dbq = dbq.where('date', new Date(q.date));
      if (q.year) {
        dbq = dbq.gte('date', new Date(q.year));
        dbq = dbq.lte('date', new Date(q.year + '-12-31'));
      }
      if (q.ground) dbq = dbq.where('ground', q.ground);

      return dbq;
    }
    
    // GET --------------------------------------------------------

    function get(req, res) {
      var parsed = url.parse(req.url, true);
      var result;
      
      switch (parsed.pathname) {
        case '/api/GET/gameScore':
          result = getGameScore(parsed.query);
          break;
        case '/api/GET/battingStats':
          result = getBattingStats(parsed.query);
          break;
        case '/api/GET/pitchingStats':
          result = getPitchingStats(parsed.query);
          break;
        default:
          result = null;
      }

      return result;
    }

    function getGameScore(query) {
      var dbQuery = db.model('GameScore').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      
      return Promise.resolve(dbQuery.exec());
    }

    function getBattingStats(query) {
      var dbQuery = db.model('BattingStats').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      if (query.player) dbQuery = dbQuery.where('playerId', query.player);
      
      return Promise.resolve(dbQuery.exec());
    }

    function getPitchingStats(query) {
      var dbQuery = db.model('PitchingStats').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      if (query.player) dbQuery = dbQuery.where('playerId', query.player);

      return Promise.resolve(dbQuery.exec());
    }

    // POST -------------------------------------------------------

    function post(req, res) {
      var parsed = url.parse(req.url, true);
      var reqBody = getRequestBodyAsync(req);
      var result;

      switch (parsed.pathname) {
        case '/api/POST/saveGameScore':
          result= reqBody.then(saveGameScore);
          break;
        case '/api/POST/saveBattingStats':
          result = reqBody.then(saveBattingStats);
          break;
        case '/api/POST/savePitchingStats':
          result = reqBody.then(savePitchingStats);
          break;
        default:
          result = null;
      }

      return result;
    }

    function getRequestBodyAsync(req) {
      return new Promise(function(resolve, reject) {
        req.pipe(bl(function(err, data) {
          err ? reject(err) : resolve(data.toString());
        }));
      });
    }
    
    function saveGameScore(query) {
      var obj = JSON.parse(query);
      obj.date = new Date(obj.date);
      var Model = db.model('GameScore');
      var score = new Model(obj);
      
      return Promise.resolve(score.save());
    }

    function saveStats(modelName, query) {
      var objs = JSON.parse(query);
      var Model = db.model(modelName);
      var promises = objs.map(function(obj) {
        obj.date = new Date(obj.date);
        var stat = new Model(obj);
        return Promise.resolve(stat.save());
      });

      return Promise.all(promises);
    }

    function saveBattingStats(query) {
      return saveStats('BattingStat', query);
    }

    function savePitchingStats(query) {
      return saveStats('PitchingStats', query);
    }
    
  })();


  // ------------------------------------------------------------
  // run main
  // ------------------------------------------------------------

  main();

})((this || 0).self || global);
