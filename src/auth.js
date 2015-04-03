'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var AES = require('crypto-js/AES');
var enc = require('crypto-js').enc;

// polyfill
var Promise = require('es6-promise').Promise;

// my module
var config = require('./config');
var myutil = require('./util');
var promisize = myutil.promisize;
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

function CommonKey() {}

CommonKey.decrypt = decryptCommonKey;
CommonKey.register = registerCommonKey;

// ------------------------------------------------------------
// Database Models
// ------------------------------------------------------------

var Schema = db.Schema;

// Access Token
var accessTokenSchema = new Schema({
  token: {type: String, require: true}
});
var AccessTokenModel = db.model('AccessToken', accessTokenSchema);

// Shared Key
var commonKeySchema = new Schema({
  user: {type: String, require: true},
  key: {type: String, require: true},
});
var CommonKeyModel = db.model('CommonKey', commonKeySchema);

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
  return myutil.randomString(32).pierce(saveAccessToken);
}

function saveAccessToken(token) {
  var dbToken = new AccessTokenModel({token: token});
  return myutil.promisize(dbToken.save, dbToken);
}


// ------------------------------------------------------------
// CommonKey
// ------------------------------------------------------------

function decryptCommonKey(user, body) {
  function decipher(doc) {
    return new Promise(function(resolve, reject) {
      if (!doc) return reject(new error.AuthorizationError('unknown user'));
      try {
        var result = AES.decrypt(body, doc.key).toString(enc.Utf8);
        resolve(result);
      } catch (e) {
        if (e.message === 'Malformed UTF-8 data')
          reject(new error.AuthorizationError('invalid key'));
        else reject(e);
      }
    });
  }
  
  function verify(obj) {
    return new Promise(function(resolve, reject) {
      var now = Date.now();
      var stamp = new Date(obj.timestamp);
      if (Math.abs(now - stamp) > 1000 * 60 * 5)
        reject(new error.AuthorizationError('expired'));
      if (!obj.nonce)
        reject(new error.AuthorizationError('nonce required'));
      resolve();
    });
  }

  if (!user || !body)
    return Promise.reject(new error.AuthorizationError('missing parameters'));
  
  var find = CommonKeyModel.findOne.bind(CommonKeyModel, {user: user});
  return promisize(find).then(decipher).then(JSON.parse).pierce(verify);
}

function registerCommonKey(user, key) {
  var keyModel = new CommonKeyModel({user: user, key: key});
  return promisize(keyModel.save, keyModel);
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = {
  AccessToken: AccessToken,
  CommonKey: CommonKey,
};
