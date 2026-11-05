/* Makes tests/known-astro.json: reference positions from the NATIVE Swiss Ephemeris (the C library), so the tests can
   check that the WebAssembly build used on the website gives the same numbers.
   Not part of the normal build. To refresh it:
     npm install --no-save sweph        (needs the 3 files in ../ephe: sepl_18.se1, semo_18.se1, seas_18.se1)
     node tools/make-astro-fixtures.js */
const path = require('path');
const fs = require('fs');
const sweph = require('sweph');
const calc = require('../js/hd-calc.js');

sweph.set_ephe_path(path.join(__dirname, '..', 'ephe'));
const F = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_SPEED;
const BODIES = { sun: 0, moon: 1, mercury: 2, venus: 3, mars: 4, jupiter: 5, saturn: 6, uranus: 7, neptune: 8, pluto: 9, northNode: 10, lilith: 12, chiron: 15, juno: 19 };

const CASES = [
  { name: 'Yangon 1992-06-15 08:30', y: 1992, mo: 6, d: 15, h: 8, mi: 30, tz: 'Asia/Yangon', lat: 16.80528, lon: 96.15611 },
  { name: 'Bangkok 1985-12-03 22:15', y: 1985, mo: 12, d: 3, h: 22, mi: 15, tz: 'Asia/Bangkok', lat: 13.75398, lon: 100.50144 },
  { name: 'Singapore 2001-02-28 03:05', y: 2001, mo: 2, d: 28, h: 3, mi: 5, tz: 'Asia/Singapore', lat: 1.28967, lon: 103.85007 },
  { name: 'New York 1978-07-20 14:00 (summer time)', y: 1978, mo: 7, d: 20, h: 14, mi: 0, tz: 'America/New_York', lat: 40.71427, lon: -74.00597 },
  { name: 'Sydney 2010-11-05 12:00 (southern hemisphere)', y: 2010, mo: 11, d: 5, h: 12, mi: 0, tz: 'Australia/Sydney', lat: -33.86785, lon: 151.20732 },
  { name: 'London 1999-12-31 23:59', y: 1999, mo: 12, d: 31, h: 23, mi: 59, tz: 'Europe/London', lat: 51.50853, lon: -0.12574 },
  { name: 'Mandalay 1960-03-08 05:20 (1960 clocks)', y: 1960, mo: 3, d: 8, h: 5, mi: 20, tz: 'Asia/Yangon', lat: 21.97473, lon: 96.08359 },
  { name: 'Tromso 1990-06-21 03:00 (no Placidus)', y: 1990, mo: 6, d: 21, h: 3, mi: 0, tz: 'Europe/Oslo', lat: 69.6496, lon: 18.95508, noPlacidus: true }
];

const out = { generatedWith: 'sweph ' + sweph.version() + ' (Swiss Ephemeris, native), files sepl_18 / semo_18 / seas_18', cases: [] };
for (const c of CASES) {
  const conv = calc.localToUtc(c.y, c.mo, c.d, c.h, c.mi, c.tz);
  const jd = conv.ms / 86400000 + 2440587.5;
  const bodies = {};
  for (const [k, n] of Object.entries(BODIES)) {
    const r = sweph.calc_ut(jd, n, F);
    if (r.error) throw new Error(c.name + ' ' + k + ': ' + r.error);
    bodies[k] = { lon: r.data[0], speed: r.data[3] };
  }
  const hw = sweph.houses(jd, c.lat, c.lon, 'W');
  const rec = { name: c.name, utcMs: conv.ms, lat: c.lat, lon: c.lon, bodies, asc: hw.data.points[0], mc: hw.data.points[1], vertex: hw.data.points[3] };
  if (!c.noPlacidus) rec.placidus = sweph.houses(jd, c.lat, c.lon, 'P').data.houses.slice(0, 12);
  out.cases.push(rec);
}
fs.writeFileSync(path.join(__dirname, '..', 'tests', 'known-astro.json'), JSON.stringify(out, null, 1) + '\n');
console.log('wrote', out.cases.length, 'cases');
