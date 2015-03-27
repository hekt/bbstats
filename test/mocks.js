var mocks = {};

var scoreMock = {
  firstTeam: {
    name: '日本ハム',
    totalRuns: 5,
    totalErrors: 0,
    totalHits: 9,
    runs: [0, 0, 0, 0, 0, 0, 0, 0, 5]
  },
  secondTeam: {
    name: '広島',
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
    score: scoreMock, },
  { date: new Date('2012-05-19T00:00:00.000Z'),
    ground: 'マツダスタジアム',
    result: 'lose',
    score: scoreMock },
  { date: new Date('2012-05-17T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
    score: scoreMock },
  { date: new Date('2011-05-16T00:00:00.000Z'),
    ground: '甲子園',
    result: 'win',
    score: scoreMock },
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

module.exports = mocks;
