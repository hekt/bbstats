(function(global) {
  'use strict';

  // ------------------------------------------------------------
  // modules
  // ------------------------------------------------------------

  var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

  
  // ------------------------------------------------------------
  // Models
  // ------------------------------------------------------------

  var gameScoreSchema = new Schema({
    date: Date,
    ground: String,
    result: String,
    score: {
      firstTeam: {
        name: String,
        totalRuns: Number,
        totalErrors: Number,
        totalHits: Number,
        runs: [Number]
      },
      secondTeam: {
        name: String,
        totalRuns: Number,
        totalErrors: Number,
        totalHits: Number,
        runs: [Number]
      }
    }
  });
  var GameScore = mongoose.model('GameScore', gameScoreSchema);

  var atbatSchema = new Schema({
    inning: Number,
    runners: {
      first: Boolean,
      second: Boolean,
      third: Boolean
    },
    outCount: Number,
    result: String,
    resultKind: String
  }, {_id: false});
  var battingStatSchema = new Schema({
    playerId: Number,
    date: Date,
    ground: String,
    rbi: Number,
    run: Number,
    sb: Number,
    error: Number,
    atbats: [atbatSchema]
  });
  var BattingStat = mongoose.model('BattingStats', battingStatSchema);
  
  var pitchingStatSchema = new Schema({
    playerId: Number,
    date: Date,
    ground: String,
    out: Number,
    run: Number,
    erun: Number,
    so: Number,
    bb: Number,
    hit: Number,
    error: Number
  });
  var PitchingStat = mongoose.model("PitchingStats", pitchingStatSchema);


  // authorization ----------------------------------------------

  var nonceSchema = new Schema({
    nonce: String,
    uri: String,
    createAt: {type: Date, expires: 60*5, default: Date.now}
  });
  var NonceModel = mongoose.model('Nonce', nonceSchema);

  var userHashSchema = new Schema({
    user: String,
    hash: String,
  });
  var UserHashModel = mongoose.model('UserHash', userHashSchema);

  
  // ------------------------------------------------------------
  // Export
  // ------------------------------------------------------------

  module.exports = mongoose;

})((this || 0).self || global);
