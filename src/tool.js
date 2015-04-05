'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var Promise = require('es6-promise').Promise;

var db = require('./db');
var config = require('./config');
var promisize = require('./util').promisize;


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

if (db.connection.readyState === 0) {
  db.connect(config.dbUri);
}


// ------------------------------------------------------------
// tool
// ------------------------------------------------------------

var tool = {};

tool.registerMembers = function(members) {
  var Model = db.model('TeamMember');
  var promises = [];
  for (var pid in members) {
    var member = new Model({
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
