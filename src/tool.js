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

tool.addPlayerName = function() {
  let Model = db.model('TeamMember');
  let dbQuery = Model.find();
  return promisize(dbQuery.exec, dbQuery).then(docs => {
    let dic = {};
    docs.forEach(function(doc) {
      dic[doc.playerId] = doc.playerName;
    });
    let promises = [
      addPlayerNameInternal(dic, 'BattingStats'),
      addPlayerNameInternal(dic, 'PitchingStats'),
    ];
    return Promise.all(promises);
  }).then(() => {
    console.log('complete');
  }).catch(err => {
    console.error(err, err.stack);
  });
};

function addPlayerNameInternal(nameDic, modelName) {
  let Model = db.model(modelName);
  let dbQuery = Model.find();
  return promisize(dbQuery.exec, dbQuery).then(function(docs) {
    let promises = [];
    docs.forEach(function(doc) {
      doc.playerName = nameDic[doc.playerId];
      let promise = new Promise((resolve, reject) => {
        doc.save((err) => { err ? reject(err) : resolve(); });
      });
      promises.push(promise);
    });
    return Promise.all(promises);
  });
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = tool;
