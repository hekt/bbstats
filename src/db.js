'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// my module
var config = require('./config');


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

var db = mongoose;


// ------------------------------------------------------------
// Models
// ------------------------------------------------------------

var gameScoreSchema = new Schema({
  date: {type: Date, required: true, unique: true},
  ground: {type: String, required: true},
  result: {type: String, required: true},
  score: {
    awayTeam: {
      teamName: {type: String, required: true},
      totalRuns: {type: Number, required: true},
      totalErrors: {type: Number, required: true},
      totalHits: {type: Number, required: true},
      runs: {type: [Number], required: true},
    },
    homeTeam: {
      teamName: {type: String, required: true},
      totalRuns: {type: Number, required: true},
      totalErrors: {type: Number, required: true},
      totalHits: {type: Number, required: true},
      runs: {type: [Number], required: true},
    },
  },
});
var GameScore = db.model('GameScore', gameScoreSchema);

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
  order: {type: Number, require: true},
  appearanceOrder: {type: Number, require: true},
  positions: [{type: String}],
  date: {type: Date, require: true},
  ground: {type: String, require: true},
  rbi: {type: Number, require: true},
  run: {type: Number, require: true},
  sb: {type: Number, require: true},
  error: {type: Number, require: true},
  atbats: [atbatSchema]
});
var BattingStat = db.model('BattingStats', battingStatSchema);

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
var PitchingStat = db.model("PitchingStats", pitchingStatSchema);

var teamMemberSchema = new Schema({
  playerId: {type: Number, require: true, unique: true},
  playerName: {type: String, require: true},
});
var TeamMember = db.model('TeamMember', teamMemberSchema);


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = db;
