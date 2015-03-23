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
        var query = req.method === 'POST' ?
              getRequestBodyAsync(req).then(JSON.parse) :
              Promise.resolve(parsed.query);
        var result;
        var status;

        switch (parsed.pathname) {
            // GET
          case '/api/GET/gameScore':
            result = query.then(getGameScore);
            break;
          case '/api/GET/battingStats':
            result = query.then(getBattingStats);
            break;
          case '/api/GET/pitchingStats':
            result = query.then(getPitchingStats);

            // POST
          case '/api/POST/saveGameScore':
            result = query.then(saveGameScore);
            break;
          case '/api/POST/saveBattingStats':
            result = query.then(saveBattingStats);
            break;
          case '/api/POST/savePitchingStats':
            result = query.then(savePitchingStats);
            break;

            // not found
          default:
            status = 404;
            result = Promise.reject(new Error('Not found'));
        }

        result.then(function(content) {
          res.writeHead(200, {'content-type':
                              'application/json; charset=utf-8'});
          res.end(JSON.stringify(content));
        }).catch(function(err) {
          console.error(err);
          res.writeHead(status || 500, {'content-type':
                                        'text/plain; charset=utf-8'});
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

    function saveGameScore(obj) {
      obj.date = new Date(obj.date);
      var Model = db.model('GameScore');
      var score = new Model(obj);
      return score.save();
    }

    function saveStats(modelName, objs) {
      var Model = db.model(modelName);
      var promises = objs.map(function(obj) {
        obj.date = new Date(obj.date);
        var stat = new Model(obj);
        return Promise.resolve(stat.save());
      });

      return Promise.all(promises);
    }

    function saveBattingStats(objs) {
      return saveStats('BattingStat', objs);
    }

    function savePitchingStats(objs) {
      return saveStats('PitchingStats', objs);
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
