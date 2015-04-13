'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

// my module
var db = require('../src/db');


// ------------------------------------------------------------
// init
// ------------------------------------------------------------

function init(uri, models) {
  before(done => {
    db.connect(uri, err => {
      if (err) throw err;
      removeAll(models).pure(done);
    });
  });

  after(done => {
    db.disconnect(done);
  });

  afterEach(done => {
    removeAll(models).pure(done);
  });
};

function removeAll(models) {
  var promises = models.map(model => {
    return new Promise((resolve, reject) => {
      var Model = db.model(model);
      Model.remove(err => {
        err ? reject(err) : resolve();
      });
    });
  });
  return Promise.all(promises);
}

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = init;
