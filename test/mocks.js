'use strict';

// ------------------------------------------------------------
// mocks
//------------------------------------------------------------

var mocks = {};

var scoreMock = {
  awayTeam: {
    teamName: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  homeTeam: {
    teamName: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
};
mocks.gameScoreList = [
  { date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    result: 'win',
  awayTeam: {
    teamName: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  homeTeam: {
    teamName: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
  },
  { date: new Date('2012-05-19T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    result: 'lose',
  awayTeam: {
    teamName: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  homeTeam: {
    teamName: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
  },
  { date: new Date('2012-05-17T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
  awayTeam: {
    teamName: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  homeTeam: {
    teamName: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
  },
  { date: new Date('2011-05-16T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
  awayTeam: {
    teamName: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  homeTeam: {
    teamName: '広島',
    totalRuns: 4,
    totalErrors: 4,
    totalHits: 8,
    runs: [0, 0, 1, 0, 0, 0, 0, 3, 0]
  }
  },
];

var atbatsMock = [{
  inning: 1,
  runners: {first: true, second: false, third: true},
  outCount: 2,
  result: 'ヒット',
  resultKind: 'h'
}];
mocks.battingStatsList = [
  { playerId: 1,
    date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    rbi: 2,
    run: 3,
    sb: 4,
    error: 5,
    atbats: atbatsMock },
  { playerId: 10,
    date: new Date('2012-05-19T00:00:00.000Z'),
    ground: '甲子園',
    rbi: 0,
    run: 0,
    sb: 0,
    error: 0,
    atbats: atbatsMock },
];

mocks.pitchingStatsList = [
  { playerId: 18,
    date: new Date('2012-05-20T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    out: 27,
    run: 0,
    erun: 0,
    so: 18,
    bb: 0,
    hit: 0,
    error: 1 },
  { playerId: 19,
    date: new Date('2012-05-19T00:00:00.000Z'),
    ground: '甲子園',
    out: 3,
    run: 4,
    erun: 0,
    so: 1,
    bb: 2,
    hit: 5,
    error: 0 },
];

mocks.allData = {
  score: mocks.gameScoreList[0],
  batting: mocks.battingStatsList,
  pitching: mocks.pitchingStatsList,
};


// ------------------------------------------------------------
// 2015-03-15
// ------------------------------------------------------------

var json20150315 = '{"date":"2015-03-15","ground":"西武プリンス","gameScore":{"homeTeam":{"teamName":"埼玉西武ライオンズ","totalRuns":3,"totalHits":3,"totalErrors":0,"runs":[0,0,0,0,0,1,0,0,2]},"awayTeam":{"teamName":"北海道日本ハムファイターズ","totalRuns":7,"totalHits":13,"totalErrors":2,"runs":[1,0,0,0,1,4,1,0,0]}},"battingStats":[{"order":1,"positions":"左三一","name":"西川","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":1,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"右安","resultKind":"h"},{"inning":2,"runners":{"first":true,"second":true,"third":false},"outCount":2,"result":"二ゴ","resultKind":"go"},{"inning":5,"runners":{"first":true,"second":false,"third":false},"outCount":0,"result":"投安","resultKind":"h"},{"inning":6,"runners":{"first":true,"second":true,"third":false},"outCount":2,"result":"四球","resultKind":"bb"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"四球","resultKind":"bb"}]},{"order":2,"positions":"二","name":"田中","rbi":1,"run":2,"sb":0,"error":0,"atbats":[{"inning":1,"runners":{"first":true,"second":false,"third":false},"outCount":0,"result":"犠打","resultKind":"sh"},{"inning":3,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"},{"inning":5,"runners":{"first":true,"second":true,"third":false},"outCount":0,"result":"四球","resultKind":"bb"},{"inning":6,"runners":{"first":true,"second":true,"third":true},"outCount":2,"result":"左安","resultKind":"h"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"二ゴ","resultKind":"go"}]},{"order":3,"positions":"中","name":"陽","rbi":2,"run":0,"sb":0,"error":0,"atbats":[{"inning":1,"runners":{"first":false,"second":true,"third":false},"outCount":1,"result":"二ゴ","resultKind":"go"},{"inning":3,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"中安","resultKind":"h"},{"inning":5,"runners":{"first":true,"second":true,"third":true},"outCount":0,"result":"三振","resultKind":"so"},{"inning":6,"runners":{"first":true,"second":false,"third":true},"outCount":2,"result":"左中2","resultKind":"h"},{"inning":8,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"中安","resultKind":"h"}]},{"order":3,"positions":"走左","name":"杉谷","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":4,"positions":"一","name":"中田","rbi":2,"run":0,"sb":0,"error":0,"atbats":[{"inning":1,"runners":{"first":false,"second":false,"third":true},"outCount":2,"result":"左2","resultKind":"h"},{"inning":3,"runners":{"first":true,"second":false,"third":false},"outCount":1,"result":"遊飛","resultKind":"fo"},{"inning":5,"runners":{"first":true,"second":true,"third":true},"outCount":1,"result":"死球","resultKind":"bb"},{"inning":6,"runners":{"first":false,"second":true,"third":false},"outCount":2,"result":"三振","resultKind":"so"},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":4,"positions":"左中","name":"谷口","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":8,"runners":{"first":true,"second":false,"third":false},"outCount":0,"result":"投ゴ","resultKind":"go"}]},{"order":5,"positions":"指","name":"大谷","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":1,"runners":{"first":false,"second":true,"third":false},"outCount":2,"result":"三飛","resultKind":"fo"},{"inning":3,"runners":{"first":true,"second":false,"third":false},"outCount":2,"result":"一ゴ","resultKind":"go"},{"inning":5,"runners":{"first":true,"second":true,"third":true},"outCount":1,"result":"一ゴ併","resultKind":"dp"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"左飛","resultKind":"fo"},{"inning":8,"runners":{"first":true,"second":false,"third":false},"outCount":1,"result":"二ゴ","resultKind":"go"}]},{"order":6,"positions":"右","name":"ハーミッダ","rbi":1,"run":0,"sb":0,"error":0,"atbats":[{"inning":2,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"左安","resultKind":"h"},{"inning":4,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"一ゴ","resultKind":"go"},{"inning":6,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"左本","resultKind":"hr"},{"inning":8,"runners":{"first":true,"second":false,"third":false},"outCount":2,"result":"右飛","resultKind":"fo"}]},{"order":6,"positions":"右","name":"岡","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":7,"positions":"三一","name":"レアード","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":2,"runners":{"first":true,"second":false,"third":false},"outCount":0,"result":"右安","resultKind":"h"},{"inning":4,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"投直","resultKind":"fo"},{"inning":6,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"三振","resultKind":"so"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"三振","resultKind":"so"},{"inning":9,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"三振","resultKind":"so"}]},{"order":7,"positions":"三","name":"飯山","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":8,"positions":"捕","name":"石川亮","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":2,"runners":{"first":true,"second":true,"third":false},"outCount":0,"result":"二飛","resultKind":"fo"},{"inning":4,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"左2","resultKind":"h"},{"inning":6,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"中安","resultKind":"h"},{"inning":7,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"四球","resultKind":"hbp"},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null}]},{"order":8,"positions":"捕","name":"近藤","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":null,"runners":{"first":false,"second":false,"third":false},"outCount":null,"result":null,"resultKind":null},{"inning":9,"runners":{"first":false,"second":false,"third":false},"outCount":1,"result":"三振","resultKind":"so"}]},{"order":9,"positions":"遊","name":"中島卓","rbi":0,"run":0,"sb":0,"error":0,"atbats":[{"inning":2,"runners":{"first":true,"second":true,"third":false},"outCount":1,"result":"一ゴ","resultKind":"go"},{"inning":5,"runners":{"first":false,"second":false,"third":false},"outCount":0,"result":"一安","resultKind":"h"},{"inning":6,"runners":{"first":true,"second":false,"third":false},"outCount":2,"result":"四球","resultKind":"bb"},{"inning":7,"runners":{"first":true,"second":false,"third":false},"outCount":2,"result":"四球","resultKind":"bb"},{"inning":9,"runners":{"first":false,"second":false,"third":false},"outCount":2,"result":"二ゴ","resultKind":"go"}]}],"pitchingStats":[{"order":1,"player":null,"out":21,"run":1,"erun":0,"so":6,"bb":0,"hit":1,"error":1,"name":"メンドーサ"},{"order":2,"player":null,"out":3,"run":0,"erun":0,"so":1,"bb":0,"hit":0,"error":0,"name":"クロッタ"},{"order":2,"player":null,"out":3,"run":2,"erun":0,"so":1,"bb":0,"hit":2,"error":1,"name":"増井"}]}';

mocks.example20150315 = {
  json: json20150315,
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
