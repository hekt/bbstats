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
  playerName: '中田',
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
  playerName: '大谷',
  order: 1,
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

mocks.dumped = '{"date":"2015-03-27","ground":"札幌ドーム","gameScore":{"homeTeam":{"teamName":"北海道日本ハムファイターズ","totalRuns":5,"totalHits":7,"totalErrors":0,"runs":[0,0,0,0,3,0,0,2,-1]},"awayTeam":{"teamName":"東北楽天ゴールデンイーグルス","totalRuns":2,"totalHits":7,"totalErrors":1,"runs":[0,1,0,0,0,0,0,1,0]},"result":"win"},"battingStats":[{"order":1,"positions":"左","playerName":"西川","playerId":8,"run":1,"sb":0,"error":0,"atbats":[{"inning":1,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"左邪飛","resultKind":"fo"},{"inning":4,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"中飛","resultKind":"fo"},{"inning":6,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"中飛","resultKind":"fo"},{"inning":8,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"四球","resultKind":"bb"}]},{"order":2,"positions":"二","playerName":"田中","playerId":3,"run":1,"sb":0,"error":0,"atbats":[{"inning":1,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"中飛","resultKind":"fo"},{"inning":4,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"遊ゴ","resultKind":"go"},{"inning":6,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"三振","resultKind":"so"},{"inning":8,"rbi":"0","runners":{"first":true,"second":false,"third":false},"outCount":0,"result":"四球","resultKind":"bb"}]},{"order":3,"positions":"中","playerName":"陽","playerId":1,"run":0,"sb":1,"error":0,"atbats":[{"inning":1,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"三振","resultKind":"so"},{"inning":4,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"三振","resultKind":"so"},{"inning":6,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"中安","resultKind":"h"},{"inning":8,"rbi":"0","runners":{"first":true,"second":true,"third":false},"outCount":0,"result":"投犠","resultKind":"sh"}]},{"order":4,"positions":"一","playerName":"中田","playerId":6,"run":0,"sb":0,"error":0,"atbats":[{"inning":2,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"一邪飛","resultKind":"fo"},{"inning":5,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"},{"inning":6,"rbi":"0","runners":{"first":true,"second":false,"third":false},"outCount":2,"result":"三振","resultKind":"so"},{"inning":8,"rbi":"1","runners":{"first":false,"second":true,"third":true},"outCount":1,"result":"右犠飛","resultKind":"sf"}]},{"order":5,"positions":"右","playerName":"ハーミッダ","playerId":7,"run":1,"sb":0,"error":0,"atbats":[{"inning":2,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"左飛","resultKind":"fo"},{"inning":5,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"右安","resultKind":"h"},{"inning":7,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"},{"inning":8,"rbi":"0","runners":{"first":false,"second":true,"third":false},"outCount":2,"result":"右安","resultKind":"h"}]},{"order":5,"positions":"走右","playerName":"岡","playerId":31,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":0,"rbi":"","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"","resultKind":""}]},{"order":6,"positions":"三","playerName":"レアード","playerId":5,"run":1,"sb":0,"error":0,"atbats":[{"inning":2,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"三振","resultKind":"so"},{"inning":5,"rbi":"0","runners":{"first":true,"second":false,"third":false},"outCount":1,"result":"中安","resultKind":"h"},{"inning":7,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"中2","resultKind":"dbl"},{"inning":8,"rbi":"1","runners":{"first":true,"second":false,"third":true},"outCount":2,"result":"左安","resultKind":"h"}]},{"order":7,"positions":"捕","playerName":"近藤","playerId":54,"run":1,"sb":0,"error":0,"atbats":[{"inning":3,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"},{"inning":5,"rbi":"0","runners":{"first":true,"second":true,"third":false},"outCount":1,"result":"中安","resultKind":"h"},{"inning":7,"rbi":"0","runners":{"first":false,"second":true,"third":false},"outCount":1,"result":"四球","resultKind":"bb"},{"inning":8,"rbi":"0","runners":{"first":true,"second":true,"third":false},"outCount":2,"result":"三振","resultKind":"so"}]},{"order":8,"positions":"指","playerName":"谷口","playerId":64,"run":0,"sb":0,"error":0,"atbats":[{"inning":3,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"一直","resultKind":"fo"},{"inning":5,"rbi":"1","runners":{"first":false,"second":false,"third":true},"outCount":1,"result":"右犠飛","resultKind":"sf"},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":8,"positions":"打指","playerName":"石川慎","playerId":49,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":7,"rbi":"0","runners":{"first":true,"second":true,"third":false},"outCount":1,"result":"捕ゴ","resultKind":"go"},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":9,"positions":"遊","playerName":"中島卓","playerId":9,"run":0,"sb":0,"error":0,"atbats":[{"inning":3,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"三ゴ","resultKind":"go"},{"inning":5,"rbi":"0","runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"左飛","resultKind":"fo"},{"inning":7,"rbi":"0","runners":{"first":true,"second":true,"third":false},"outCount":2,"result":"遊ゴ","resultKind":"go"},{"inning":null,"rbi":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]}],"pitchingStats":[{"order":1,"playerName":"大谷","playerId":11,"out":17,"bf":"24","run":1,"erun":1,"so":6,"bb":3,"h":3,"hr":0,"error":0,"result":"win"},{"order":2,"playerName":"谷元","playerId":48,"out":1,"bf":"1","run":0,"erun":0,"so":0,"bb":0,"h":0,"hr":0,"error":0,"result":null},{"order":3,"playerName":"宮西","playerId":25,"out":3,"bf":"3","run":0,"erun":0,"so":0,"bb":0,"h":0,"hr":0,"error":0,"result":null},{"order":4,"playerName":"クロッタ","playerId":20,"out":1,"bf":"4","run":1,"erun":1,"so":1,"bb":0,"h":3,"hr":1,"error":0,"result":null},{"order":5,"playerName":"鍵谷","playerId":30,"out":2,"bf":"2","run":0,"erun":0,"so":1,"bb":0,"h":0,"hr":0,"error":0,"result":null},{"order":6,"playerName":"増井","playerId":19,"out":3,"bf":"4","run":0,"erun":0,"so":1,"bb":0,"h":1,"hr":0,"error":0,"result":"save"}]}';

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------

module.exports = mocks;
