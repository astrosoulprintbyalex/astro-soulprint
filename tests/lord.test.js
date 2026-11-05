const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../2027-lord-of-the-year/lord.js');

const birth = (y, m, d) => ({ year: y, month: m, day: d });

test('traditional rulers: all 12 signs', () => {
  const expected = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
    Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
  };
  L.SIGNS.forEach((s, i) => assert.equal(L.RULERS[i], expected[s], s));
  assert.equal(L.SIGNS.length, 12);
});

test('age 0 and every multiple of 12 is the 1st house (the rising sign itself)', () => {
  for (const age of [0, 12, 24, 36, 48, 60, 72, 84, 96]) {
    const p = L.profection(birth(2027 - age, 6, 15), 4); // Leo rising
    assert.equal(p.house, 1, 'age ' + age);
    assert.equal(p.sign, 'Leo');
    assert.equal(p.lord, 'Sun');
  }
});

test('house = (age mod 12) + 1, sign counts forward from the rising sign', () => {
  // born 1990, rising Aries: age 37 -> 37 mod 12 = 1 -> 2nd house -> Taurus -> Venus
  let p = L.profection(birth(1990, 5, 14), 0);
  assert.deepEqual([p.age, p.house, p.sign, p.lord], [37, 2, 'Taurus', 'Venus']);
  // born 1999, rising Scorpio: age 28 -> 4 -> 5th house -> Scorpio + 4 = Pisces -> Jupiter
  p = L.profection(birth(1999, 1, 27), 7);
  assert.deepEqual([p.age, p.house, p.sign, p.lord], [28, 5, 'Pisces', 'Jupiter']);
  // born 1985, rising Pisces: age 42 -> 6 -> 7th house -> Pisces + 6 = Virgo -> Mercury
  p = L.profection(birth(1985, 9, 3), 11);
  assert.deepEqual([p.age, p.house, p.sign, p.lord], [42, 7, 'Virgo', 'Mercury']);
});

test('the sign wraps around the zodiac after Pisces', () => {
  // rising Sagittarius, house 6 (age 5): Capricorn, Aquarius, Pisces, Aries, Taurus -> Taurus -> Venus
  const p = L.profection(birth(2022, 3, 1), 8);
  assert.deepEqual([p.age, p.house, p.sign, p.lord], [5, 6, 'Taurus', 'Venus']);
});

test('all 12 houses appear across 12 consecutive birth years, each exactly once', () => {
  const seen = new Set();
  for (let y = 1990; y < 2002; y++) seen.add(L.profection(birth(y, 8, 8), 2).house);
  assert.equal(seen.size, 12);
});

test('Aquarius house gives Saturn and Scorpio house gives Mars (no modern rulers)', () => {
  // rising Aries, house 11 = Aquarius (age 10), house 8 = Scorpio (age 7)
  assert.equal(L.profection(birth(2017, 4, 4), 0).lord, 'Saturn');
  assert.equal(L.profection(birth(2020, 4, 4), 0).lord, 'Mars');
});

test('profection year dates: birthday in 2027 to the day before the birthday in 2028', () => {
  const p = L.profection(birth(1990, 5, 14), 0);
  assert.equal(L.formatDate(p.start), '14 May 2027');
  assert.equal(L.formatDate(p.end), '13 May 2028');
  const q = L.profection(birth(1988, 1, 1), 0);
  assert.equal(L.formatDate(q.start), '1 January 2027');
  assert.equal(L.formatDate(q.end), '31 December 2027');
});

test('29 February birthdays: 2027 uses 28 February, the 2028 leap birthday ends the year on 28 February', () => {
  const p = L.profection(birth(2000, 2, 29), 0);
  assert.equal(L.formatDate(p.start), '28 February 2027');
  assert.equal(L.formatDate(p.end), '28 February 2028');
  assert.equal(L.isLeap(2028), true);
  assert.equal(L.isLeap(2027), false);
  assert.equal(L.isLeap(2100), false);
  assert.equal(L.isLeap(2000), true);
});

test('every house and planet has English and Burmese text', () => {
  assert.equal(L.HOUSES.length, 12);
  L.HOUSES.forEach((h, i) => {
    assert.ok(h.title && h.my && h.en.length > 40 && h.mm.length > 40, 'house ' + (i + 1));
    assert.match(h.mm, /[က-႟]/, 'house ' + (i + 1) + ' has Burmese script');
  });
  new Set(L.RULERS).forEach((planet) => {
    const t = L.PLANETS[planet];
    assert.ok(t && t.en.length > 40 && /[က-႟]/.test(t.mm), planet);
  });
  assert.equal(Object.keys(L.PLANETS).length, 7); // only the seven traditional planets
});
