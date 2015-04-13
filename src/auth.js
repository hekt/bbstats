'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let AES = require('crypto-js/aes');
let enc = require('crypto-js').enc;

// my module
let config = require('./config');
let myutil = require('./util');
let promisize = myutil.promisize;
let db = require('./db');
let error = require('./error');


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

let Schema = db.Schema;

// Access Token
let accessTokenSchema = new Schema({
  token: {type: String, require: true}
});
let AccessTokenModel = db.model('AccessToken', accessTokenSchema);

// Shared Key
let commonKeySchema = new Schema({
  user: {type: String, require: true},
  key: {type: String, require: true},
});
let CommonKeyModel = db.model('CommonKey', commonKeySchema);

// ------------------------------------------------------------
// AccessToken
// ------------------------------------------------------------

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    if (!token) reject(new error.AuthorizationError('no token'));

    AccessTokenModel.findOne({token: token}, (err, doc) => {
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
  let dbToken = new AccessTokenModel({token: token});
  return myutil.promisize(dbToken.save, dbToken);
}


// ------------------------------------------------------------
// CommonKey
// ------------------------------------------------------------

function decryptCommonKey(user, body) {
  function decipher(doc) {
    return new Promise((resolve, reject) => {
      if (!doc) return reject(new error.AuthorizationError('unknown user'));
      try {
        let result = AES.decrypt(body, doc.key).toString(enc.Utf8);
        resolve(result);
      } catch (e) {
        if (e.message === 'Malformed UTF-8 data')
          reject(new error.AuthorizationError('invalid key'));
        else reject(e);
      }
    });
  }
  
  function verify(obj) {
    return new Promise((resolve, reject) => {
      let now = Date.now();
      let stamp = new Date(obj.timestamp);
      if (Math.abs(now - stamp) > 1000 * 60 * 5)
        reject(new error.AuthorizationError('expired'));
      if (!obj.nonce)
        reject(new error.AuthorizationError('nonce required'));
      resolve();
    });
  }

  if (!user || !body)
    return Promise.reject(new error.AuthorizationError('missing parameters'));
  
  let find = CommonKeyModel.findOne.bind(CommonKeyModel, {user: user});
  return promisize(find).then(decipher).then(JSON.parse).pierce(verify);
}

function registerCommonKey(user, key) {
  let keyModel = new CommonKeyModel({user: user, key: key});
  return promisize(keyModel.save, keyModel);
}


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = {
  AccessToken: AccessToken,
  CommonKey: CommonKey,
};
