'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var crypto = require('crypto');
var base64url = require('base64url');

// polyfill
var Promise = require('es6-promise').Promise;

// my module
var config = require('./config');
var myutil = require('./util');
var db = require('./db');
var error = require('./error');


// ------------------------------------------------------------
// Header
// ------------------------------------------------------------

function AccessToken() {}

// AccessToken.verify(token:String): Promise ()
AccessToken.verify = verifyAccessToken;
// AccessToken.issue(): Promise String
AccessToken.issue = issueAccessToken;


// ------------------------------------------------------------
// Database Models
// ------------------------------------------------------------

var Schema = db.Schema;

// Access Token

var accessTokenSchema = new Schema({
  token: {type: String, require: true}
});
var AccessTokenModel = db.model('AccessToken', accessTokenSchema);


// ------------------------------------------------------------
// AccessToken
// ------------------------------------------------------------

function verifyAccessToken(token) {
  return new Promise(function(resolve, reject) {
    if (!token) reject(new error.AuthorizationError('no token'));

    AccessTokenModel.findOne({token: token}, function(err, doc) {
      if (err) reject(err);
      if (!doc) reject(new error.AuthorizationError('invalid token'));
      resolve();
    });
  });
}

function issueAccessToken() {
  return randomString().pierce(saveAccessToken);
  // var saveTokenThru = myutil.createThruPromise(saveAccessToken);
  // return randomString().then(saveTokenThru);
}

function saveAccessToken(token) {
  var dbToken = new AccessTokenModel({token: token});
  return myutil.promisize(dbToken.save, dbToken);
}


// ------------------------------------------------------------
// Utils
// ------------------------------------------------------------

function randomString() {
  var randoms = myutil.promisize(crypto.randomBytes.bind(crypto, 32));
  return randoms.then(base64url);
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = {
  AccessToken: AccessToken,
};
