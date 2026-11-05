/* Draws the Birth Chart wheel as an SVG picture. Ascendant on the left, signs running anticlockwise.
   Uses the small glyph font in fonts/astro-glyphs.woff2 (Noto Sans Symbols, SIL Open Font License). */
(function () {
  'use strict';
  var S = window.Soulprint = window.Soulprint || {};
  var A = S.astro;

  var SIGN_CHARS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var CHARS = { moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅',
                neptune: '♆', pluto: '♇', northNode: '☊', chiron: '⚷', juno: '⚵', lilith: '⚸' };
  var ELEMENT = ['fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water', 'fire', 'earth', 'air', 'water'];
  var SIGN_FILL = { fire: '#f1e2b8', earth: '#e3e8cf', air: '#f4eee0', water: '#d6e0c6' };
  var INK = '#343724', GOLD = '#b8933a', MUTED = '#6f7655';

  var CX = 300, CY = 300;
  var R_OUT = 285, R_SIGN = 240, R_TICK = 232, R_GLYPH = 204, R_DEG = 178, R_HOUSE = 158, R_HNUM = 148, R_INNER = 136;

  function rad(d) { return d * Math.PI / 180; }
  function norm(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function f(n) { return (Math.round(n * 100) / 100).toString(); }

  // Position on the wheel for a longitude: Ascendant sits at 9 o'clock, signs run anticlockwise.
  function pos(lon, asc, r) {
    var t = rad(180 + (lon - asc));
    return { x: CX + r * Math.cos(t), y: CY - r * Math.sin(t) };
  }
  function line(a, b, extra) { return '<line x1="' + f(a.x) + '" y1="' + f(a.y) + '" x2="' + f(b.x) + '" y2="' + f(b.y) + '" ' + (extra || '') + '/>'; }

  function sector(i, asc) {
    var l0 = i * 30, l1 = l0 + 30;
    var o0 = pos(l0, asc, R_OUT), o1 = pos(l1, asc, R_OUT), i0 = pos(l0, asc, R_SIGN), i1 = pos(l1, asc, R_SIGN);
    return '<path d="M' + f(o0.x) + ' ' + f(o0.y) + ' A' + R_OUT + ' ' + R_OUT + ' 0 0 0 ' + f(o1.x) + ' ' + f(o1.y) +
      ' L' + f(i1.x) + ' ' + f(i1.y) + ' A' + R_SIGN + ' ' + R_SIGN + ' 0 0 1 ' + f(i0.x) + ' ' + f(i0.y) + ' Z" fill="' + SIGN_FILL[ELEMENT[i]] +
      '" stroke="' + GOLD + '" stroke-width="1"/>';
  }

  // Glyph as SVG. The Sun and the Part of Fortune are drawn as shapes, the rest use the glyph font.
  function glyphSvg(key, x, y, size, color) {
    color = color || INK;
    if (key === 'sun') {
      return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(size * 0.36) + '" fill="none" stroke="' + color + '" stroke-width="' + f(size * 0.075) + '"/>' +
             '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(size * 0.075) + '" fill="' + color + '"/>';
    }
    if (key === 'fortune') {
      var r = size * 0.34, d = r * 0.72;
      return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="none" stroke="' + color + '" stroke-width="' + f(size * 0.075) + '"/>' +
             '<path d="M' + f(x - d) + ' ' + f(y - d) + 'L' + f(x + d) + ' ' + f(y + d) + 'M' + f(x - d) + ' ' + f(y + d) + 'L' + f(x + d) + ' ' + f(y - d) +
             '" stroke="' + color + '" stroke-width="' + f(size * 0.075) + '" stroke-linecap="round"/>';
    }
    if (key === 'vertex') return '<text x="' + f(x) + '" y="' + f(y) + '" dy=".35em" text-anchor="middle" font-size="' + f(size * 0.62) + '" font-weight="700" fill="' + color + '" font-family="DM Sans, sans-serif">Vx</text>';
    if (key === 'asc') return '<text x="' + f(x) + '" y="' + f(y) + '" dy=".35em" text-anchor="middle" font-size="' + f(size * 0.62) + '" font-weight="700" fill="' + color + '" font-family="DM Sans, sans-serif">AC</text>';
    if (key === 'mc') return '<text x="' + f(x) + '" y="' + f(y) + '" dy=".35em" text-anchor="middle" font-size="' + f(size * 0.62) + '" font-weight="700" fill="' + color + '" font-family="DM Sans, sans-serif">MC</text>';
    return '<text x="' + f(x) + '" y="' + f(y) + '" dy=".35em" text-anchor="middle" font-size="' + f(size) + '" fill="' + color + '" font-family="AstroGlyphs, serif">' + CHARS[key] + '︎</text>';
  }

  // The same glyphs as a small inline picture for the table (em-sized so it lines up with text)
  function glyphHtml(key) {
    if (key === 'sun' || key === 'fortune' || key === 'vertex' || key === 'asc' || key === 'mc') {
      return '<svg class="gl-ico" viewBox="-12 -12 24 24" width="1.3em" height="1.3em" aria-hidden="true">' + glyphSvg(key, 0, 0, 24, 'currentColor') + '</svg>';
    }
    return '<span class="gl-txt" aria-hidden="true">' + CHARS[key] + '︎</span>';
  }
  function signGlyphHtml(i) { return '<span class="gl-txt" aria-hidden="true">' + SIGN_CHARS[i] + '︎</span>'; }

  // Pushes glyphs apart so they do not sit on top of each other (the true position still shows on the tick ring)
  function spread(list, minGap) {
    var n = list.length;
    if (n < 2) return;
    list.sort(function (a, b) { return a.lon - b.lon; });
    list.forEach(function (p) { p.disp = p.lon; });
    for (var it = 0; it < 120; it++) {
      var moved = false;
      for (var i = 0; i < n; i++) {
        var j = (i + 1) % n, gap = norm(list[j].disp - list[i].disp);
        if (gap < minGap) { var push = (minGap - gap) / 2 + 0.01; list[i].disp -= push; list[j].disp += push; moved = true; }
      }
      if (!moved) break;
    }
  }

  var ASPECT_STYLE = {
    trine: { color: '#5f7a4a', dash: '' },
    sextile: { color: '#7f9a68', dash: '5 4' },
    square: { color: '#b4532f', dash: '' },
    opposition: { color: '#b4532f', dash: '' },
    conjunction: null
  };

  function render(chart, system) {
    var asc = chart.asc, cusps = chart.cusps[system] || chart.cusps.W;
    var out = [];
    out.push('<svg class="astro-wheel" viewBox="-35 -35 670 670" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Birth chart wheel">');
    out.push('<defs><radialGradient id="wheelCore" cx="50%" cy="50%" r="60%"><stop offset="0%" stop-color="#fffdf9"/><stop offset="100%" stop-color="#f3ece0"/></radialGradient>' +
             '<filter id="wheelShadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#343724" flood-opacity="0.18"/></filter></defs>');
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R_OUT + '" fill="#fffdf9" filter="url(#wheelShadow)"/>');

    // signs
    for (var i = 0; i < 12; i++) out.push(sector(i, asc));
    for (i = 0; i < 12; i++) {
      var m = pos(i * 30 + 15, asc, (R_OUT + R_SIGN) / 2);
      out.push('<text x="' + f(m.x) + '" y="' + f(m.y) + '" dy=".35em" text-anchor="middle" font-size="27" fill="' + INK + '" font-family="AstroGlyphs, serif">' + SIGN_CHARS[i] + '︎</text>');
    }
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R_SIGN + '" fill="url(#wheelCore)" stroke="' + GOLD + '" stroke-width="1.2"/>');

    // degree ticks
    var ticks = '';
    for (var d = 0; d < 360; d++) {
      var len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3.2;
      var a = pos(d, asc, R_SIGN), b = pos(d, asc, R_SIGN - len);
      ticks += 'M' + f(a.x) + ' ' + f(a.y) + 'L' + f(b.x) + ' ' + f(b.y);
    }
    out.push('<path d="' + ticks + '" stroke="' + GOLD + '" stroke-width="0.8" opacity="0.8" fill="none"/>');

    // house lines and numbers
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R_HOUSE + '" fill="none" stroke="' + GOLD + '" stroke-width="0.8" opacity="0.7"/>');
    out.push('<circle cx="' + CX + '" cy="' + CY + '" r="' + R_INNER + '" fill="#fffdf9" stroke="' + GOLD + '" stroke-width="1"/>');
    for (i = 1; i <= 12; i++) {
      var angular = (i === 1 || i === 4 || i === 7 || i === 10) && system === 'P';
      out.push(line(pos(cusps[i], asc, R_INNER), pos(cusps[i], asc, R_SIGN), 'stroke="' + (angular ? INK : MUTED) + '" stroke-width="' + (angular ? 1.4 : 0.8) + '" opacity="' + (angular ? 0.8 : 0.5) + '"'));
      var next = cusps[i % 12 + 1], width = norm(next - cusps[i]) || 360;
      var h = pos(cusps[i] + width / 2, asc, R_HNUM);
      out.push('<text x="' + f(h.x) + '" y="' + f(h.y) + '" dy=".35em" text-anchor="middle" font-size="12" fill="' + MUTED + '" font-family="DM Sans, sans-serif">' + i + '</text>');
    }

    // aspect lines
    var byKey = {};
    chart.points.forEach(function (p) { byKey[p.key] = p; });
    chart.aspects.forEach(function (as) {
      var st = ASPECT_STYLE[as.type];
      if (!st) return;
      var w = Math.max(0.7, 1.9 - as.orb * 0.16);
      out.push(line(pos(byKey[as.a].lon, asc, R_INNER - 2), pos(byKey[as.b].lon, asc, R_INNER - 2),
        'stroke="' + st.color + '" stroke-width="' + f(w) + '" opacity="0.8"' + (st.dash ? ' stroke-dasharray="' + st.dash + '"' : '') + ' stroke-linecap="round"'));
    });

    // angle markers (Ascendant on the left, Midheaven on top for most places)
    [['asc', 'AC', chart.asc], ['mc', 'MC', chart.mc], ['dsc', 'DC', norm(chart.asc + 180)], ['ic', 'IC', norm(chart.mc + 180)]].forEach(function (an) {
      var p0 = pos(an[2], asc, R_SIGN), p1 = pos(an[2], asc, R_OUT + 6), lab = pos(an[2], asc, R_OUT + 19);
      out.push(line(p0, p1, 'stroke="' + INK + '" stroke-width="1.6"'));
      out.push('<text x="' + f(lab.x) + '" y="' + f(lab.y) + '" dy=".35em" text-anchor="middle" font-size="12.5" font-weight="700" fill="' + INK + '" font-family="DM Sans, sans-serif">' + an[1] + '</text>');
    });

    // planets and points
    var plot = chart.points.filter(function (p) { return p.key !== 'asc' && p.key !== 'mc'; }).map(function (p) { return { p: p, lon: p.lon }; });
    spread(plot, 8.6);
    plot.forEach(function (it) {
      var p = it.p, g = pos(it.disp, asc, R_GLYPH), t = pos(it.disp, asc, R_DEG);
      var tickA = pos(p.lon, asc, R_SIGN - 1), tickB = pos(p.lon, asc, R_SIGN - 12);
      out.push(line(tickA, tickB, 'stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round"'));
      if (Math.abs(it.disp - p.lon) > 0.5) out.push(line(pos(p.lon, asc, R_SIGN - 12), pos(it.disp, asc, R_GLYPH + 15), 'stroke="' + GOLD + '" stroke-width="0.7" opacity="0.8"'));
      out.push(glyphSvg(p.key, g.x, g.y, 27, INK));
      out.push('<text x="' + f(t.x) + '" y="' + f(t.y) + '" dy=".35em" text-anchor="middle" font-size="11.5" fill="' + INK + '" font-family="DM Sans, sans-serif">' + p.degree + '°' + (p.retrograde ? '<tspan fill="#b4532f" font-weight="700" dx="1">R</tspan>' : '') + '</text>');
    });

    out.push('</svg>');
    return out.join('');
  }

  S.wheel = { render: render, glyphHtml: glyphHtml, signGlyphHtml: signGlyphHtml, SIGN_CHARS: SIGN_CHARS };
}());
