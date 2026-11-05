/* Birth Chart (Western astrology) calculation.
   This file only does the maths on top of the Swiss Ephemeris (https://www.astro.com/swisseph/), which is passed in
   from js/astro-loader.js. It has no network calls of its own.
   Works in the browser (window.Soulprint.astro) and in Node (require), so the tests can run it too. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.Soulprint = root.Soulprint || {}; root.Soulprint.astro = factory(); }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Swiss Ephemeris body numbers
  var SE = { SUN: 0, MOON: 1, MERCURY: 2, VENUS: 3, MARS: 4, JUPITER: 5, SATURN: 6, URANUS: 7, NEPTUNE: 8, PLUTO: 9,
             MEAN_NODE: 10, MEAN_APOGEE: 12, CHIRON: 15, JUNO: 19 };
  var FLAGS = 2 | 256; // Swiss Ephemeris files + speed (needed for retrograde)

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  // Points in the order they are shown. `se` = Swiss Ephemeris body, `kind` tells how to read the result.
  var POINTS = [
    { key: 'sun', name: 'Sun', se: SE.SUN, retro: true },
    { key: 'moon', name: 'Moon', se: SE.MOON, retro: true },
    { key: 'mercury', name: 'Mercury', se: SE.MERCURY, retro: true },
    { key: 'venus', name: 'Venus', se: SE.VENUS, retro: true },
    { key: 'mars', name: 'Mars', se: SE.MARS, retro: true },
    { key: 'jupiter', name: 'Jupiter', se: SE.JUPITER, retro: true },
    { key: 'saturn', name: 'Saturn', se: SE.SATURN, retro: true },
    { key: 'uranus', name: 'Uranus', se: SE.URANUS, retro: true },
    { key: 'neptune', name: 'Neptune', se: SE.NEPTUNE, retro: true },
    { key: 'pluto', name: 'Pluto', se: SE.PLUTO, retro: true },
    { key: 'northNode', name: 'North Node', se: SE.MEAN_NODE, retro: false },
    { key: 'fortune', name: 'Part of Fortune', calc: 'fortune', retro: false },
    { key: 'juno', name: 'Juno', se: SE.JUNO, retro: true },
    { key: 'chiron', name: 'Chiron', se: SE.CHIRON, retro: true },
    { key: 'vertex', name: 'Vertex', calc: 'vertex', retro: false },
    { key: 'lilith', name: 'Lilith (Black Moon, mean)', se: SE.MEAN_APOGEE, retro: false },
    { key: 'asc', name: 'Ascendant (Rising)', calc: 'asc', retro: false },
    { key: 'mc', name: 'Midheaven (MC)', calc: 'mc', retro: false }
  ];

  // The five major aspects and how wide we look (degrees). Aspects to the Ascendant and Midheaven use at most 5.
  var ASPECTS = [
    { key: 'conjunction', name: 'Conjunction', angle: 0, orb: 8 },
    { key: 'sextile', name: 'Sextile', angle: 60, orb: 5 },
    { key: 'square', name: 'Square', angle: 90, orb: 7 },
    { key: 'trine', name: 'Trine', angle: 120, orb: 7 },
    { key: 'opposition', name: 'Opposition', angle: 180, orb: 8 }
  ];
  var ASPECT_POINTS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
                       'northNode', 'chiron', 'asc', 'mc'];
  var ANGLE_ORB_CAP = 5;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  // Placidus cannot be worked out near the poles (the Sun never rises or sets there).
  function placidusPossible(lat) { return Math.abs(lat) < 66.5; }

  function jdFromUtcMs(ms) { return ms / 86400000 + 2440587.5; }

  // Splits a longitude into sign, whole degree and whole minute (truncated, like astro.com shows them).
  function split(lon) {
    var within = lon - Math.floor(lon / 30) * 30;
    var deg = Math.floor(within);
    var min = Math.floor((within - deg) * 60);
    return { sign: Math.floor(lon / 30) % 12, degree: deg, minute: min };
  }

  function wholeSignCusps(asc) {
    var base = Math.floor(asc / 30) * 30, c = [null];
    for (var i = 0; i < 12; i++) c.push(norm360(base + 30 * i));
    return c;
  }

  function houseOf(lon, cusps) {
    for (var i = 1; i <= 12; i++) {
      var start = cusps[i], end = cusps[i % 12 + 1];
      var width = norm360(end - start);
      if (width === 0) width = 360;
      if (norm360(lon - start) < width) return i;
    }
    return 12;
  }

  // Sun above the horizon (houses 7-12) means a day chart.
  function isDayChart(sun, asc) { return norm360(sun - asc) >= 180; }

  function fortune(asc, sun, moon, day) {
    return norm360(day ? asc + moon - sun : asc + sun - moon);
  }

  function angularDistance(a, b) { var d = Math.abs(norm360(a) - norm360(b)); return d > 180 ? 360 - d : d; }

  function findAspects(points) {
    var byKey = {}, out = [];
    points.forEach(function (p) { byKey[p.key] = p; });
    for (var i = 0; i < ASPECT_POINTS.length; i++) {
      for (var j = i + 1; j < ASPECT_POINTS.length; j++) {
        var ka = ASPECT_POINTS[i], kb = ASPECT_POINTS[j];
        if ((ka === 'asc' && kb === 'mc') || (ka === 'mc' && kb === 'asc')) continue;
        var d = angularDistance(byKey[ka].lon, byKey[kb].lon);
        var touchesAngle = ka === 'asc' || ka === 'mc' || kb === 'asc' || kb === 'mc';
        for (var k = 0; k < ASPECTS.length; k++) {
          var asp = ASPECTS[k];
          var orb = Math.abs(d - asp.angle);
          var limit = touchesAngle ? Math.min(asp.orb, ANGLE_ORB_CAP) : asp.orb;
          if (orb <= limit) { out.push({ a: ka, b: kb, type: asp.key, name: asp.name, angle: asp.angle, orb: orb }); break; }
        }
      }
    }
    out.sort(function (x, y) { return x.orb - y.orb; });
    return out;
  }

  /* Works out a whole chart.
     swe   = a ready Swiss Ephemeris object (calculatePosition, calculateHouses)
     input = { utcMs, lat, lon }  (lat/lon in degrees, east and north positive)
     Returns both house systems, so the page can switch without calculating again. */
  function calculate(swe, input) {
    var jd = jdFromUtcMs(input.utcMs);
    var lat = input.lat, lon = input.lon;

    var raw = {};
    POINTS.forEach(function (p) {
      if (p.se === undefined) return;
      var r = swe.calculatePosition(jd, p.se, FLAGS);
      raw[p.key] = { lon: norm360(r.longitude), speed: r.longitudeSpeed };
    });

    var hw = swe.calculateHouses(jd, lat, lon, 'W');
    var asc = norm360(hw.ascendant), mc = norm360(hw.mc), vertex = norm360(hw.vertex);
    var placidusOk = placidusPossible(lat);
    var placidusCusps = null;
    if (placidusOk) {
      var hp = swe.calculateHouses(jd, lat, lon, 'P');
      placidusCusps = hp.cusps.map(function (c, i) { return i === 0 ? null : norm360(c); });
    }
    var cusps = { W: wholeSignCusps(asc), P: placidusCusps };

    var day = isDayChart(raw.sun.lon, asc);
    var pof = fortune(asc, raw.sun.lon, raw.moon.lon, day);

    var points = POINTS.map(function (def) {
      var p = { key: def.key, name: def.name }, lonDeg;
      if (def.calc === 'asc') lonDeg = asc;
      else if (def.calc === 'mc') lonDeg = mc;
      else if (def.calc === 'vertex') lonDeg = vertex;
      else if (def.calc === 'fortune') lonDeg = pof;
      else lonDeg = raw[def.key].lon;
      p.lon = lonDeg;
      var s = split(lonDeg);
      p.sign = s.sign; p.degree = s.degree; p.minute = s.minute;
      p.speed = raw[def.key] ? raw[def.key].speed : null;
      // Retrograde is only meaningful for the planets, Chiron and Juno. Nodes, Lilith and the calculated points show no status.
      p.retrograde = def.retro ? raw[def.key].speed < 0 : null;
      p.houses = { W: houseOf(lonDeg, cusps.W), P: placidusCusps ? houseOf(lonDeg, placidusCusps) : null };
      return p;
    });

    return {
      jd: jd, lat: lat, lon: lon,
      isDay: day,
      placidusAvailable: placidusOk,
      cusps: cusps,
      asc: asc, mc: mc, vertex: vertex,
      points: points,
      aspects: findAspects(points)
    };
  }

  function format(p) {
    return p.degree + '°' + (p.minute < 10 ? '0' : '') + p.minute + '′';
  }

  return {
    SIGNS: SIGNS, POINTS: POINTS, ASPECTS: ASPECTS, FLAGS: FLAGS,
    calculate: calculate, split: split, houseOf: houseOf, wholeSignCusps: wholeSignCusps, isDayChart: isDayChart,
    fortune: fortune, findAspects: findAspects, jdFromUtcMs: jdFromUtcMs, placidusPossible: placidusPossible,
    angularDistance: angularDistance, format: format
  };
}));
