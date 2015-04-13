'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let Promise = require('es6-promise').Promise;

let db = require('./db');
let config = require('./config');
let promisize = require('./util').promisize;


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

if (db.connection.readyState === 0) {
  db.connect(config.dbUri);
}


// ------------------------------------------------------------
// tool
// ------------------------------------------------------------

let tool = {};

tool.registerMembers = function(members) {
  let Model = db.model('TeamMember');
  let promises = [];
  for (let pid in members) {
    let member = new Model({
      playerId: pid,
      playerName: members[pid],
    });
    promises.push(promisize(member.save, member));
  }
  return Promise.all(promises);
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = tool;
