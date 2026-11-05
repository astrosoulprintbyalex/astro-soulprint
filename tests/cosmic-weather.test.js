const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../soulprint-chart/js/vendor/astronomy.browser.min.js');
const Sky = require('../cosmic-weather/sky.js');
const W = require('../cosmic-weather/words.js');

const sky = Sky.makeSky(A);
const at = (iso) => Date.parse(iso);
const near = (ms, iso, mins = 30) => assert.ok(Math.abs(ms - Date.parse(iso)) <= mins * 60000, new Date(ms).toISOString() + ' vs ' + iso);

test('the week runs Monday to Monday in Myanmar Time', () => {
  const b = Sky.weekBounds(at('2026-11-05T05:00:00Z')); // Thursday
  assert.equal(b.start, at('2026-11-01T17:30:00Z'));    // Monday 2 Nov 00:00 MMT
  assert.equal(b.end - b.start, 7 * Sky.DAY);
  assert.equal(Sky.weekBounds(at('2026-11-08T16:00:00Z')).start, b.start); // Sunday night MMT is still the same week
  assert.equal(Sky.weekBounds(at('2026-11-08T17:31:00Z')).start, b.end);   // Monday 00:01 MMT starts the next
});

test('Moon phases and eclipses match known 2026 dates', () => {
  let w = sky.week(at('2026-11-10T05:00:00Z'));
  const nm = w.phases.find((p) => p.quarter === 0);
  near(nm.time, '2026-11-09T07:02:00Z');
  assert.equal(W.SIGNS[nm.sign], 'Scorpio');
  assert.equal(nm.eclipse, null);

  w = sky.week(at('2026-08-12T05:00:00Z'));
  assert.equal(w.phases.find((p) => p.quarter === 0).eclipse.type, 'solar');
  w = sky.week(at('2026-08-28T05:00:00Z'));
  assert.equal(w.phases.find((p) => p.quarter === 2).eclipse.type, 'lunar');
});

test('planets changing sign', () => {
  let w = sky.week(at('2026-11-20T05:00:00Z'));
  const sun = w.ingresses.find((i) => i.body === 'Sun');
  assert.equal(W.SIGNS[sun.sign], 'Sagittarius');
  near(sun.time, '2026-11-22T07:23:00Z');
  w = sky.week(at('2026-07-01T05:00:00Z'));
  const jup = w.ingresses.find((i) => i.body === 'Jupiter');
  assert.equal(W.SIGNS[jup.sign], 'Leo');
});

test('retrogrades starting and ending', () => {
  let w = sky.week(at('2026-02-27T05:00:00Z'));
  const rx = w.stations.find((s) => s.body === 'Mercury');
  assert.equal(rx.kind, 'retrograde');
  near(rx.time, '2026-02-26T06:47:00Z');
  w = sky.week(at('2026-11-12T05:00:00Z'));
  const dr = w.stations.find((s) => s.body === 'Mercury');
  assert.equal(dr.kind, 'direct');
  near(dr.time, '2026-11-13T15:52:00Z');
  assert.ok(sky.week(at('2026-11-05T05:00:00Z')).retrograde.includes('Mercury'));
});

test('the Moon is followed through the whole week with no gaps', () => {
  const w = sky.week(at('2026-11-05T05:00:00Z'));
  assert.equal(w.moon[0].from, w.start);
  assert.equal(w.moon[w.moon.length - 1].to, w.end);
  w.moon.slice(1).forEach((s, i) => assert.equal(s.from, w.moon[i].to));
  assert.ok(w.moon.length >= 3 && w.moon.length <= 5);
});

test('every week of a year can be calculated and every event has words', () => {
  for (let t = at('2026-01-05T05:00:00Z'); t < at('2027-01-05T05:00:00Z'); t += 7 * Sky.DAY) {
    const w = sky.week(t);
    const texts = [].concat(w.phases.map(W.phaseText), w.ingresses.map(W.ingressText), w.stations.map(W.stationText));
    texts.forEach((x) => {
      assert.ok(x.en.length > 20 && x.my.length > 20);
      assert.ok(!/undefined|NaN/.test(x.en + x.my), x.en + x.my);
    });
    assert.equal(w.moonNow.lit >= 0 && w.moonNow.lit <= 100, true);
  }
});

test('all the words are filled in', () => {
  assert.equal(W.MOON_SIGN.length, 12); assert.equal(W.SIGN_TONE.length, 12);
  W.MOON_SIGN.concat(W.SIGN_TONE).forEach((x) => assert.ok(x.en && x.my));
  Sky.MOVERS.forEach((b) => { const p = W.PLANET[b]; assert.ok(p.domain_en && p.domain_my && p.tip_en && p.tip_my && W.PLANET_GLYPH[b], b); });
  Sky.SLOW.forEach((b) => { const p = W.PLANET[b]; assert.ok(p.rx_en && p.rx_my && p.dr_en && p.dr_my, b); });
});
