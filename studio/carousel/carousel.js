(function () {
  'use strict';
  var W = 1080, H = 1350, MAX = 10, KEY = 'asp-carousel-draft-v1';
  var SERIF = '"Cormorant Garamond","Noto Sans Myanmar",Georgia,serif';
  var SANS = '"DM Sans","Noto Sans Myanmar",system-ui,sans-serif';
  var MM = /[က-႟ꧠ-꧿ꩠ-ꩿ]/;

  var $ = function (id) { return document.getElementById(id); };
  var preview = $('preview'), pctx = preview.getContext('2d');
  var work = $('work'), wctx = work.getContext('2d');

  var logo = new Image();
  logo.onload = function () { renderAll(); };
  logo.src = '../../images/logo.jpg';

  /* ---------- state ---------- */
  function blank(layout) {
    return { layout: layout || 'content', theme: 'emerald', title: '', subtitle: '', bullets: '', quote: '', author: '',
      keyword: 'LOVE', line: 'Message {KEYWORD} on Messenger', note: '', signature: 'Astro Soulprint (by Alex)' };
  }
  function starter() {
    var a = blank('cover'); a.title = 'Your Venus Sign\nand How You Love'; a.subtitle = 'A gentle guide to what your heart is really asking for';
    var b = blank('content'); b.theme = 'cream'; b.title = 'Three Signs You Are Ready'; b.bullets = 'You keep attracting the same pattern\nYou feel called to slow down and listen\nYou want love that feels safe, not loud';
    var c = blank('quote'); c.quote = 'You are not behind. You are right on time.'; c.author = 'Astro Soulprint';
    var d = blank('cta'); d.title = 'Ready for your reading?';
    return [a, b, c, d];
  }
  var state = { slides: starter(), cur: 0 };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && Array.isArray(saved.slides) && saved.slides.length) {
      state.slides = saved.slides.slice(0, MAX).map(function (s) { return Object.assign(blank(), s); });
      state.cur = Math.min(saved.cur | 0, state.slides.length - 1);
      $('saved').textContent = 'Draft restored';
    }
  } catch (e) {}

  var saveTimer;
  function save() {
    clearTimeout(saveTimer);
    $('saved').textContent = 'Saving…';
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        var d = new Date();
        $('saved').textContent = 'Draft saved ✓ ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) { $('saved').textContent = 'Could not save in this browser'; }
    }, 400);
  }

  /* ---------- text helpers ---------- */
  var gSeg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var wSeg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('my', { granularity: 'word' }) : null;
  var MARK = /[ါ-ှၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏႚ-ႝ‍‌️]/;
  function clusters(s) {
    if (gSeg) return Array.from(gSeg.segment(s), function (x) { return x.segment; });
    var out = [], ch = Array.from(s);
    ch.forEach(function (c, i) {
      if (out.length && (MARK.test(c) || ch[i - 1] === '္')) out[out.length - 1] += c; else out.push(c);
    });
    return out;
  }
  // tokens: [{t, sp}] where sp = a space precedes this token
  function tokens(line) {
    var res = [];
    line.split(/\s+/).filter(Boolean).forEach(function (w, wi) {
      var parts = [w];
      if (MM.test(w) && w.length > 8) {
        parts = wSeg ? Array.from(wSeg.segment(w), function (x) { return x.segment; }) : clusters(w);
      }
      parts.forEach(function (p, i) { res.push({ t: p, sp: i === 0 && wi > 0 }); });
    });
    return res;
  }
  function wrap(ctx, text, maxW) {
    var lines = [];
    String(text).split('\n').forEach(function (para) {
      if (!para.trim()) { lines.push(''); return; }
      var cur = '';
      tokens(para).forEach(function (tk) {
        var tryS = cur + (tk.sp && cur ? ' ' : '') + tk.t;
        if (!cur || ctx.measureText(tryS).width <= maxW) { cur = tryS; if (ctx.measureText(cur).width <= maxW) return; }
        else { lines.push(cur); cur = tk.t; }
        if (ctx.measureText(cur).width > maxW) { // single token too long: split by cluster
          var buf = '';
          clusters(cur).forEach(function (c) {
            if (buf && ctx.measureText(buf + c).width > maxW) { lines.push(buf); buf = c; } else buf += c;
          });
          cur = buf;
        }
      });
      lines.push(cur);
    });
    return lines;
  }
  // Find the largest font size that fits. Returns {size, lines, lh}
  function fit(ctx, text, o) {
    var lhF = MM.test(text) ? (o.lhMy || 1.9) : (o.lh || 1.25);
    var size = o.max, r;
    for (; size >= o.min; size -= 2) {
      ctx.font = o.font(size);
      var lines = wrap(ctx, text, o.w);
      r = { size: size, lines: lines, lh: size * lhF };
      if (lines.length <= (o.maxLines || 99) && lines.length * r.lh <= (o.h || 9999)) return r;
    }
    return r;
  }
  function drawLines(ctx, r, x, y, align, font) {
    ctx.font = font(r.size); ctx.textAlign = align; ctx.textBaseline = 'middle';
    r.lines.forEach(function (l, i) { ctx.fillText(l, x, y + r.lh * i + r.lh / 2); });
    return y + r.lines.length * r.lh;
  }

  /* ---------- drawing ---------- */
  function palette(theme) {
    return theme === 'cream'
      ? { bg1: '#fbf8f1', bg2: '#f1ebdb', head: '#245f4a', text: '#26352e', soft: '#5d6e65', gold: '#b8975a', frame: 'rgba(184,151,90,.7)', pill: '#245f4a', pillText: '#faf7f0' }
      : { bg1: '#2f7a5f', bg2: '#1c4b3a', head: '#faf7f0', text: '#f3efe4', soft: 'rgba(250,247,240,.78)', gold: '#dcc489', frame: 'rgba(220,196,137,.7)', pill: '#dcc489', pillText: '#1c4b3a' };
  }
  function star(ctx, cx, cy, r, color) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx, cy, cx + r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + r);
    ctx.quadraticCurveTo(cx, cy, cx - r, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - r);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function divider(ctx, cx, y, c) {
    ctx.strokeStyle = c.gold; ctx.lineWidth = 2; ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.moveTo(cx - 190, y); ctx.lineTo(cx - 36, y); ctx.moveTo(cx + 36, y); ctx.lineTo(cx + 190, y); ctx.stroke();
    ctx.globalAlpha = 1; star(ctx, cx, y, 14, c.gold);
  }
  function drawLogo(ctx, cx, cy, r, c) {
    if (logo.complete && logo.naturalWidth) {
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logo, cx - r, cy - r, r * 2, r * 2); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2); ctx.strokeStyle = c.gold; ctx.lineWidth = 3; ctx.stroke();
  }
  function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  var headF = function (s) { return '600 ' + s + 'px ' + SERIF; };
  var bodyF = function (s) { return '400 ' + s + 'px ' + SANS; };

  function render(ctx, s, idx, total) {
    var c = palette(s.theme), cx = W / 2, M = 120, IW = W - M * 2, y;
    var g = ctx.createLinearGradient(0, 0, W * .35, H); g.addColorStop(0, c.bg1); g.addColorStop(1, c.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = c.frame; ctx.lineWidth = 3; rrect(ctx, 40, 40, W - 80, H - 80, 6); ctx.stroke();
    ctx.lineWidth = 1; ctx.globalAlpha = .5; rrect(ctx, 54, 54, W - 108, H - 108, 4); ctx.stroke(); ctx.globalAlpha = 1;

    var L = s.layout, top = 0;
    if (L === 'cover') { drawLogo(ctx, cx, 250, 120, c); top = 430; }
    else if (L === 'cta') { drawLogo(ctx, cx, 230, 100, c); top = 390; }
    else { drawLogo(ctx, cx, 150, 56, c); top = 250; }
    var bottom = H - 150;

    if (L === 'cover') {
      var t = fit(ctx, s.title || ' ', { font: headF, max: 128, min: 56, w: IW, h: 400, maxLines: 5, lh: 1.08 });
      var sub = fit(ctx, s.subtitle || '', { font: bodyF, max: 42, min: 28, w: IW - 60, h: 240, maxLines: 4, lh: 1.4 });
      var th = t.lines.length * t.lh, sh = s.subtitle ? sub.lines.length * sub.lh : 0;
      var total_h = th + 70 + sh; y = top + Math.max(0, (bottom - top - total_h) / 2);
      ctx.fillStyle = c.head; y = drawLines(ctx, t, cx, y, 'center', headF);
      divider(ctx, cx, y + 35, c); y += 70;
      if (s.subtitle) { ctx.fillStyle = c.soft; drawLines(ctx, sub, cx, y, 'center', bodyF); }
    } else if (L === 'content') {
      var h = fit(ctx, s.title || ' ', { font: headF, max: 92, min: 48, w: IW, h: 320, maxLines: 3, lh: 1.1 });
      ctx.fillStyle = c.head; y = drawLines(ctx, h, cx, top, 'center', headF);
      divider(ctx, cx, y + 36, c); y += 90;
      var items = s.bullets.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      var indent = 64, gap = 34, avail = bottom - y, bw = IW - indent, size = 46, res;
      for (; size >= 26; size -= 2) {
        ctx.font = bodyF(size);
        res = items.map(function (it) { return wrap(ctx, it, bw); });
        var lh = size * (MM.test(s.bullets) ? 1.85 : 1.45), th2 = 0;
        res.forEach(function (ls) { th2 += ls.length * lh; }); th2 += gap * Math.max(0, items.length - 1);
        if (th2 <= avail) break;
      }
      lh = size * (MM.test(s.bullets) ? 1.85 : 1.45);
      ctx.fillStyle = c.text; ctx.font = bodyF(size); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      (res || []).forEach(function (ls) {
        star(ctx, M + 16, y + lh / 2, 15, c.gold);
        ctx.fillStyle = c.text;
        ls.forEach(function (l, i) { ctx.fillText(l, M + indent, y + lh * i + lh / 2); });
        y += ls.length * lh + gap;
      });
    } else if (L === 'quote') {
      var q = fit(ctx, s.quote || ' ', { font: function (z) { return (MM.test(s.quote) ? '500 ' : 'italic 500 ') + z + 'px ' + SERIF; }, max: 84, min: 36, w: IW - 20, h: 600, maxLines: 10, lh: 1.25, lhMy: 1.9 });
      var qf = function (z) { return (MM.test(s.quote) ? '500 ' : 'italic 500 ') + z + 'px ' + SERIF; };
      var qh = q.lines.length * q.lh + 150 + (s.author ? 110 : 0);
      y = top + Math.max(0, (bottom - top - qh) / 2);
      ctx.fillStyle = c.gold; ctx.font = '600 220px ' + SERIF; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('“', cx, y + 150); y += 120;
      ctx.fillStyle = c.head; y = drawLines(ctx, q, cx, y, 'center', qf);
      if (s.author) {
        divider(ctx, cx, y + 50, c);
        ctx.fillStyle = c.gold; ctx.font = '500 36px ' + SANS; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('— ' + s.author, cx, y + 115);
      }
    } else { // cta
      var ch = fit(ctx, s.title || ' ', { font: headF, max: 100, min: 48, w: IW, h: 330, maxLines: 3, lh: 1.1 });
      var msg = (s.line || 'Message {KEYWORD} on Messenger').replace(/\{KEYWORD\}/gi, (s.keyword || '').toUpperCase());
      var pf = function (z) { return '600 ' + z + 'px ' + SANS; };
      var pm = fit(ctx, msg, { font: pf, max: 46, min: 28, w: IW - 120, h: 220, maxLines: 3, lh: 1.3, lhMy: 1.8 });
      var ph = pm.lines.length * pm.lh + 70;
      var nt = s.note ? fit(ctx, s.note, { font: bodyF, max: 34, min: 24, w: IW - 60, h: 160, maxLines: 3, lh: 1.4 }) : null;
      var blockH = ch.lines.length * ch.lh + 60 + ph + (nt ? 50 + nt.lines.length * nt.lh : 0);
      var availH = bottom - 120 - top; y = top + Math.max(0, (availH - blockH) / 2);
      ctx.fillStyle = c.head; y = drawLines(ctx, ch, cx, y, 'center', headF);
      y += 60;
      var pw = Math.min(IW, Math.max.apply(null, pm.lines.map(function (l) { ctx.font = pf(pm.size); return ctx.measureText(l).width; })) + 110);
      ctx.fillStyle = c.pill; rrect(ctx, cx - pw / 2, y, pw, ph, ph / 2 > 60 ? 50 : ph / 2); ctx.fill();
      ctx.fillStyle = c.pillText; drawLines(ctx, pm, cx, y + 35, 'center', pf); y += ph;
      if (nt) { y += 50; ctx.fillStyle = c.soft; drawLines(ctx, nt, cx, y, 'center', bodyF); }
      var sig = s.signature || '';
      if (sig) {
        divider(ctx, cx, H - 270, c);
        var sg = fit(ctx, sig, { font: function (z) { return 'italic 600 ' + z + 'px ' + SERIF; }, max: 54, min: 30, w: IW, h: 120, maxLines: 1, lh: 1.2 });
        ctx.fillStyle = c.gold; drawLines(ctx, sg, cx, H - 235, 'center', function (z) { return 'italic 600 ' + z + 'px ' + SERIF; });
      }
    }
    // slide number
    ctx.fillStyle = c.gold; ctx.font = '600 34px ' + SERIF; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((idx + 1) + ' / ' + total, cx, H - 95);
  }

  /* ---------- UI ---------- */
  var FIELDS = {
    cover: [['title', 'Title', 'textarea', 2], ['subtitle', 'Subtitle', 'textarea', 2]],
    content: [['title', 'Heading', 'input'], ['bullets', 'Bullet points (one per line)', 'textarea', 6]],
    quote: [['quote', 'Quote', 'textarea', 4], ['author', 'Signed by (optional)', 'input']],
    cta: [['title', 'Headline', 'input'], ['keyword', 'Keyword', 'input'], ['line', 'Message line — {KEYWORD} is replaced by the keyword', 'input'], ['note', 'Small note (optional)', 'textarea', 2], ['signature', 'Signature', 'input']]
  };
  function cur() { return state.slides[state.cur]; }

  function buildFields() {
    var box = $('fields'); box.innerHTML = ''; var s = cur();
    FIELDS[s.layout].forEach(function (f) {
      var lab = document.createElement('label'); lab.appendChild(document.createTextNode(f[1]));
      var el = document.createElement(f[2] === 'input' ? 'input' : 'textarea');
      if (f[2] === 'textarea') el.rows = f[3]; else el.type = 'text';
      el.value = s[f[0]] || ''; el.setAttribute('lang', 'my'); el.autocapitalize = 'sentences';
      el.addEventListener('input', function () { s[f[0]] = el.value; drawPreview(); queueThumbs(); save(); });
      lab.appendChild(el); box.appendChild(lab);
    });
  }
  function drawPreview() { render(pctx, cur(), state.cur, state.slides.length); }

  var thumbTimer;
  function queueThumbs() { clearTimeout(thumbTimer); thumbTimer = setTimeout(buildStrip, 250); }
  function buildStrip() {
    var strip = $('strip'); strip.innerHTML = '';
    state.slides.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'thumb';
      b.setAttribute('role', 'tab'); b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.setAttribute('aria-selected', i === state.cur ? 'true' : 'false');
      var cv = document.createElement('canvas'); cv.width = 216; cv.height = 270; b.appendChild(cv);
      render(wctx, s, i, state.slides.length); cv.getContext('2d').drawImage(work, 0, 0, 216, 270);
      b.onclick = function () { go(i); };
      strip.appendChild(b);
    });
  }
  function refreshChrome() {
    var n = state.slides.length;
    $('counter').textContent = (state.cur + 1) + ' / ' + n;
    $('slideTitle').textContent = 'Slide ' + (state.cur + 1);
    $('limit').textContent = n + ' / ' + MAX + ' slides';
    $('addSlide').disabled = n >= MAX; $('delSlide').disabled = n <= 1;
    $('moveUp').disabled = state.cur === 0; $('moveDown').disabled = state.cur === n - 1;
    $('prev').disabled = state.cur === 0; $('next').disabled = state.cur === n - 1;
    $('layout').value = cur().layout; $('theme').value = cur().theme;
  }
  function renderAll() { refreshChrome(); drawPreview(); buildStrip(); }
  function go(i) { state.cur = Math.max(0, Math.min(i, state.slides.length - 1)); buildFields(); renderAll(); save(); }

  $('prev').onclick = function () { go(state.cur - 1); };
  $('next').onclick = function () { go(state.cur + 1); };
  $('addSlide').onclick = function () {
    if (state.slides.length >= MAX) return;
    var s = blank('content'); state.slides.splice(state.cur + 1, 0, s); go(state.cur + 1);
  };
  $('dupSlide').onclick = function () {
    if (state.slides.length >= MAX) return;
    state.slides.splice(state.cur + 1, 0, Object.assign({}, cur())); go(state.cur + 1);
  };
  $('delSlide').onclick = function () {
    if (state.slides.length <= 1 || !confirm('Delete slide ' + (state.cur + 1) + '?')) return;
    state.slides.splice(state.cur, 1); go(Math.min(state.cur, state.slides.length - 1));
  };
  function move(d) {
    var j = state.cur + d; if (j < 0 || j >= state.slides.length) return;
    var t = state.slides[j]; state.slides[j] = state.slides[state.cur]; state.slides[state.cur] = t; go(j);
  }
  $('moveUp').onclick = function () { move(-1); };
  $('moveDown').onclick = function () { move(1); };
  $('layout').onchange = function (e) { cur().layout = e.target.value; buildFields(); renderAll(); save(); };
  $('theme').onchange = function (e) { cur().theme = e.target.value; renderAll(); save(); };
  $('resetAll').onclick = function () {
    if (!confirm('Clear everything and start a new carousel?')) return;
    state.slides = [blank('cover')]; state.cur = 0; go(0);
  };

  /* ---------- download ---------- */
  function toBlob(i) {
    render(wctx, state.slides[i], i, state.slides.length);
    return new Promise(function (res) { work.toBlob(res, 'image/png'); });
  }
  function fname(i) { return 'astro-soulprint-slide-' + String(i + 1).padStart(2, '0') + '.png'; }
  function saveBlob(blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;

  async function exportSlides(indexes, btn) {
    var label = btn.textContent; btn.disabled = true; btn.textContent = 'Preparing…';
    try {
      await fontsReady();
      var files = [];
      for (var k = 0; k < indexes.length; k++) {
        var blob = await toBlob(indexes[k]);
        files.push(new File([blob], fname(indexes[k]), { type: 'image/png' }));
      }
      if (coarse && navigator.canShare && navigator.canShare({ files: files })) {
        try { await navigator.share({ files: files, title: 'Astro Soulprint carousel' }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      for (var m = 0; m < files.length; m++) { saveBlob(files[m], files[m].name); await sleep(350); }
    } finally { btn.disabled = false; btn.textContent = label; render(wctx, cur(), state.cur, state.slides.length); }
  }
  $('downloadAll').onclick = function () { exportSlides(state.slides.map(function (_, i) { return i; }), this); };
  $('downloadOne').onclick = function () { exportSlides([state.cur], this); };

  /* ---------- fonts ---------- */
  var sample = 'Aa မြန်မာ ကောင်းပါစေ';
  function fontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var loads = ['600 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '400 40px "DM Sans"', '600 40px "DM Sans"',
      '400 40px "Noto Sans Myanmar"', '500 40px "Noto Sans Myanmar"', '600 40px "Noto Sans Myanmar"'];
    var txt = sample + state.slides.map(function (s) { return [s.title, s.subtitle, s.bullets, s.quote, s.author, s.line, s.note].join(' '); }).join(' ');
    return Promise.all(loads.map(function (f) { return document.fonts.load(f, txt).catch(function () {}); }));
  }

  buildFields(); renderAll();
  fontsReady().then(function () { renderAll(); });
  if (document.fonts) document.fonts.addEventListener('loadingdone', function () { drawPreview(); queueThumbs(); });
})();
