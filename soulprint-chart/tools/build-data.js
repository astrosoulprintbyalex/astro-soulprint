/* Builds the small data files used by the city / time zone picker.
   Every city carries its latitude and longitude (2 decimals, about 1 km) so the Birth Chart can work out the
   Ascendant and houses. Entry format: [name, admin, timeZoneIndex, otherSpellings, latitude, longitude].
   Run with:  npm install && npm run build:data
   Sources (all open): GeoNames city list via "all-the-cities" (CC BY 4.0),
   IANA time zone data via "countries-and-timezones" (MIT), "tz-lookup" (CC0). */
const fs = require('fs');
const path = require('path');
const cities = require('all-the-cities');
const tzlookup = require('tz-lookup');
const ct = require('countries-and-timezones');
const { offsetSeconds } = require('../js/hd-calc.js');

const OUT = path.join(__dirname, '..', 'data');
const MIN_POP = 5000;   // smallest city shipped
const MAX_SINGLE = 2500; // single-zone countries: at most this many cities per country (largest first)

const countries = ct.getAllCountries();
const byCountry = {};
for (const c of cities) (byCountry[c.country] = byCountry[c.country] || []).push(c);

// Myanmar has one time zone, so the city never changes the chart. This list only powers
// the type-ahead suggestions, plus old spellings people still use.
const MM = [
  ['Yangon', 'Rangoon'], ['Mandalay', ''], ['Nay Pyi Taw', 'Naypyidaw Naypyitaw Nay Pyi Daw'],
  ['Mawlamyine', 'Moulmein'], ['Bago', 'Pegu'], ['Pathein', 'Bassein'], ['Monywa', ''],
  ['Sittwe', 'Akyab'], ['Meiktila', ''], ['Myeik', 'Mergui'], ['Taunggyi', ''], ['Myingyan', ''],
  ['Dawei', 'Tavoy'], ['Pyay', 'Prome'], ['Hinthada', 'Henzada'], ['Lashio', ''], ['Pakokku', ''],
  ['Taungoo', 'Toungoo'], ['Magway', 'Magwe'], ['Shwebo', ''], ['Sagaing', ''], ['Mogok', ''],
  ['Pyin Oo Lwin', 'Maymyo May Myo'], ['Hpa-An', 'Pa-an Hpa An'], ['Myitkyina', ''], ['Bhamo', ''],
  ['Loikaw', ''], ['Hakha', ''], ['Kawthoung', 'Victoria Point'], ['Thaton', ''], ['Kyaukse', ''],
  ['Minbu', ''], ['Chauk', ''], ['Thayetmyo', ''], ['Yenangyaung', ''], ['Pyinmana', ''],
  ['Letpadan', ''], ['Maubin', ''], ['Pyapon', ''], ['Wakema', ''], ['Bogale', ''], ['Twante', ''],
  ['Thanlyin', 'Syriam'], ['Kyaikto', ''], ['Mudon', ''], ['Mottama', 'Martaban'],
  ['Tachileik', 'Tachilek'], ['Mawlaik', ''], ['Falam', ''], ['Kengtung', 'Kyaingtong'],
  ['Hpakant', ''], ['Putao', ''], ['Kale', 'Kalay'], ['Tamu', ''], ['Kyaukpyu', ''],
  ['Thandwe', 'Sandoway'], ['Nyaungshwe', 'Inle'], ['Hsipaw', ''], ['Kyaikkami', ''],
  ['Paungde', ''], ['Thongwa', ''], ['Kyauktan', ''], ['Dala', ''], ['Insein', ''], ['Hlaingthaya', '']
];

