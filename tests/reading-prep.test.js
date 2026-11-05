const test = require('node:test');
const assert = require('node:assert/strict');
const calc = require('../soulprint-chart/js/hd-calc.js');
const D = require('../soulprint-chart/js/hd-data.js');
const T = require('../soulprint-chart/js/content.js');
const A = require('../studio/reading-prep/astro.js');
const O = require('../studio/reading-prep/outline.js');
const S = require('../studio/reading-prep/store.js');

/* Reference values from the Swiss Ephemeris (pyswisseph), tropical zodiac: Sun, Moon and Ascendant for 8 births
   across both hemispheres, a high latitude, and times that cross midnight in UTC. */
const REF = [
  { label: "Yangon 1990-05-14 06:30", utcMs: 642643200000, lat: 16.81, lon: 96.16, sun: 52.9494, moon: 278.8526, asc: 66.2934 },
  { label: "New York 1985-12-03 22:15", utcMs: 502514100000, lat: 40.71, lon: -74.01, sun: 251.9116, moon: 146.7369, asc: 146.5472 },
  { label: "Sydney 2001-02-28 03:05", utcMs: 983289900000, lat: -33.87, lon: 151.21, sun: 339.13, moon: 27.8827, asc: 293.4179 },
  { label: "London 1972-07-21 14:40", utcMs: 80574000000, lat: 51.51, lon: -0.13, sun: 118.8715, moon: 244.4351, asc: 218.0912 },
  { label: "Reykjavik 1999-11-11 08:00", utcMs: 942307200000, lat: 64.15, lon: -21.94, sun: 228.4766, moon: 263.1181, asc: 213.0214 },
  { label: "Quito 2010-09-09 18:45", utcMs: 1284075900000, lat: -0.22, lon: -78.51, sun: 167.1861, moon: 189.2911, asc: 356.3609 },
  { label: "Bangkok 1968-01-01 00:10", utcMs: -63183000000, lat: 13.75, lon: 100.5, sun: 279.3382, moon: 286.8815, asc: 187.326 },
  { label: "Auckland 1979-06-30 23:59", utcMs: 299591940000, lat: -36.85, lon: 174.76, sun: 98.1115, moon: 164.6097, asc: 2.0318 },
];
const gap = (a, b) => { const e = Math.abs(a - b) % 360; return e > 180 ? 360 - e : e; };

test('Sun, Moon and Rising match the Swiss Ephemeris to under 0.01 degree', () => {
  for (const r of REF) {
    const a = A.astrologyAt(r.utcMs, r.lat, r.lon);
    assert.ok(gap(a.sun.lon, r.sun) < 0.01, r.label + ' sun');
    assert.ok(gap(a.moon.lon, r.moon) < 0.01, r.label + ' moon');
    assert.ok(gap(a.rising.lon, r.asc) < 0.01, r.label + ' rising');
  }
});

test('signs and degrees read correctly', () => {
  const d = A.describe(52.9494);
  assert.deepEqual([d.sign, d.degree, d.minute], ['Taurus', 22, 56]);
  assert.equal(A.describe(0).sign, 'Aries');
  assert.equal(A.describe(359.999).sign, 'Pisces');
  assert.equal(A.describe(-1).sign, 'Pisces'); // wraps
  assert.equal(A.describe(30).sign, 'Taurus');
  assert.equal(A.describe(66.2934).text, 'Gemini 6°17′');
});

test('Rising agrees with a brute-force search for the rising point of the zodiac', () => {
  // Independent check: sweep the ecliptic and find the degree that is on the eastern horizon.
  const Astronomy = require('../soulprint-chart/js/vendor/astronomy.browser.min.js');
  const RAD = Math.PI / 180;
  const cases = [[0, 51.5, -0.13], [1.2e12, -33.9, 151.2], [9.5e11, 16.8, 96.2], [1.6e12, 35.7, 139.7], [5e11, -0.2, -78.5]];
  for (const [ms, lat, lon] of cases) {
    const date = new Date(ms), t = Astronomy.MakeTime(date);
    const lst = (Astronomy.SiderealTime(t) * 15 + lon) * RAD, eps = Astronomy.e_tilt(t).tobl * RAD, phi = lat * RAD;
    const alt = (lam) => { // altitude of the ecliptic point at longitude lam
      const l = lam * RAD, ra = Math.atan2(Math.sin(l) * Math.cos(eps), Math.cos(l)), dec = Math.asin(Math.sin(eps) * Math.sin(l));
      return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(lst - ra));
    };
    let best = null;
    for (let lam = 0; lam < 360; lam += 0.001) {
      const a0 = alt(lam), a1 = alt(lam + 0.001);
      if (a0 > 0 && a1 <= 0) best = lam; // zodiac degrees further east have not risen yet, so altitude falls through zero at the Ascendant
    }
    assert.ok(gap(A.ascendantLongitude(date, lat, lon), best) < 0.01, 'lat ' + lat);
  }
});

