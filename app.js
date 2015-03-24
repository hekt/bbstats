(function(global) {
  'use strict';

  // ------------------------------------------------------------
  // Constants
  // ------------------------------------------------------------

  var PORT = 52002;
  var DB_URI = 'mongodb://localhost/bbstats-test';
  
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
  var error = require('./error.js');


  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------

  function main() {
    db.connect(DB_URI);
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

        var authRequired = req.method !== 'GET';
        var authorize = authRequired ?
              authorization.bind(null, req.headers.authorization) :
              Promise.resolve.bind(Promise);

        var requestHasBody = req.method === 'POST' || req.method === 'PUT';
        var getQuery = requestHasBody ?
              getRequestBodyAsJsonAsync.bind(null, req) :
              Promise.resolve.bind(Promise, parsed.query);

        var target = parsed.pathname.replace(/\/api\/([a-z_]+)/, '$1');
        var rooting = rootingSet[req.method][target] ||
              Promise.reject.bind(Promise, new error.NotFoundError());
        
        var response = function(content) {
          var responseHasBody = req.method === 'GET';
          var statusCode;
          var header;
          var body;
          if (responseHasBody) {
            statusCode = 200;
            header = {'content-type': 'application/json; charset=utf-8'};
            body = JSON.stringify(content);
          } else {
            statusCode = 204;
          }

          res.writeHead(statusCode, header);
          res.end(body);
          console.log('success');
        };

        var errorResponse = function(err) {
          var statusCode = err.statusCode || 500;
          var header = {'content-type': 'text/plain; charset=utf-8'};
          if (err.statusCode === 401)
            header['WWW-Authenticate'] = 'Basic realm="secret"';

          res.writeHead(statusCode, header);
          res.end(err.toString());
          console.error(err);
        };

        authorize().then(getQuery).then(rooting)
          .then(response).catch(errorResponse);
        
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

    function authorization(authHeader) {
      return new Promise(function(resolve, reject) {
        var err = new error.AuthorizationError();
        if (!authHeader) reject(err);

        var auth = parseAuthorizationHeader(authHeader);
        if (auth.scheme !== 'Basic') reject(err);
        if (!auth.param) reject(err);

        resolve();
      });
    }

    function parseAuthorizationHeader(header) {
      var splited = header.split(' ');
      return {
        scheme: splited[0],
        param: splited[1],
      };
    }

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

    function getRequestBodyAsJsonAsync(req) {
      return getRequestBodyAsync(req).then(JSON.parse);
    }
    
  })();


  // ------------------------------------------------------------
  // run main
  // ------------------------------------------------------------

  main();

})((this || 0).self || global);
