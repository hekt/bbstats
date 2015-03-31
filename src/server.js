'use strict';

// =============================================================
// Modules
// =============================================================

var http = require('http');

// app modules
var app = require('./app');
var db = require('./db');
var config = require('./config');


// =============================================================
// Main
// =============================================================

if (!db.connection.readyState) db.connect(config.dbUri);

var server = http.createServer(function(res, req) {
  app.api(res, req);
});
server.listen(config.port);
console.log('Running server at localhost:' + config.port + '\n');
