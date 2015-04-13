'use strict';

// =============================================================
// Modules
// =============================================================

let http = require('http');

// app modules
let app = require('./app');
let db = require('./db');
let config = require('./config');


// =============================================================
// Main
// =============================================================

if (!db.connection.readyState) db.connect(config.dbUri);

let server = http.createServer((res, req) => {
  app.api(res, req);
});
server.listen(config.port);
console.log('Running server at localhost:' + config.port + '\n');
