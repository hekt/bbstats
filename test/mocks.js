'use strict';

// ------------------------------------------------------------
// mocks
//------------------------------------------------------------

var mocks = {};

mocks.scoreMock = {
  date: new Date('2015-03-27'),
  ground: '札幌ドーム',
  result: 'win',
  awayTeam: {
    teamName: '東北楽天ゴールデンイーグルス',
    totalRuns: 2,
    totalHits: 7,
    totalErrors: 1,
    runs: [0,1,0,0,0,0,0,1,0],
  },
  homeTeam: {
    teamName: '北海道日本ハムファイターズ',
    totalRuns: 5,
    totalHits: 7,
    totalErrors: 0,
    runs: [0,0,0,0,3,0,0,2],
  }
};

var atbats = [
  { inning: 2,
    rbi: 0,
    runners: {first: false, second: false, third: false},
    outCount: 0,
    result: '一邪飛',
    resultKind: 'fo' },
  { inning: 5,
    rbi: 0,
    runners: {first: false, second: false, third: false},
    outCount: 0,
    result: '三振',
    resultKind: 'so' },
  { inning: 6,
    rbi: 0,
    runners: {first: true, second: false, third: false},
    outCount: 2,
    result: '三振',
    resultKind: 'so' },
  { inning: 8,
    rbi: 1,
    runners: {first: false, second: true, third: true},
    outCount: 1,
    result: '犠飛',
    resultKind: 'sf' },
];

mocks.battingMock = {
  playerId: 6,
  order: 4,
  appearanceOrder: 0,
  positions: ['一'],
  date: new Date('2015-03-27'),
  ground: '札幌ドーム',
  run: 0,
  sb: 0,
  error: 0,
  atbats: atbats
};

mocks.pitchingMock = {
  playerId: 11,
  date: new Date('2015-03-27'),
  ground: '札幌ドーム',
  out: 17,
  bf: 24,
  run: 1,
  erun: 1,
  so: 6,
  bb: 3,
  h: 3,
  hr: 0,
  error: 0,
  result: 'win'
};

mocks.membersDic = {
  // pitchers
  11: '大谷', 13: '石井', 14: '大塚', 15: 'メンドーサ', 16: '有原',
  17: '浦野', 18: '斎藤佑', 19: '増井', 20: 'クロッタ', 21: '武田久',
  22: '藤岡', 25: '宮西', 28: '新垣', 29: '木佐貫', 30: '鍵谷',
  32: '乾', 33: '矢貫', 34: '吉川', 35: '榎下', 36: '中村勝',
  38: '武田勝', 39: '高梨', 40: '金平', 42: 'ガラテ', 43: '白村',
  45: '増渕', 46: '瀬川', 47: '森内', 48: '谷元', 51: '石川直',
  53: '立田', 57: '屋宜', 58: '齊藤勝', 59: '河野', 63: '上沢',
  // catchers
  2: '大野', 10: '清水', 27: '中嶋', 54: '近藤', 56: '市川',
  60: '荒張', 66: '大嶋', 68: '石川亮', 69: '佐藤正',
  // infielders
  3: '田中', 4: '飯山', 5: 'レアード', 6: '中田', 8: '西川',
  9: '中島', 12: '松本', 23: '渡邉', 24: '森本', 61: '杉谷',
  62: '高濱', 65: '太田',
  // outfielders
  1: '陽', 7: 'ハーミッダ', 26: '浅間', 31: '岡', 37: '北',
  44: '鵜久森', 49: '石川慎', 50: '宇佐美', 52: '佐藤賢', 64: '谷口',
  67: '岸里',
};

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = mocks;
