/* Daily transit maths for the private transit card maker.
   Uses the same astronomy library as the Human Design chart (soulprint-chart/js/vendor).
   All longitudes are tropical (ecliptic of date). Works in the browser and in Node (tests). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../soulprint-chart/js/vendor/astronomy.browser.min.js'));
  else root.Transit = factory(root.Astronomy);
})(typeof self !== 'undefined' ? self : this, function (Astronomy) {
  'use strict';

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  // Moon is handled separately (it changes sign every ~2.5 days). Sun is included for its monthly ingress.
  var BODIES = ['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  var HOUR = 3600e3, DAY = 86400e3;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function wrap180(x) { x = norm360(x); return x > 180 ? x - 360 : x; }

  function longitude(body, date) {
    if (body === 'Sun') return norm360(Astronomy.SunPosition(date).elon);
    if (body === 'Moon') return norm360(Astronomy.EclipticGeoMoon(date).lon);
    return norm360(Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon);
  }
  // Apparent daily-ish motion: negative = retrograde.
  function motion(body, ms) {
    return wrap180(longitude(body, new Date(ms + HOUR)) - longitude(body, new Date(ms - HOUR)));
  }
  function signIndex(lon) { return Math.floor(norm360(lon) / 30) % 12; }
  function position(body, date) {
    var lon = longitude(body, date), within = lon % 30;
    return { lon: lon, sign: SIGNS[signIndex(lon)], deg: Math.floor(within), min: Math.floor((within - Math.floor(within)) * 60) };
  }
  function isRetrograde(body, date) {
    return body !== 'Sun' && body !== 'Moon' && motion(body, date.getTime()) < 0;
  }

  // Find the instant (to ~1 minute) when predicate flips between ms0 (false) and ms1 (true).
  function bisect(f, ms0, ms1) {
    while (ms1 - ms0 > 30e3) {
      var mid = Math.floor((ms0 + ms1) / 2);
      if (f(mid)) ms1 = mid; else ms0 = mid;
    }
    return new Date(ms1);
  }

  /* Sign changes and stations for each planet between from (inclusive) and to (exclusive). */
  function events(fromDate, toDate) {
    var out = [], from = fromDate.getTime(), to = toDate.getTime(), step = 6 * HOUR;
    BODIES.forEach(function (body) {
      var prevT = from, prevSign = signIndex(longitude(body, new Date(from)));
      var prevRx = body !== 'Sun' ? motion(body, from) < 0 : false;
      for (var t = from + step; ; t += step) {
        var cur = Math.min(t, to), sgn = signIndex(longitude(body, new Date(cur)));
        if (sgn !== prevSign) {
          var a = prevT, s0 = prevSign;
          var when = bisect(function (ms) { return signIndex(longitude(body, new Date(ms))) !== s0; }, a, cur);
          var retro = body !== 'Sun' && motion(body, when.getTime()) < 0;
          out.push({ type: 'ingress', body: body, sign: SIGNS[sgn], from: SIGNS[prevSign], retro: retro, date: when });
        }
        if (body !== 'Sun') {
          var rx = motion(body, cur) < 0;
          if (rx !== prevRx) {
            var w = bisect(function (ms) { return (motion(body, ms) < 0) === rx; }, prevT, cur);
            var p = position(body, w);
            out.push({ type: rx ? 'station-retrograde' : 'station-direct', body: body, sign: p.sign, deg: p.deg, date: w });
          }
          prevRx = rx;
        }
        prevT = cur; prevSign = sgn;
        if (cur >= to) break;
      }
    });
    return out.sort(function (a, b) { return a.date - b.date; });
  }

  // Between the four quarters the Moon is crescent or gibbous; the quarter names are used only on the day they happen.
  var PHASE_BANDS = ['Waxing Crescent', 'Waxing Gibbous', 'Waning Gibbous', 'Waning Crescent'];
  var QUARTER_NAMES = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter'];

  /* Moon sign, phase and illumination at `date`. If an exact quarter (new/first/full/last) falls between
     dayStart and dayEnd, it is reported as `exact` and used as the phase name. */
  function moon(date, dayStart, dayEnd) {
    var pos = position('Moon', date);
    var angle = Astronomy.MoonPhase(date);                    // 0 new, 90 first quarter, 180 full, 270 last quarter
    var illum = Astronomy.Illumination('Moon', date).phase_fraction;
    var name = PHASE_BANDS[Math.floor(norm360(angle) / 90) % 4];
    var exact = null;
    var q = Astronomy.SearchMoonQuarter(new Date(dayStart.getTime() - 1000));
    if (q.time.date >= dayStart && q.time.date < dayEnd) {
      var mp = position('Moon', q.time.date);
      exact = { name: QUARTER_NAMES[q.quarter], date: q.time.date, sign: mp.sign, deg: mp.deg };
      name = exact.name;
    }
    // Moon sign change during the local day (shown as "enters X at HH:MM")
    var startSign = signIndex(longitude('Moon', dayStart)), endSign = signIndex(longitude('Moon', new Date(dayEnd.getTime() - 1)));
    var ingress = null;
    if (startSign !== endSign) {
      ingress = {
        sign: SIGNS[endSign],
        date: bisect(function (ms) { return signIndex(longitude('Moon', new Date(ms))) !== startSign; }, dayStart.getTime(), dayEnd.getTime())
      };
    }
    return { sign: pos.sign, deg: pos.deg, min: pos.min, lon: pos.lon, angle: angle, illumination: illum, phase: name, exact: exact, ingress: ingress };
  }

  /* Everything the card needs for a calendar date (y, m 1-12, d) in a timezone `offsetMin` minutes east of UTC.
     The Moon is read at local noon; the "week" is the 7 local days starting on that date. */
  function dailyCard(y, m, d, offsetMin) {
    var off = (offsetMin || 0) * 60e3;
    var dayStart = new Date(Date.UTC(y, m - 1, d) - off);
    var dayEnd = new Date(dayStart.getTime() + DAY);
    var noon = new Date(dayStart.getTime() + DAY / 2);
    var weekEnd = new Date(dayStart.getTime() + 7 * DAY);
    var retrogradeNow = BODIES.filter(function (b) { return isRetrograde(b, noon); });
    return {
      year: y, month: m, day: d, offsetMin: offsetMin || 0,
      dayStart: dayStart, weekEnd: weekEnd,
      moon: moon(noon, dayStart, dayEnd),
      events: events(dayStart, weekEnd),
      retrogradeNow: retrogradeNow
    };
  }

  return { SIGNS: SIGNS, BODIES: BODIES, longitude: longitude, motion: motion, position: position, isRetrograde: isRetrograde, events: events, moon: moon, dailyCard: dailyCard };
});
