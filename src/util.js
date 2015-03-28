'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var crypto = require('crypto');
var base64url = require('base64url');

// polyfills
var Promise = require('es6-promise').Promise;


// ------------------------------------------------------------
// Extend
// ------------------------------------------------------------

/*
 > Promise.resolve(1.2).then(Math.ceil).then(console.log);
 2
 > Promise.resolve(1.2).pierce(Math.ceil).then(console.log);
 1.2
 > Promise.resolve('do it once').then(console.log).then(console.log);
 do it once
 undefined
 > Promise.resolve('do it twice').pierce(console.log).then(console.log);
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

/*
 > Promise.resolve(1.2).pass(3.4).then(console.log);
 3.4
 > Promise.resolve('ignored').pass(console.log).then(console.log);
 undefined
 */
Promise.prototype.pass = function(arg) {
  return this.then(function() {
    return arg;
  });
};

/*
 > Promise.resolve('ignored').pure(console.log);
 undefined
 */
Promise.prototype.pure = function(func) {
  return this.then(function() {
    return func();
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

myutil.randomString = function(size) {
  var randoms = myutil.promisize(crypto.randomBytes.bind(crypto, size));
  return randoms.then(base64url);
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = myutil;
