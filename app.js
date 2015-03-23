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
    var rootingSet = {
      GET: {
        game_score: getGameScore,
        batting_stats: getBattingStats,
        pitching_stats: getPitchingStats,
      },
      DELETE: {},
      POST: {
        game_score: createGameScore,
        batting_stats: createBattingStats,
        pitching_stats: createPitchingStats,
      },
      PUT: {},
    };
    
    function runServer(port) {
      var server = http.createServer(function(req, res) {
        var parsed = url.parse(req.url, true);

        var requestHasBody = req.method === 'POST' || req.method === 'PUT';
        var getQuery = requestHasBody ?
              getRequestBodyAsync(req).then(JSON.parse) :
              Promise.resolve(parsed.query);

        var responseHasBody = req.method === 'GET';
        var status;
        var contentType;
        if (responseHasBody) {
          status = 200;
          contentType = {'content-type': 'application/json; charset=utf-8'};
        } else {
          status = 204;
        }

        var target = parsed.pathname.replace(/\/api\/([a-z_]+)/, '$1');
        var rooting = rootingSet[req.method][target];
        
        if (!rooting) {
          status = 404;
          rooting = Promise.reject(new Error('Not Found'));
        }

        getQuery.then(rooting).then(function(content) {
          res.writeHead(status, contentType);
          res.end(responseHasBody ? JSON.stringify(content) : null);
        }).catch(function(err) {
          status = status === 404 ? 404 : 500;
          console.error(err);
          res.writeHead(status, {'content-type': 'text/plain; charset=utf-8'});
          res.end(err.toString());
        });
      });
      server.listen(port);
      console.log('Running server on http://localhost:' + port + '/');
    }

    return {
      runServer: runServer
    };

    // GET --------------------------------------------------------

    function getGameScore(query) {
      var dbQuery = db.model('GameScore').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      
      return dbQuery.exec();
    }

    function getBattingStats(query) {
      var dbQuery = db.model('BattingStats').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      if (query.player) dbQuery = dbQuery.where('playerId', query.player);
      
      return dbQuery.exec();
    }

    function getPitchingStats(query) {
      var dbQuery = db.model('PitchingStats').find(null, '-_id -__v');
      dbQuery = setGeneralOptionsToDBQuery(dbQuery, query);
      if (query.player) dbQuery = dbQuery.where('playerId', query.player);

      return dbQuery.exec();
    }

    // POST -------------------------------------------------------

    function createGameScore(obj) {
      obj.date = new Date(obj.date);
      var Model = db.model('GameScore');
      var score = new Model(obj);
      return score.save();
    }

    function createStats(modelName, objs) {
      var Model = db.model(modelName);
      var promises = objs.map(function(obj) {
        obj.date = new Date(obj.date);
        var stat = new Model(obj);
        return Promise.resolve(stat.save());
      });

      return Promise.all(promises);
    }

    function createBattingStats(objs) {
      return createStats('BattingStat', objs);
    }

    function createPitchingStats(objs) {
      return createStats('PitchingStats', objs);
    }
    
    // Utils ------------------------------------------------------

    function setGeneralOptionsToDBQuery(dbq, q) {
      dbq = (q.order && q.order === 'asc') ?
        dbq.sort('date') : dbq.sort('-date');
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
    
    function getRequestBodyAsync(req) {
      return new Promise(function(resolve, reject) {
        req.pipe(bl(function(err, data) {
          err ? reject(err) : resolve(data.toString());
        }));
      });
    }
    
  })();


  // ------------------------------------------------------------
  // run main
  // ------------------------------------------------------------

  main();

})((this || 0).self || global);
