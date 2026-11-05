const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../studio/transit-card/transit.js');

const MMT = 390; // Myanmar time, UTC+6:30
const find = (c, type, body) => c.events.find(e => e.type === type && e.body === body);

test('Moon sign at a known moment (2026-11-05 noon UTC is 28 Virgo to Libra boundary region, in Virgo/Libra)', () => {
  const m = T.position('Moon', new Date('2026-11-05T12:00:00Z'));
  assert.ok(['Virgo', 'Libra'].includes(m.sign));
});

test('Sun is in Scorpio on 5 Nov 2026 and enters Sagittarius on 22 Nov', () => {
  assert.equal(T.position('Sun', new Date('2026-11-05T12:00:00Z')).sign, 'Scorpio');
  const c = T.dailyCard(2026, 11, 20, MMT);
  const e = find(c, 'ingress', 'Sun');
  assert.equal(e.sign, 'Sagittarius');
  assert.equal(e.date.toISOString().slice(0, 10), '2026-11-22');
});

test('Mercury and Venus station direct in the week of 10 Nov 2026', () => {
  const c = T.dailyCard(2026, 11, 10, MMT);
  assert.equal(find(c, 'station-direct', 'Mercury').date.toISOString().slice(0, 10), '2026-11-13');
  assert.equal(find(c, 'station-direct', 'Venus').date.toISOString().slice(0, 10), '2026-11-14');
});

test('retrograde-now list on 5 Nov 2026', () => {
  const c = T.dailyCard(2026, 11, 5, MMT);
  for (const b of ['Mercury', 'Venus', 'Saturn', 'Neptune']) assert.ok(c.retrogradeNow.includes(b), b);
  assert.ok(!c.retrogradeNow.includes('Sun'));
  assert.ok(!c.retrogradeNow.includes('Mars'));
});

test('New Moon on 9 Nov 2026 is named only on that day; the day after is a crescent', () => {
  assert.equal(T.dailyCard(2026, 11, 9, MMT).moon.phase, 'New Moon');
  assert.equal(T.dailyCard(2026, 11, 10, MMT).moon.phase, 'Waxing Crescent');
  assert.equal(T.dailyCard(2026, 11, 24, MMT).moon.exact.name, 'Full Moon');
});

test('illumination goes up towards the full moon', () => {
  const a = T.dailyCard(2026, 11, 12, MMT).moon.illumination;
  const b = T.dailyCard(2026, 11, 20, MMT).moon.illumination;
  assert.ok(b > a && b < 1 && a > 0);
});

test('Moon changes sign during the day it does so', () => {
  const m = T.dailyCard(2026, 11, 5, MMT).moon;
  assert.equal(m.ingress.sign, 'Libra');
});

test('quiet week returns no events without errors', () => {
  const c = T.dailyCard(2027, 1, 1, MMT);
  assert.ok(Array.isArray(c.events));
});

test('year boundary and leap day do not break the calculation', () => {
  assert.doesNotThrow(() => T.dailyCard(2027, 12, 29, MMT));
  assert.doesNotThrow(() => T.dailyCard(2028, 2, 29, 0));
});
