/* Birth Chart tests. The Swiss Ephemeris WebAssembly build used on the website is run here in Node and checked against
   reference numbers made with the native Swiss Ephemeris (tests/known-astro.json), and against the astronomy-engine
   library that the Human Design chart uses. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL, fileURLToPath } = require('node:url');

const astro = require('../js/astro-calc.js');
const hd = require('../js/hd-calc.js');
const known = require('./known-astro.json');

// The WebAssembly glue downloads files with fetch(). Node's fetch does not read file:// links, so teach it to.
const realFetch = globalThis.fetch;
globalThis.window = globalThis.window || {};
globalThis.fetch = async function (u, o) {
  u = String(u);
  if (u.startsWith('file:')) {
    return new Response(fs.readFileSync(fileURLToPath(u)), { status: 200, headers: { 'Content-Type': u.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' } });
  }
  return realFetch(u, o);
};
const log = console.log; console.log = function () {}; // the library prints a start-up line

let swe;
test('Swiss Ephemeris WebAssembly starts and has its data files', async () => {
  const { loadSwiss } = await import(pathToFileURL(path.join(__dirname, '..', 'js', 'swiss', 'loader.js')).href);
  swe = await loadSwiss();
  console.log = log;
  assert.match(swe.version(), /^2\.10/);
});

function diff(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

known.cases.forEach(function (c) {
  test('matches the native Swiss Ephemeris: ' + c.name, () => {
    const chart = astro.calculate(swe, { utcMs: c.utcMs, lat: c.lat, lon: c.lon });
    const by = {}; chart.points.forEach((p) => { by[p.key] = p; });
    Object.keys(c.bodies).forEach((k) => {
      assert.ok(diff(by[k].lon, c.bodies[k].lon) < 1e-6, k + ' ' + by[k].lon + ' vs ' + c.bodies[k].lon);
      if (by[k].retrograde !== null) assert.strictEqual(by[k].retrograde, c.bodies[k].speed < 0, k + ' retrograde flag');
    });
    assert.ok(diff(chart.asc, c.asc) < 1e-6, 'Ascendant');
    assert.ok(diff(chart.mc, c.mc) < 1e-6, 'Midheaven');
    assert.ok(diff(chart.vertex, c.vertex) < 1e-6, 'Vertex');
    if (c.placidus) {
      assert.strictEqual(chart.placidusAvailable, true);
      for (let i = 0; i < 12; i++) assert.ok(diff(chart.cusps.P[i + 1], c.placidus[i]) < 1e-6, 'Placidus cusp ' + (i + 1));
    } else {
      assert.strictEqual(chart.placidusAvailable, false);
      assert.strictEqual(chart.cusps.P, null);
    }
  });
});

test('Sun to Pluto agree with astronomy-engine (independent library) within 0.02 degrees', () => {
  known.cases.forEach((c) => {
    const chart = astro.calculate(swe, { utcMs: c.utcMs, lat: c.lat, lon: c.lon });
    const by = {}; chart.points.forEach((p) => { by[p.key] = p; });
    const ae = hd.allLongitudes(new Date(c.utcMs));
    ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].forEach((k) => {
      assert.ok(diff(by[k].lon, ae[k]) < 0.02, c.name + ' ' + k + ' ' + by[k].lon + ' vs ' + ae[k]);
    });
  });
});

test('whole sign houses start at 0 degrees of the Ascendant sign', () => {
  const c = astro.wholeSignCusps(123.54);
  assert.strictEqual(c[1], 120); assert.strictEqual(c[2], 150); assert.strictEqual(c[12], 90);
  assert.strictEqual(astro.houseOf(123.54, c), 1);
  assert.strictEqual(astro.houseOf(119.99, c), 12);
  assert.strictEqual(astro.houseOf(300, c), 7);
});

test('every point has a house in both systems and the houses add up', () => {
  const c = known.cases[0];
  const chart = astro.calculate(swe, { utcMs: c.utcMs, lat: c.lat, lon: c.lon });
  chart.points.forEach((p) => { assert.ok(p.houses.W >= 1 && p.houses.W <= 12); assert.ok(p.houses.P >= 1 && p.houses.P <= 12); });
  const asc = chart.points.find((p) => p.key === 'asc'), mc = chart.points.find((p) => p.key === 'mc');
  assert.strictEqual(asc.houses.W, 1); assert.strictEqual(asc.houses.P, 1); assert.strictEqual(mc.houses.P, 10);
});

test('Part of Fortune uses the day formula by day and the night formula by night', () => {
  // Ascendant 100, Sun 300 (above the horizon: 300-100 = 200 >= 180) -> day chart
  assert.strictEqual(astro.isDayChart(300, 100), true);
  assert.strictEqual(astro.fortune(100, 300, 40, true), 100 + 40 - 300 + 360);   // ASC + Moon - Sun
  // Sun 150 (below the horizon) -> night chart
  assert.strictEqual(astro.isDayChart(150, 100), false);
  assert.strictEqual(astro.fortune(100, 150, 40, false), 100 + 150 - 40);        // ASC + Sun - Moon
  assert.strictEqual(astro.isDayChart(100, 100), false);
  assert.strictEqual(astro.isDayChart(280.0001, 100), true);
});

test('degrees and minutes are cut, not rounded', () => {
  const s = astro.split(84.22509620767576);
  assert.deepStrictEqual([s.sign, s.degree, s.minute], [2, 24, 13]);
  assert.strictEqual(astro.format({ degree: 5, minute: 7 }), '5°07′');
});

test('aspects use the right angles and orbs', () => {
  const pts = [{ key: 'sun', lon: 10 }, { key: 'moon', lon: 130 }, { key: 'mercury', lon: 191 }, { key: 'venus', lon: 79 }, { key: 'mars', lon: 100.5 },
               { key: 'jupiter', lon: 250 }, { key: 'saturn', lon: 11 }, { key: 'uranus', lon: 300 }, { key: 'neptune', lon: 330 }, { key: 'pluto', lon: 355 },
               { key: 'northNode', lon: 200 }, { key: 'chiron', lon: 45 }, { key: 'asc', lon: 50 }, { key: 'mc', lon: 320 }];
  const a = astro.findAspects(pts);
  const has = (x, y, t) => a.some((o) => o.type === t && ((o.a === x && o.b === y) || (o.a === y && o.b === x)));
  assert.ok(has('sun', 'moon', 'trine'));          // 120
  assert.ok(has('sun', 'mercury', 'opposition'));  // 181 -> 1 degree off
  assert.ok(has('sun', 'saturn', 'conjunction'));
  assert.ok(has('sun', 'venus', 'sextile') === false); // 69 degrees: outside the 5 degree orb
  assert.ok(has('sun', 'mars', 'square'));         // 90.5
  assert.ok(!a.some((o) => (o.a === 'asc' && o.b === 'mc') || (o.a === 'mc' && o.b === 'asc')), 'no Ascendant-Midheaven aspect');
  assert.ok(a.every((o, i) => i === 0 || a[i - 1].orb <= o.orb), 'sorted tightest first');
});

test('Placidus is not offered near the poles', () => {
  assert.strictEqual(astro.placidusPossible(69.65), false);
  assert.strictEqual(astro.placidusPossible(-67), false);
  assert.strictEqual(astro.placidusPossible(64.1), true);
});

// Independent check of the Ascendant and Midheaven: textbook formulas from the sidereal time of astronomy-engine,
// with no Swiss Ephemeris involved. Catches mistakes in time, longitude or latitude handling.
test('Ascendant and Midheaven match the textbook formula (independent of the Swiss Ephemeris)', () => {
  const Astronomy = require('../js/vendor/astronomy.browser.min.js');
  const rad = (d) => d * Math.PI / 180, deg = (r) => r * 180 / Math.PI, n360 = (x) => ((x % 360) + 360) % 360;
  known.cases.forEach((c) => {
    const date = new Date(c.utcMs);
    const T = (c.utcMs / 86400000 + 2440587.5 - 2451545.0) / 36525;
    const meanObl = 23.439291111 - 0.0130041667 * T;                       // mean obliquity of the ecliptic (degrees)
    const omega = rad(125.04452 - 1934.136261 * T), L = rad(280.4665 + 36000.7698 * T), Lm = rad(218.3165 + 481267.8813 * T);
    const dEps = (9.20 * Math.cos(omega) + 0.57 * Math.cos(2 * L) + 0.10 * Math.cos(2 * Lm) - 0.09 * Math.cos(2 * omega)) / 3600; // nutation in obliquity
    const eps = rad(meanObl + dEps);
    const ramc = rad(n360(Astronomy.SiderealTime(date) * 15 + c.lon));      // apparent sidereal time + east longitude
    const phi = rad(c.lat);
    const mc = n360(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
    const asc = n360(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))));
    assert.ok(diff(mc, c.mc) < 0.02, c.name + ' MC ' + mc + ' vs ' + c.mc);
    assert.ok(diff(asc, c.asc) < 0.02, c.name + ' Ascendant ' + asc + ' vs ' + c.asc);
  });
});
