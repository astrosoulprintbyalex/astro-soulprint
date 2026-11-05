/* Cosmic Weather: the sky maths for one week.
   Uses the astronomy-engine library already on the site (soulprint-chart/js/vendor/astronomy.browser.min.js).
   Works in the browser (window.CosmicSky) and in Node (require) so it can be tested.
   Everything is the tropical zodiac, and the week runs Monday to Sunday in Myanmar Time (UTC+6:30). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CosmicSky = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HOUR = 3600000, DAY = 86400000;
  var MMT = 6.5 * HOUR; // Myanmar Time is a fixed UTC+6:30 (no daylight saving)

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var SLOW = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']; // can turn retrograde (Venus and Mars too)
  var MOVERS = ['Sun'].concat(SLOW);

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function signOf(lon) { return Math.floor(norm360(lon) / 30) % 12; }

  /* ---------- Myanmar Time helpers ---------- */
  // Calendar parts of a moment as seen on a Myanmar clock.
  function mmt(ms) {
    var d = new Date(ms + MMT);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
  }
  // The Monday 00:00 (Myanmar Time) that starts the week containing "ms", and the next Monday 00:00.
  function weekBounds(ms) {
    var shifted = ms + MMT;
    var dayStart = Math.floor(shifted / DAY) * DAY;
    var dow = new Date(dayStart).getUTCDay();            // 0 = Sunday
    var sinceMonday = (dow + 6) % 7;
    var start = dayStart - sinceMonday * DAY - MMT;
    return { start: start, end: start + 7 * DAY };
  }

  /* ---------- Positions ---------- */
  function makeSky(A) {
    function lon(body, ms) { return norm360(A.Ecliptic(A.GeoVector(body, new Date(ms), true)).elon); }
    // Speed in degrees per day (negative = retrograde), from a short look either side.
    function speed(body, ms) {
      var h = 3 * HOUR, d = lon(body, ms + h) - lon(body, ms - h);
      if (d > 180) d -= 360; if (d < -180) d += 360;
      return d / (2 * h / DAY);
    }
    // Find the moment between a and b (where f changes from false to true) to about a minute.
    function bisect(a, b, changed) {
      var lo = a, hi = b;
      while (hi - lo > 30000) { var mid = (lo + hi) / 2; if (changed(mid)) hi = mid; else lo = mid; }
      return Math.round((lo + hi) / 2);
    }

    // Every time a body enters a new sign inside the window.
    function ingresses(body, from, to, step) {
      var out = [], prev = signOf(lon(body, from)), t = from;
      while (t < to) {
        var next = Math.min(t + step, to), s = signOf(lon(body, next));
        if (s !== prev) {
          var p = prev;
          var at = bisect(t, next, function (x) { return signOf(lon(body, x)) !== p; });
          out.push({ body: body, sign: s, from: p, time: at, retro: speed(body, at) < 0 });
          prev = s;
        }
        t = next;
      }
      return out;
    }

    // Every time a planet stations (turns retrograde or direct) inside the window.
    function stations(body, from, to) {
      var out = [], step = 12 * HOUR, t = from, prev = speed(body, from) < 0;
      while (t < to) {
        var next = Math.min(t + step, to), r = speed(body, next) < 0;
        if (r !== prev) {
          var p = prev;
          var at = bisect(t, next, function (x) { return (speed(body, x) < 0) !== p; });
          out.push({ body: body, kind: r ? 'retrograde' : 'direct', time: at, sign: signOf(lon(body, at)), degree: Math.floor(lon(body, at) % 30) });
          prev = r;
        }
        t = next;
      }
      return out;
    }

    // New / First Quarter / Full / Last Quarter inside the window, flagged if an eclipse happens with it.
    function phases(from, to) {
      var out = [], q = A.SearchMoonQuarter(new Date(from - 1000)), guard = 0;
      while (q.time.date.getTime() < to && guard++ < 8) {
        var ms = q.time.date.getTime();
        if (ms >= from) {
          var ph = { quarter: q.quarter, time: ms, sign: signOf(lon('Moon', ms)), degree: Math.floor(lon('Moon', ms) % 30), eclipse: null };
          if (q.quarter === 0) {
            var se = A.SearchGlobalSolarEclipse(new Date(ms - 2 * DAY));
            if (se && Math.abs(se.peak.date.getTime() - ms) < DAY) ph.eclipse = { type: 'solar', kind: se.kind };
          } else if (q.quarter === 2) {
            var le = A.SearchLunarEclipse(new Date(ms - 2 * DAY));
            if (le && Math.abs(le.peak.date.getTime() - ms) < DAY) ph.eclipse = { type: 'lunar', kind: le.kind };
          }
          out.push(ph);
        }
        q = A.NextMoonQuarter(q);
      }
      return out;
    }

    // Where the Moon is through the window: [{sign, from, to}, ...]
    function moonSegments(from, to) {
      var moves = ingresses('Moon', from, to, 3 * HOUR), segs = [], cur = { sign: signOf(lon('Moon', from)), from: from, startsBeforeWeek: true };
      moves.forEach(function (m) { cur.to = m.time; segs.push(cur); cur = { sign: m.sign, from: m.time, startsBeforeWeek: false }; });
      cur.to = to; segs.push(cur);
      return segs;
    }

    // Planets that are retrograde at a given moment.
    function retrogradeNow(ms) { return SLOW.filter(function (b) { return speed(b, ms) < 0; }); }

    // Phase name for "the Moon right now".
    function moonNow(ms) {
      var angle = A.MoonPhase(new Date(ms)); // 0 new, 90 first quarter, 180 full, 270 last quarter
      var lit = A.Illumination('Moon', new Date(ms)).phase_fraction;
      var name = angle < 22.5 || angle >= 337.5 ? 'new' : angle < 67.5 ? 'waxingCrescent' : angle < 112.5 ? 'firstQuarter' : angle < 157.5 ? 'waxingGibbous'
        : angle < 202.5 ? 'full' : angle < 247.5 ? 'waningGibbous' : angle < 292.5 ? 'lastQuarter' : 'waningCrescent';
      return { name: name, lit: Math.round(lit * 100), sign: signOf(lon('Moon', ms)) };
    }

    // Everything for the week containing "ms".
    function week(ms) {
      var b = weekBounds(ms), from = b.start, to = b.end, planetMoves = [];
      MOVERS.forEach(function (body) { planetMoves = planetMoves.concat(ingresses(body, from, to, DAY / 2)); });
      var st = [];
      SLOW.forEach(function (body) { st = st.concat(stations(body, from, to)); });
      return {
        start: from, end: to,
        phases: phases(from, to),
        ingresses: planetMoves,
        stations: st,
        moon: moonSegments(from, to),
        moonNow: moonNow(Math.min(Math.max(ms, from), to - 1)),
        retrograde: retrogradeNow(Math.min(Math.max(ms, from), to - 1))
      };
    }

    return { lon: lon, speed: speed, week: week, ingresses: ingresses, stations: stations, phases: phases, moonSegments: moonSegments };
  }

  return { SIGNS: SIGNS, SLOW: SLOW, MOVERS: MOVERS, mmt: mmt, weekBounds: weekBounds, makeSky: makeSky, MMT: MMT, DAY: DAY, HOUR: HOUR };
}));