test('polar latitudes carry a warning, ordinary ones do not', () => {
  assert.match(A.astrologyAt(REF[4].utcMs, 70, -20).risingNote, /unreliable/);
  assert.equal(A.astrologyAt(REF[0].utcMs, 16.8, 96.2).risingNote, '');
});

test('coordinates: decimals, hemisphere letters, commas, limits', () => {
  const p = A.parseCoordinate;
  assert.equal(p('16.81', 'lat'), 16.81);
  assert.equal(p('-33.87', 'lat'), -33.87);
  assert.equal(p('33.87 S', 'lat'), -33.87);
  assert.equal(p('74.01W', 'lon'), -74.01);
  assert.equal(p('96,16 e', 'lon'), 96.16);
  assert.equal(p('0', 'lon'), 0);
  for (const [bad, axis] of [['', 'lat'], ['abc', 'lat'], ['91', 'lat'], ['181', 'lon'], ['-33.87 S', 'lat'], ['12 E', 'lat'], ['12 N', 'lon']]) {
    assert.ok(Number.isNaN(p(bad, axis)), JSON.stringify(bad) + ' as ' + axis);
  }
});

/* ---------- Outline and copy text ---------- */

function sampleClient(notes) {
  const inputs = { name: 'Aye Aye', date: '1990-05-14', time: '06:30', timeUnknown: false, place: 'Yangon', countryName: 'Myanmar' };
  const chart = calc.calculateChart({ year: 1990, month: 5, day: 14, hour: 6, minute: 30, timeZone: 'Asia/Yangon' });
  const astro = A.astrologyAt(chart.birthUtc.getTime(), 16.81, 96.16);
  return { client: { inputs, notes: notes || {} }, summary: O.summarize(chart, astro, T, D, inputs), chart };
}

test('summary uses the same words as the chart page', () => {
  const { summary, chart } = sampleClient();
  assert.equal(summary.type, T.TYPES[chart.type].name);
  assert.equal(summary.sun, 'Taurus 22°56′');
  assert.equal(summary.moon, 'Capricorn 8°51′');
  assert.equal(summary.rising, 'Gemini 6°17′');
  assert.match(summary.birth, /^14 May 1990, 6:30 AM · Yangon, Myanmar \(UTC\+06:30\)$/);
  // gates that are active but not part of a defined channel are the "hanging" gates
  const inCh = new Set(); chart.channels.forEach((c) => { inCh.add(c.a); inCh.add(c.b); });
  summary.hangingGates.forEach((g) => { assert.ok(chart.activeGates[g]); assert.ok(!inCh.has(g)); });
  assert.equal(summary.hangingGates.length + inCh.size, summary.gateCount);
});

test('every section has a unique id and belongs to a group', () => {
  const ids = O.SECTIONS.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  const groups = new Set(O.GROUPS.map((g) => g.id));
  O.SECTIONS.forEach((s) => assert.ok(groups.has(s.group), s.id));
  Object.keys(O.cues(sampleClient().summary)).forEach((id) => assert.ok(ids.includes(id), 'cue for unknown section ' + id));
  ids.forEach((id) => assert.ok(id in O.cues(sampleClient().summary), 'no cue entry for ' + id));
});

