/* Draws the 1080 x 1350 daily transit card on a canvas. Emerald, cream & gold, same tokens as style.css. */
(function (root) {
  'use strict';
  var W = 1080, H = 1350;
  var C = { emerald: '#2f7a5f', deep: '#245f4a', soft: '#e3efe8', mist: '#f0f6f2', cream: '#faf7f0', creamDeep: '#f3efe4',
            gold: '#b8975a', goldText: '#8a6b2f', ink: '#26352e', muted: '#5d6e65' };
  var SERIF = '"Cormorant Garamond", "Noto Serif Myanmar", Georgia, serif';
  var SANS = '"DM Sans", "Noto Sans Myanmar", system-ui, sans-serif';
  var MYANMAR = '"Noto Sans Myanmar", "DM Sans", system-ui, sans-serif';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var hasMyanmar = function (s) { return /[က-႟ꩠ-ꩿꧠ-꧿]/.test(s); };

  // Local calendar parts of an instant in a zone offset (minutes east of UTC).
  function local(date, off) { var d = new Date(date.getTime() + off * 60e3); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), wd: d.getUTCDay(), h: d.getUTCHours(), mi: d.getUTCMinutes() }; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function shortDate(date, off) { var l = local(date, off); return DAYS[l.wd].slice(0, 3) + ' ' + l.d + ' ' + MONTHS[l.m].slice(0, 3); }
  function clock(date, off) { var l = local(date, off); return pad(l.h) + ':' + pad(l.mi); }

  function spaced(ctx, text, x, y, spacing, align) {
    // Canvas letterSpacing is not everywhere yet: place letters ourselves.
    var w = 0, i, widths = [];
    for (i = 0; i < text.length; i++) { widths[i] = ctx.measureText(text[i]).width; w += widths[i] + (i < text.length - 1 ? spacing : 0); }
    var cx = align === 'center' ? x - w / 2 : x;
    ctx.textAlign = 'left';
    for (i = 0; i < text.length; i++) { ctx.fillText(text[i], cx, y); cx += widths[i] + spacing; }
  }
  function diamond(ctx, x, y, r, color) { ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function divider(ctx, y) {
    ctx.save(); ctx.strokeStyle = 'rgba(184,151,90,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(W / 2 - 24, y); ctx.moveTo(W / 2 + 24, y); ctx.lineTo(W - 150, y); ctx.stroke();
    ctx.restore(); diamond(ctx, W / 2, y, 7, C.gold);
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  // Break text into lines that fit maxW. Burmese has no spaces between words, so use the browser's word
  // segmenter when present, falling back to grapheme clusters (never splits a consonant from its marks).
  function wrap(ctx, text, maxW) {
    var lines = [];
    text.replace(/\r/g, '').split('\n').forEach(function (para) {
      if (!para.trim()) { lines.push(''); return; }
      var units;
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        var seg = new Intl.Segmenter(hasMyanmar(para) ? 'my' : undefined, { granularity: 'word' });
        units = Array.from(seg.segment(para), function (s) { return s.segment; });
      } else {
        units = para.split(/(\s+)/);
      }
      var line = '';
      function push() { lines.push(line.replace(/\s+$/, '')); line = ''; }
      units.forEach(function (u) {
        // closing punctuation (including the Burmese full stop) must never start a line: let it hang on the current one
        if (line && /^[\u104A\u104B.,!?;:\u2026)\]\u201D\u2019]+$/.test(u)) { line += u; return; }
        if (ctx.measureText(u).width > maxW) {   // a single unit wider than the line: split by grapheme
          if (line) push();
          var parts = typeof Intl !== 'undefined' && Intl.Segmenter ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(u), function (s) { return s.segment; }) : Array.from(u);
          parts.forEach(function (g) {
            if (ctx.measureText(line + g).width > maxW && line) push();
            line += g;
          });
          return;
        }
        if (ctx.measureText(line + u).width > maxW && line.trim()) push();
        line += (line === '' && /^\s+$/.test(u)) ? '' : u;
      });
      if (line) push();
    });
    return lines;
  }

  function drawMoon(ctx, cx, cy, r, angle, illum) {
    ctx.save();
    // dark disc with a soft rim
    var g = ctx.createRadialGradient(cx - r * .3, cy - r * .3, r * .1, cx, cy, r);
    g.addColorStop(0, '#2f7a5f'); g.addColorStop(1, '#1b4a39');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    // lit part
    var waxing = angle < 180, a = waxing ? angle : 360 - angle;           // 0..180 from new to full
    var k = Math.cos(a * Math.PI / 180), rx = Math.abs(k) * r;
    ctx.translate(cx, cy); if (!waxing) ctx.scale(-1, 1);
    var lit = ctx.createLinearGradient(-r, -r, r, r);
    lit.addColorStop(0, '#fffefb'); lit.addColorStop(1, '#ecd9a6');
    ctx.fillStyle = lit; ctx.beginPath();
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
    ctx.ellipse(0, 0, rx, r, 0, Math.PI / 2, -Math.PI / 2, a < 90);       // crescent: terminator bulges right; gibbous: left
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(cx, cy, r + 17, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }

  var NAMES = { 'station-retrograde': 'stations retrograde', 'station-direct': 'stations direct' };
  function eventText(e) {
    if (e.type === 'ingress') return e.body + ' enters ' + e.sign + (e.retro ? ' (retrograde)' : '');
    return e.body + ' ' + NAMES[e.type] + ' in ' + e.sign;
  }

  /* data = Transit.dailyCard(...), message = user text, logo = loaded Image or null */
  function render(canvas, data, message, logo) {
    var ctx = canvas.getContext('2d'), off = data.offsetMin;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);
    ctx.textBaseline = 'alphabetic';

    // emerald backdrop
    var bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, C.emerald); bg.addColorStop(1, C.deep);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // cream card with double gold frame
    var X = 54, Y = 54, CW = W - 108, CH = H - 108;
    ctx.fillStyle = C.cream; roundRect(ctx, X, Y, CW, CH, 36); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; roundRect(ctx, X + 16, Y + 16, CW - 32, CH - 32, 26); ctx.stroke();
    ctx.strokeStyle = 'rgba(184,151,90,.4)'; ctx.lineWidth = 1.5; roundRect(ctx, X + 26, Y + 26, CW - 52, CH - 52, 20); ctx.stroke();

    // header: logo, brand, date
    var y = 112;
    if (logo) {
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, y, 36, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logo, W / 2 - 36, y - 36, 72, 72); ctx.restore();
      ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, y, 39, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = C.goldText; ctx.font = '600 21px ' + SANS;
    spaced(ctx, 'ASTRO SOULPRINT BY ALEX', W / 2, y + 76, 5, 'center');

    // Cormorant's numerals are old-style ("10" looks like "IO"), so day and year are set in DM Sans beside the serif month.
    var L = local(data.dayStart, off);
    var parts = [[String(L.d), '500 62px ' + SANS], [MONTHS[L.m], '600 80px ' + SERIF], [String(L.y), '500 62px ' + SANS]], gap = 20, total = 0;
    parts.forEach(function (p) { ctx.font = p[1]; p[2] = ctx.measureText(p[0]).width; total += p[2]; });
    total += gap * 2;
    var dx = (W - total) / 2; ctx.textAlign = 'left'; ctx.fillStyle = C.deep;
    parts.forEach(function (p) { ctx.font = p[1]; ctx.fillText(p[0], dx, y + 160); dx += p[2] + gap; });
    ctx.fillStyle = C.emerald; ctx.font = '600 19px ' + SANS;
    spaced(ctx, DAYS[L.wd].toUpperCase() + '  \u00B7  DAILY TRANSIT', W / 2, y + 206, 6, 'center');

    divider(ctx, y + 240);

    // moon block
    var m = data.moon, my = y + 350, mr = 88;
    drawMoon(ctx, 262, my, mr, m.angle, m.illumination);
    var tx = 410;
    ctx.textAlign = 'left'; ctx.fillStyle = C.goldText; ctx.font = '600 20px ' + SANS;
    spaced(ctx, 'THE MOON IN', tx, my - 60, 5, 'left');
    ctx.fillStyle = C.deep; ctx.font = '600 80px ' + SERIF;
    ctx.fillText(m.sign, tx, my + 12);
    var wd = ctx.measureText(m.sign).width;
    ctx.fillStyle = C.goldText; ctx.font = '500 30px ' + SANS;   // sans: Cormorant numerals are old-style
    ctx.fillText(m.deg + '\u00B0', tx + wd + 16, my + 12);
    ctx.fillStyle = C.ink; ctx.font = '500 30px ' + SANS;
    var pct = Math.round(m.illumination * 100);
    ctx.fillText(m.phase + (m.exact ? '' : ' · ' + pct + '%'), tx, my + 70);
    ctx.fillStyle = C.muted; ctx.font = '400 24px ' + SANS;
    var sub = '';
    if (m.exact) sub = 'exact at ' + clock(m.exact.date, off) + ' in ' + m.exact.sign;
    else if (m.ingress) sub = 'enters ' + m.ingress.sign + ' at ' + clock(m.ingress.date, off);
    if (sub) ctx.fillText(sub, tx, my + 106);
    if (m.exact && m.ingress) ctx.fillText('then enters ' + m.ingress.sign + ' at ' + clock(m.ingress.date, off), tx, my + 136);

    var two = m.exact && m.ingress;
    divider(ctx, my + (two ? 158 : 138));

    // week block
    var wy = my + (two ? 210 : 190);
    var a = local(data.dayStart, off), b = local(new Date(data.weekEnd.getTime() - 1), off);
    var range = a.d + (a.m !== b.m ? ' ' + MONTHS[a.m].slice(0, 3) : '') + ' – ' + b.d + ' ' + MONTHS[b.m].slice(0, 3);
    ctx.textAlign = 'center'; ctx.fillStyle = C.goldText; ctx.font = '600 21px ' + SANS;
    spaced(ctx, 'THIS WEEK  ·  ' + range.toUpperCase(), W / 2, wy, 5, 'center');

    var ev = data.events, maxRows = 4, rowH = 46, ry = wy + 50;
    var show = ev.length > maxRows ? ev.slice(0, maxRows - 1) : ev;
    ctx.textAlign = 'left';
    if (!show.length) {
      ctx.textAlign = 'center'; ctx.fillStyle = C.muted; ctx.font = 'italic 500 36px ' + SERIF;
      ctx.fillText('A quiet week — no planet changes sign or stations.', W / 2, ry + 18);
      ry += rowH;
    }
    show.forEach(function (e) {
      diamond(ctx, 130, ry - 9, 6, e.type === 'ingress' ? C.gold : C.emerald);
      ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = '500 29px ' + SANS;
      var t = eventText(e);
      while (ctx.measureText(t).width > 590 && t.length > 8) t = t.slice(0, -2);
      ctx.fillText(t, 152, ry);
      ctx.textAlign = 'right'; ctx.fillStyle = C.goldText; ctx.font = '500 26px ' + SANS;
      ctx.fillText(shortDate(e.date, off), W - 130, ry);
      ry += rowH;
    });
    if (ev.length > maxRows) {
      ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = 'italic 500 30px ' + SERIF;
      ctx.fillText('+ ' + (ev.length - show.length) + ' more this week', 152, ry); ry += rowH;
    }
    if (data.retrogradeNow.length) {
      ctx.textAlign = 'center'; ctx.fillStyle = C.emerald; ctx.font = '600 25px ' + SANS;
      var rt = 'Retrograde now: ' + data.retrogradeNow.join(' · ');
      while (ctx.measureText(rt).width > 820 && rt.length > 12) rt = rt.slice(0, -2);
      ctx.fillText(rt, W / 2, ry + 6); ry += 40;
    }

    // message panel fills what is left above the footer
    var footerY = H - 106;
    var msg = (message || '').trim();
    if (msg) {
      var top = ry + 18, bottom = footerY - 44, ph = bottom - top, pw = CW - 120, px = X + 60;
      if (ph > 90) {
        ctx.fillStyle = C.mist; roundRect(ctx, px, top, pw, ph, 28); ctx.fill();
        ctx.strokeStyle = 'rgba(184,151,90,.55)'; ctx.lineWidth = 2; roundRect(ctx, px, top, pw, ph, 28); ctx.stroke();
        var my_ = hasMyanmar(msg), family = my_ ? MYANMAR : SANS, lh = my_ ? 1.85 : 1.5;
        var pad_ = 34, innerW = pw - pad_ * 2, innerH = ph - pad_ * 2, size, lines;
        for (size = 46; size >= 24; size -= 2) {
          ctx.font = '500 ' + size + 'px ' + family;
          lines = wrap(ctx, msg, innerW);
          if (lines.length * size * lh <= innerH) break;
        }
        if (size < 24) size = 24;                      // loop fell through: keep the size the lines were measured at
        ctx.font = '500 ' + size + 'px ' + family;
        // if it still does not fit at the smallest size, drop trailing lines with an ellipsis
        var maxLines = Math.max(1, Math.floor(innerH / (size * lh)));
        if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+$/, '') + '…'; }
        var blockH = lines.length * size * lh, sy = top + (ph - blockH) / 2 + size * (lh / 2 + .3);
        ctx.fillStyle = C.deep; ctx.textAlign = 'center';
        lines.forEach(function (ln, i) { ctx.fillText(ln, W / 2, sy + i * size * lh - (lh - 1) * size * .25); });
      }
    }

    // footer
    diamond(ctx, W / 2, footerY - 28, 6, C.gold);
    ctx.fillStyle = C.goldText; ctx.font = '600 20px ' + SANS;
    spaced(ctx, 'ASTRO SOULPRINT BY ALEX', W / 2, footerY + 14, 5, 'center');
    return canvas;
  }

  root.TransitCard = { render: render, W: W, H: H, wrap: wrap, hasMyanmar: hasMyanmar, FONTS: { SERIF: SERIF, SANS: SANS, MYANMAR: MYANMAR } };
})(self);
