'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let crypto = require('crypto');
let base64url = require('base64url');


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
  return this.then(val => {
    if (!func || typeof func !== 'function') return val;
    return Promise.resolve(func(val)).then(() => val);
  });
};

/*
 > Promise.resolve(1.2).pass(3.4).then(console.log);
 3.4
 > Promise.resolve('ignored').pass(console.log).then(console.log);
 undefined
 */
Promise.prototype.pass = function(arg) {
  return this.then(() => arg);
};

/*
 > Promise.resolve('ignored').pure(console.log);
 undefined
 */
Promise.prototype.pure = function(func) {
  return this.then(() => func());
};


// ------------------------------------------------------------
// myutil
// ------------------------------------------------------------

let myutil = {};

myutil.promisize = function(func, thisArg, opt_args) {
  let args = opt_args || [];
  return new Promise((resolve, reject) => {
    args.push((err, val) => {
      err ? reject(err) : resolve(val);
    });
    func.apply(thisArg, args);
  });
};

myutil.randomString = function(size) {
  let randoms = myutil.promisize(crypto.randomBytes.bind(crypto, size));
  return randoms.then(base64url);
};

myutil.sum = function(ns) {
  if (ns.length === 0) return 0;
  return ns.reduce((x, y) => x = y);
};

myutil.isValidDate = function(date) {
  return date && date instanceof Date && date.toString() !== 'Invalid Date';
};

myutil.isValidPlayerId = function(pid) {
  return pid && typeof pid === 'number' && pid >= 0 &&
    pid.toString() !== 'NaN' && pid.toString() !== 'Infinity';
};


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = myutil;
