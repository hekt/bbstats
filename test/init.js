'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

// polyfill
var Promise = require('es6-promise').Promise;

// my module
var db = require('../src/db');


// ------------------------------------------------------------
// init
// ------------------------------------------------------------

function init(uri, models) {
  before(function(done) {
    db.connect(uri, function() {
      removeAll(models).pure(done);
    });
  });

  after(function(done) {
    db.disconnect(done);
  });

  afterEach(function(done) {
    removeAll(models).pure(done);
  });
};

function removeAll(models) {
  var promises = models.map(function(model) {
    return new Promise(function(resolve, reject) {
      var Model = db.model(model);
      Model.remove(function(err) {
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
