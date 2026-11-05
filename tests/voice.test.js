const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../studio/transit-card/transit.js');
const V = require('../studio/transit-card/voice.js');

const SIGNS = T.SIGNS;
const dates = [[2026, 11, 5], [2026, 11, 9], [2026, 11, 10], [2026, 11, 20], [2026, 11, 24], [2026, 12, 1], [2027, 1, 1], [2026, 1, 19], [2026, 1, 17], [2026, 3, 3]];

test('every sign has a Moon theme', () => {
  SIGNS.forEach(s => assert.ok(V.MOON_THEME[s] && /Energy$/.test(V.MOON_THEME[s]), s));
});

test('messages fit the 260-character box and keep the voice', () => {
  for (const [y, m, d] of dates) {
    const c = V.candidates(T.dailyCard(y, m, d, 390));
    assert.ok(c.length >= 2, 'at least two options for ' + [y, m, d]);
    for (const msg of c) {
      assert.ok(msg.length <= 260, msg.length + ' chars: ' + msg);
      assert.ok(!/\{\w+\}/.test(msg), 'unfilled slot: ' + msg);
      assert.ok(/နော်|ပါ။|ပါလိမ့်မယ်/.test(msg), 'missing soft ending: ' + msg);
      assert.ok(/🤍|✨/.test(msg), 'missing soft emoji: ' + msg);
      assert.ok(!/\*\*|#/.test(msg), 'no bold or hashtags');
    }
  }
});

test('options follow the real sky', () => {
  const c = V.candidates(T.dailyCard(2026, 11, 10, 390));
  assert.ok(c.some(t => t.includes('Mercury Direct')), 'Mercury station direct is mentioned');
  assert.ok(c.some(t => t.includes('Moon') && t.includes('Scorpio')));
  const nm = V.candidates(T.dailyCard(2026, 11, 9, 390));
  assert.ok(nm.some(t => t.startsWith('New Moon in Scorpio')));
  const sun = V.candidates(T.dailyCard(2026, 11, 20, 390));
  assert.ok(sun.some(t => t.includes('Sun က Sagittarius')));
});
