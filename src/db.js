'use strict';

// ------------------------------------------------------------
// Modules
// ------------------------------------------------------------

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// my module
let config = require('./config');


// ------------------------------------------------------------
// Initialize
// ------------------------------------------------------------

let db = mongoose;


// ------------------------------------------------------------
// Models
// ------------------------------------------------------------

let gameScoreSchema = new Schema({
  date: {type: Date, required: true, unique: true},
  ground: {type: String, required: true},
  result: {type: String, required: true},
  awayTeam: {
    type: {
      teamName: {type: String, required: true},
      totalRuns: {type: Number, required: true},
      totalErrors: {type: Number, required: true},
      totalHits: {type: Number, required: true},
      runs: {type: [Number], required: true},
    },
    required: true,
  },
  homeTeam: {
    type: {
      teamName: {type: String, required: true},
      totalRuns: {type: Number, required: true},
      totalErrors: {type: Number, required: true},
      totalHits: {type: Number, required: true},
      runs: {type: [Number], required: true},
    },
    required: true,
  },
});
let GameScore = db.model('GameScore', gameScoreSchema);

let atbatSchema = new Schema({
  inning: {type: Number, require: true},
  rbi: {type: Number, require: true},
  runners: {
    first: {type: Boolean, require: true},
    second: {type: Boolean, require: true},
    third: {type: Boolean, require: true},
  },
  outCount: {type: Number, require: true},
  result: {type: String, require: true},
  resultKind: {type: String, require: true}
}, {_id: false});
let battingStatSchema = new Schema({
  playerId: {type: Number, require: true},
  playerName: {type: String, require: true},
  order: {type: Number, require: true},
  appearanceOrder: {type: Number, require: true},
  positions: [{type: String}],
  date: {type: Date, require: true},
  ground: {type: String, require: true},
  run: {type: Number, require: true},
  sb: {type: Number, require: true},
  error: {type: Number, require: true},
  atbats: [atbatSchema]
});
let BattingStat = db.model('BattingStats', battingStatSchema);

let pitchingStatSchema = new Schema({
  playerId: {type: Number, require: true},
  playerName: {type: String, require: true},
  order: {type: Number, require: true},
  date: {type: Date, require: true},
  ground: {type: String, require: true},
  out: {type: Number, require: true},
  bf: {type: Number, require: true},
  run: {type: Number, require: true},
  erun: {type: Number, require: true},
  so: {type: Number, require: true},
  bb: {type: Number, require: true},
  h: {type: Number, require: true},
  hr: {type: Number, require: true},
  error: {type: Number, require: true},
  result: {type: String, require: true},
});
let PitchingStat = db.model("PitchingStats", pitchingStatSchema);

let teamMemberSchema = new Schema({
  playerId: {type: Number, require: true, unique: true},
  playerName: {type: String, require: true},
});
let TeamMember = db.model('TeamMember', teamMemberSchema);


// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = db;
