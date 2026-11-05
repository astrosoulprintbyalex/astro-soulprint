/* Sun, Moon and Rising sign for the Reading Prep tool.
   Sun and Moon come straight from the Human Design chart engine (soulprint-chart/js/hd-calc.js), so the astrology and the
   Human Design chart always agree. The Rising sign (Ascendant) needs the birth latitude and longitude.
   Works in the browser (window.Soulprint.astro) and in Node (require). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../soulprint-chart/js/hd-calc.js'), require('../../soulprint-chart/js/vendor/astronomy.browser.min.js'));
  } else {
    root.Soulprint = root.Soulprint || {};
    root.Soulprint.astro = factory(root.Soulprint.calc, root.Astronomy);
  }
}(typeof self !== 'undefined' ? self : this, function (calc, Astronomy) {
  'use strict';

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var RAD = Math.PI / 180;

  function norm360(x) { x = x % 360; return x < 0 ? x + 360 : x; }

  // 123.456 degrees of ecliptic longitude -> Leo 3°27′
  function describe(lon) {
    lon = norm360(lon);
    var idx = Math.floor(lon / 30);
    var within = lon - idx * 30;
    var deg = Math.floor(within);
    var min = Math.floor((within - deg) * 60);
    return { lon: lon, sign: SIGNS[idx], signIndex: idx, degree: deg, minute: min, text: SIGNS[idx] + ' ' + deg + '°' + (min < 10 ? '0' : '') + min + '′' };
  }

  // Ascendant: the point of the zodiac rising on the eastern horizon at the birth place.
  // date: JS Date (the exact UTC moment of birth). lat: degrees north (south is negative). lon: degrees east (west is negative).
  function ascendantLongitude(date, lat, lon) {
    var t = Astronomy.MakeTime(date);
    var armc = norm360(Astronomy.SiderealTime(t) * 15 + lon) * RAD;   // local sidereal time as an angle
    var eps = Astronomy.e_tilt(t).tobl * RAD;                          // true tilt of the Earth's axis
    var phi = lat * RAD;
    var y = Math.cos(armc);
    var x = -(Math.sin(armc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
    return norm360(Math.atan2(y, x) / RAD);
  }

  // "16.81", "-33.87", "33.87 S", "96.16E" -> a number. N and E are positive, S and W negative. NaN when it cannot be read.
  function parseCoordinate(text, axis) {
    var m = /^\s*([+-]?\d+(?:[.,]\d+)?)\s*(?:\u00B0)?\s*([NSEWnsew])?\s*$/.exec(String(text));
    if (!m) return NaN;
    var v = parseFloat(m[1].replace(',', '.'));
    var h = m[2] ? m[2].toUpperCase() : '';
    if (h) {
      if ((axis === 'lat' && (h === 'E' || h === 'W')) || (axis === 'lon' && (h === 'N' || h === 'S'))) return NaN;
      if (v < 0) return NaN; // "-33.87 S" is ambiguous
      if (h === 'S' || h === 'W') v = -v;
    }
    var limit = axis === 'lat' ? 90 : 180;
    return Math.abs(v) <= limit ? v : NaN;
  }

  // Sun, Moon and Rising for an exact UTC moment (ms) at a place.
  function astrologyAt(birthMs, lat, lon) {
    var date = new Date(birthMs);
    var lons = calc.allLongitudes(date);
    var polar = Math.abs(lat) > 66;
    return {
      sun: describe(lons.sun),
      moon: describe(lons.moon),
      rising: describe(ascendantLongitude(date, lat, lon)),
      risingNote: polar ? 'Near the polar circles the Rising sign is unreliable. Confirm it in your astrology software.' : ''
    };
  }

  return { SIGNS: SIGNS, describe: describe, parseCoordinate: parseCoordinate, ascendantLongitude: ascendantLongitude, astrologyAt: astrologyAt };
}));
