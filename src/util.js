'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var Promise = require('es6-promise').Promise;


// ------------------------------------------------------------
// Extend
// ------------------------------------------------------------

/*
 > Promise.resolve(1.2).then(Math.ceil).then(console.log)
 2
 > Promise.resolve(1.2).pierce(Math.ceil).then(console.log)
 1.2
 > Promise.resolve('do it once').then(console.log).then(console.log)
 do it once
 undefined
 > Promise.resolve('do it twice').pierce(console.log).then(console.log)
 do it twice
 do it twice
 */
Promise.prototype.pierce = function(func) {
  return this.then(function(val) {
    if (!func || typeof func !== 'function') return val;
    return Promise.resolve(func(val)).then(function() {
      return val;
    });
  });
};

Promise.prototype.pass = function(arg) {
  return this.then(function() {
    return arg;
  });
};


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

/*
 receives function that returns promise object and returns new function. new 
 function calls received function with argument that received oneself then 
 passes argument to `then` method. ignores received function's return value.
*/
myutil.createThruPromise = function(func) {
  return function(arg) {
    return func(arg).then(function() { return arg; });
  };
};

myutil.substitute = function(arg) {
  return function() {
    return arg;
  };
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = myutil;
