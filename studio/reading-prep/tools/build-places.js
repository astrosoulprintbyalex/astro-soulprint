/* Builds the small place files used by the Reading Prep tool: city name -> latitude, longitude and time zone.
   Run with:   cd soulprint-chart && npm ci && cd .. && node studio/reading-prep/tools/build-places.js
   Sources (all open, same as the chart): GeoNames via "all-the-cities" (CC BY 4.0), IANA zones via "tz-lookup" (CC0).
   The Rising sign needs the birth latitude and longitude, which the chart's own city lists do not carry. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CHART = path.join(__dirname, '..', '..', '..', 'soulprint-chart');
const need = (m) => require(require.resolve(m, { paths: [CHART] }));
const cities = need('all-the-cities');
const tzlookup = need('tz-lookup');

const { offsetSeconds } = require(path.join(CHART, 'js', 'hd-calc.js'));

const OUT = path.join(__dirname, '..', 'data', 'places');
const MIN_POP = 10000;           // towns smaller than this can be typed in as latitude / longitude
const ALL_COUNTRIES_FULL = ['MM']; // Myanmar: keep every place we have, whatever its size

const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`.]/g, '').replace(/\s+/g, ' ').trim();

// Old spellings people still use for Myanmar towns (for example Rangoon) come from the chart's own Myanmar list.
const mmAlt = {};
(function () {
  const ctx = { window: {} };
  ctx.window.Soulprint = {};
  vm.runInNewContext(fs.readFileSync(path.join(CHART, 'data', 'cities', 'MM.js'), 'utf8'), Object.assign(ctx, { Soulprint: ctx.window.Soulprint, window: ctx.window }));
  ((ctx.window.Soulprint.cityData || {}).MM || []).forEach((e) => { mmAlt[fold(e[0])] = e[3] || ''; });
})();

// The chart's own list of time zones per country. A country with one zone is always that zone (a border town must
// never be read as Thailand's or India's clock); with several zones, the coordinate lookup decides.
const allowed = {};
(function () {
  const ctx = { Soulprint: {} };
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(CHART, 'data', 'countries.js'), 'utf8'), ctx);
  ctx.Soulprint.countries.forEach((c) => { allowed[c.c] = c.tz; });
})();
// Two zone names can be the same clock (Europe/Kiev and Europe/Kyiv): compare real UTC offsets from 1970 to 2025.
const SAMPLES = [];
for (let t = Date.UTC(1970, 0, 1); t < Date.UTC(2025, 0, 1); t += 20 * 864e5) SAMPLES.push(t);
const sigCache = {};
function signature(tz) {
  if (sigCache[tz] === undefined) { try { sigCache[tz] = SAMPLES.map((t) => offsetSeconds(t, tz)).join(','); } catch (e) { sigCache[tz] = null; } }
  return sigCache[tz];
}
function zoneFor(code, lat, lon) {
  const list = allowed[code] || [];
  if (list.length === 1) return list[0];
  const tz = tzlookup(lat, lon);
  if (list.includes(tz)) return tz;
  const same = signature(tz) && list.find((a) => signature(a) === signature(tz));
  return same || tz;
}

const byCountry = {};
for (const c of cities) {
  if (c.population < MIN_POP && !ALL_COUNTRIES_FULL.includes(c.country)) continue;
  (byCountry[c.country] = byCountry[c.country] || []).push(c);
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

let total = 0, biggest = 0, bytes = 0;
for (const code of Object.keys(byCountry).sort()) {
  const tzs = [];
  const rows = byCountry[code].sort((a, b) => b.population - a.population).map((c) => {
    const lat = c.loc.coordinates[1], lon = c.loc.coordinates[0];
    let tz = null;
    try { tz = zoneFor(code, lat, lon); } catch (e) { return null; }
    if (tzs.indexOf(tz) < 0) tzs.push(tz);
    const admin = /^[A-Z]{2,3}$/.test(c.adminCode) ? c.adminCode : '';
    const alt = [c.altName, code === 'MM' ? mmAlt[fold(c.name)] : ''].filter(Boolean).join(' ');
    return [c.name, admin, Math.round(lat * 100) / 100, Math.round(lon * 100) / 100, tzs.indexOf(tz), alt];
  }).filter(Boolean);
  if (!rows.length) continue;
  const body = 'window.Soulprint=window.Soulprint||{};(Soulprint.places=Soulprint.places||{})[' + JSON.stringify(code) + ']=' + JSON.stringify({ tz: tzs, c: rows }) + ';\n';
  fs.writeFileSync(path.join(OUT, code + '.js'), body);
  total += rows.length; bytes += body.length; biggest = Math.max(biggest, body.length);
}
const mmNames = new Set((byCountry.MM || []).map((c) => fold(c.name)));
const missing = Object.keys(mmAlt).filter((n) => !mmNames.has(n));
console.log('countries:', fs.readdirSync(OUT).length, '| places:', total, '| total bytes:', bytes, '| biggest file:', biggest);
if (missing.length) console.log('Myanmar names in the chart list with no coordinates here (type lat/lon instead):', missing.join(', '));