test('copy text lists every section, keeps the notes, and marks empty ones', () => {
  const { client, summary } = sampleClient({ type: 'Likes to wait for a spark.\nMention Sunday walks.', cross: '   ' });
  const text = O.copyText(client, summary);
  assert.match(text, /^READING PREP: Aye Aye\nBorn: 14 May 1990, 6:30 AM/);
  O.SECTIONS.forEach((s, i) => assert.ok(text.includes((i + 1) + '. ' + s.title.toUpperCase()), s.title));
  assert.match(text, /2\. TYPE & STRATEGY\n\(.+\)\nLikes to wait for a spark\.\nMention Sunday walks\./);
  assert.match(text, /6\. INCARNATION CROSS\n\(.+\)\n–\n/); // whitespace-only note counts as empty
  assert.match(text, /Astrology: Sun Taurus 22°56′ · Moon Capricorn 8°51′ · Rising Gemini 6°17′/);
  assert.ok(text.endsWith('\n'));
});

test('birth time unknown is stated plainly', () => {
  const line = O.birthLine({ date: '2001-02-03', time: '12:00', timeUnknown: true, place: 'Lima', countryName: 'Peru' }, 'UTC-05:00');
  assert.equal(line, '3 February 2001, time unknown (12:00 PM used) · Lima, Peru (UTC-05:00)');
  assert.equal(O.fmtTime('00:05'), '12:05 AM');
  assert.equal(O.fmtTime('12:00'), '12:00 PM');
  assert.equal(O.fmtTime('23:59'), '11:59 PM');
});

/* ---------- Notes storage ---------- */

function fakeStorage(opts) {
  const m = {};
  return {
    m,
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { if (opts && opts.full) throw new Error('QuotaExceededError'); m[k] = String(v); }
  };
}

test('notes are kept per client and survive a reload', () => {
  const st = fakeStorage();
  const a = S.createStore(st);
  const id1 = a.newId(), id2 = a.newId();
  assert.notEqual(id1, id2);
  a.save({ id: id1, inputs: { name: 'One' }, notes: { type: 'one notes' } });
  a.save({ id: id2, inputs: { name: 'Two' }, notes: { type: 'two notes' } });
  const b = S.createStore(st); // a new page load
  assert.equal(b.get(id1).notes.type, 'one notes');
  assert.equal(b.get(id2).notes.type, 'two notes');
  assert.equal(b.list().length, 2);
  assert.equal(b.getLastId(), id2);
  assert.equal(b.persistent, true);
});

test('editing one client never touches another, and deleting one keeps the rest', () => {
  const st = fakeStorage(), s = S.createStore(st);
  s.save({ id: 'a', inputs: { name: 'A' }, notes: { sun: 'a1' } });
  s.save({ id: 'b', inputs: { name: 'B' }, notes: { sun: 'b1' } });
  const a = s.get('a'); a.notes.sun = 'a2'; s.save(a);
  assert.equal(s.get('b').notes.sun, 'b1');
  s.remove('a');
  assert.equal(s.get('a'), null);
  assert.equal(s.get('b').notes.sun, 'b1');
  assert.equal(s.getLastId(), null); // 'a' was the last one opened, and it is gone
});

test('a second open tab does not wipe the first tab\'s clients', () => {
  const st = fakeStorage(), tab1 = S.createStore(st), tab2 = S.createStore(st);
  tab1.save({ id: 'x', inputs: { name: 'X' }, notes: {} });
  tab2.save({ id: 'y', inputs: { name: 'Y' }, notes: {} });
  assert.deepEqual(S.createStore(st).list().map((c) => c.id).sort(), ['x', 'y']);
});

test('blocked or full storage does not break the tool', () => {
  const none = S.createStore(null);
  assert.equal(none.persistent, false);
  assert.equal(none.save({ id: 'm', inputs: {}, notes: { sun: 'kept this visit' } }), false);
  assert.equal(none.get('m').notes.sun, 'kept this visit');

  const full = S.createStore(fakeStorage({ full: true }));
  assert.equal(full.save({ id: 'f', inputs: {}, notes: { sun: 'text' } }), false);
  assert.equal(full.persistent, false);
  assert.equal(full.get('f').notes.sun, 'text');
});

test('unreadable saved data is backed up before it can be overwritten', () => {
  const st = fakeStorage();
  st.m[S.KEY] = '{not json';
  const s = S.createStore(st);
  assert.deepEqual(s.list(), []);
  assert.equal(st.m[S.KEY + '.backup'], '{not json');
});