// Coordinates for the Myanmar names GeoNames does not list (checked by hand, good to about 0.05 degrees).
const MM_EXTRA = {
  'Insein': [16.89, 96.10], 'Hlaingthaya': [16.87, 96.04], 'Dala': [16.76, 96.15], 'Kyauktan': [16.58, 96.30],
  'Thanlyin': [16.77, 96.25], 'Mottama': [16.48, 97.61], 'Letpadan': [17.78, 95.75], 'Tachileik': [20.45, 99.88],
  'Kengtung': [21.29, 99.60], 'Hpakant': [25.62, 96.31], 'Putao': [27.33, 97.41], 'Kale': [23.19, 94.05],
  'Tamu': [24.22, 94.30], 'Kyaukpyu': [19.43, 93.55], 'Thandwe': [18.46, 94.37], 'Hsipaw': [22.62, 97.30]
};
const foldName = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '');
function buildMM() {
  const geo = (byCountry.MM || []).slice();
  const used = new Set();
  const out = [];
  for (const [name, alt] of MM) {
    const keys = [name].concat(alt.split(' ').filter(Boolean)).map(foldName);
    const hit = geo.find((g) => {
      const gk = [g.name].concat((g.altName || '').split(',')).map(foldName);
      return gk.some((k) => k && keys.includes(k));
    });
    let lat, lon;
    if (hit) { used.add(hit); lon = hit.loc.coordinates[0]; lat = hit.loc.coordinates[1]; }
    else if (MM_EXTRA[name]) { lat = MM_EXTRA[name][0]; lon = MM_EXTRA[name][1]; }
    else throw new Error('Myanmar city without coordinates: ' + name);
    out.push([name, '', 0, alt, +lat.toFixed(2), +lon.toFixed(2)]);
  }
  // GeoNames towns that are not on the hand list, biggest first
  geo.filter((g) => !used.has(g) && g.population >= 3000 && !/Township$/.test(g.name))
    .sort((a, b) => b.population - a.population)
    .forEach((g) => out.push([g.name, '', 0, g.altName || '', +g.loc.coordinates[1].toFixed(2), +g.loc.coordinates[0].toFixed(2)]));
  return out;
}

// Two zone names can be the same clock (for example the old name "Europe/Kiev" and the new "Europe/Kyiv").
// Compare their real UTC offsets (including daylight saving) from 1970 to 2025 to tell.
const SAMPLES = [];
for (let t = Date.UTC(1970, 0, 1); t < Date.UTC(2025, 0, 1); t += 20 * 864e5) SAMPLES.push(t);
const sigCache = {};
function signature(tz) {
  if (sigCache[tz] !== undefined) return sigCache[tz];
  let sig = null;
  try { sig = SAMPLES.map((t) => offsetSeconds(t, tz)).join(','); } catch (e) { sig = null; }
  return (sigCache[tz] = sig);
}
const zoneCities = {}; // tz -> [[name, pop]]
const countryOut = [];
fs.mkdirSync(path.join(OUT, 'cities'), { recursive: true });
for (const f of fs.readdirSync(path.join(OUT, 'cities'))) fs.unlinkSync(path.join(OUT, 'cities', f));

