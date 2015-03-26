'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var Promise = require('es6-promise').Promise;


// ------------------------------------------------------------
// myutil
// ------------------------------------------------------------

var myutil = {};

myutil.promisize = function(func, thisArg, opt_args) {
  var args = opt_args || [];
  return new Promise(function(resolve, reject) {
    args.push(function(err, val) {
      err ? reject(err) : resolve(val);
    });
    func.apply(thisArg, args);
  });
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = myutil;
