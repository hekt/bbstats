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
    date: {type: Date, required: true},
    ground: {type: String, required: true},
    result: {type: String, required: true},
    score: {
      firstTeam: {
        name: {type: String, required: true},
        totalRuns: {type: Number, required: true},
        totalErrors: {type: Number, required: true},
        totalHits: {type: Number, required: true},
        runs: {type: [Number], required: true},
      },
      secondTeam: {
        name: {type: String, required: true},
        totalRuns: {type: Number, required: true},
        totalErrors: {type: Number, required: true},
        totalHits: {type: Number, required: true},
        runs: {type: [Number], required: true},
      },
  },
  });
  var GameScore = mongoose.model('GameScore', gameScoreSchema);

  var atbatSchema = new Schema({
    inning: {type: Number, require: true},
    runners: {
      first: {type: Boolean, require: true},
      second: {type: Boolean, require: true},
      third: {type: Boolean, require: true},
    },
    outCount: {type: Number, require: true},
    result: {type: String, require: true},
    resultKind: {type: String, require: true}
  }, {_id: false});
  var battingStatSchema = new Schema({
    playerId: {type: Number, require: true},
    date: {type: Date, require: true},
    ground: {type: String, require: true},
    rbi: {type: Number, require: true},
    run: {type: Number, require: true},
    sb: {type: Number, require: true},
    error: {type: Number, require: true},
    atbats: [atbatSchema]
  });
  var BattingStat = mongoose.model('BattingStats', battingStatSchema);
  
  var pitchingStatSchema = new Schema({
    playerId: {type: Number, require: true},
    date: {type: Date, require: true},
    ground: {type: String, require: true},
    out: {type: Number, require: true},
    run: {type: Number, require: true},
    erun: {type: Number, require: true},
    so: {type: Number, require: true},
    bb: {type: Number, require: true},
    hit: {type: Number, require: true},
    error: {type: Number, require: true}
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
