(function(global) {
  'use strict';

  // ------------------------------------------------------------
  // Modules
  // ------------------------------------------------------------

  var Promise = require('es6-promise').Promise;
  var db = require('../src/db');


  // ------------------------------------------------------------
  // Implementation
  // ------------------------------------------------------------

  function init(uri, models) {
    before(function(done) {
      db.connect(uri, function() {
        removeAll(models).then(function() {
          done();
        });
      });
    });

    after(function(done) {
      db.disconnect(done);
    });

    afterEach(function(done) {
      removeAll(models).then(function() {
        done();
      });
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
  

})((this || 0).self || global);