for (const code of Object.keys(countries).sort()) {
  const info = countries[code];
  if (!info.timezones.length) continue;
  let allowed = info.timezones.slice();

  // For countries with several zones, keep only zones that real cities (1,000+ people) fall into.
  const everyCity = byCountry[code] || [];
  const lookedUp = allowed.length > 1 ? everyCity.map((c) => {
    let tz = null;
    try { tz = tzlookup(c.loc.coordinates[1], c.loc.coordinates[0]); } catch (e) { /* ignore */ }
    const sig = tz && signature(tz);
    return { c, sig, match: sig ? allowed.find((a) => signature(a) === sig) : undefined };
  }) : [];
  if (allowed.length > 1) {
    // Border towns can be misread by the coarse lookup, so a zone needs real support:
    // at least 12 cities, or at least 3 cities and 0.5% of the country's cities.
    const counts = {};
    lookedUp.forEach((r) => { if (r.match) counts[r.match] = (counts[r.match] || 0) + 1; });
    const total = lookedUp.length || 1;
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    const used = new Set(Object.keys(counts).filter((z) => z === top || counts[z] >= 12 || (counts[z] >= 3 && counts[z] / total >= 0.005)));
    if (used.size >= 1) allowed = allowed.filter((a) => used.has(a));
  }
  const multi = allowed.length > 1;
  const entry = { c: code, n: info.name, tz: allowed };
  countryOut.push(entry);

  if (code === 'MM') { entry.k = 1; write(code, allowed, buildMM()); continue; }
  if (!multi) {
    const list = everyCity.filter((c) => c.population >= MIN_POP).sort((a, b) => b.population - a.population).slice(0, MAX_SINGLE)
      .map((c) => [c.name, /^[A-Z]{2,3}$/.test(c.adminCode) ? c.adminCode : '', 0, c.altName ? c.altName.split(',').slice(0, 3).join(' ') : '', +c.loc.coordinates[1].toFixed(2), +c.loc.coordinates[0].toFixed(2)]);
    if (list.length) { entry.k = 1; write(code, allowed, list); }
    continue;
  }

  const good = lookedUp.filter((r) => r.match && allowed.includes(r.match));
  const nearest = (r) => {
    let best = null, bd = Infinity;
    for (const g of good) {
      const dx = g.c.loc.coordinates[0] - r.c.loc.coordinates[0], dy = g.c.loc.coordinates[1] - r.c.loc.coordinates[1];
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = g.match; }
    }
    return best || allowed[0];
  };
  let fallbacks = 0;
  const entries = lookedUp
    .filter((r) => r.c.population >= MIN_POP)
    .sort((a, b) => b.c.population - a.c.population)
    .map((r) => {
      let tz = r.match && allowed.includes(r.match) ? r.match : null;
      if (!tz) { tz = nearest(r); fallbacks++; }
      (zoneCities[tz] = zoneCities[tz] || []).push([r.c.name, r.c.population]);
      const admin = /^[A-Z]{2,3}$/.test(r.c.adminCode) ? r.c.adminCode : '';
      return [r.c.name, admin, allowed.indexOf(tz), '', +r.c.loc.coordinates[1].toFixed(2), +r.c.loc.coordinates[0].toFixed(2)];
    });
  entry.k = 1; // k = this country has a city file to load
  if (fallbacks) console.log(code + ': ' + fallbacks + ' of ' + entries.length + ' cities needed nearest-neighbour zone');
  write(code, allowed, entries);
}

function write(code, tz, entries) {
  const body = 'window.Soulprint=window.Soulprint||{};(Soulprint.cityData=Soulprint.cityData||{})[' + JSON.stringify(code) + ']=' + JSON.stringify(entries) + ';\n';
  fs.writeFileSync(path.join(OUT, 'cities', code + '.js'), body);
}

// "e.g. Chicago, Dallas" hints so people can recognise their zone in a list.
const hints = {};
for (const tz of Object.keys(zoneCities)) {
  hints[tz] = zoneCities[tz].sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => x[0]).join(', ');
}

// Zones that older phones may not know by their newest name.
const bad = [];
for (const c of countryOut) for (const tz of c.tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); } catch (e) { bad.push(tz); } }
if (bad.length) console.warn('Time zones this Node cannot format:', bad.join(', '));

fs.writeFileSync(path.join(OUT, 'countries.js'),
  'window.Soulprint=window.Soulprint||{};Soulprint.countries=' + JSON.stringify(countryOut) + ';Soulprint.zoneHints=' + JSON.stringify(hints) + ';\n');
const sizes = fs.readdirSync(path.join(OUT, 'cities')).map((f) => fs.statSync(path.join(OUT, 'cities', f)).size);
console.log('countries:', countryOut.length, '| city files:', sizes.length, '| total city bytes:', sizes.reduce((a, b) => a + b, 0), '| biggest:', Math.max(...sizes));
