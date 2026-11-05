(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('card'), dateEl = $('date'), tzEl = $('tz'), msgEl = $('msg'), statusEl = $('status');
  var logo = null, timer = null, token = 0;

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function setStatus(t, bad) { statusEl.textContent = t || ''; statusEl.className = 'status' + (bad ? ' err' : ''); }

  var img = new Image();
  img.onload = function () { logo = img; schedule(0); };
  img.src = '../../images/logo.jpg';

  function loadFonts(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var F = ['600 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '500 30px "DM Sans"', '600 22px "DM Sans"', '400 24px "DM Sans"'];
    var jobs = F.map(function (f) { return document.fonts.load(f, 'Abc 0123'); });
    jobs.push(document.fonts.load('500 30px "Noto Sans Myanmar"', text || 'က'));   // the text makes the browser fetch the Myanmar subset
    return Promise.all(jobs.map(function (p) { return p.catch(function () {}); }));
  }

  function parseDate() {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateEl.value);
    if (!m) return null;
    var y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1900 || y > 2200) return null;
    return { y: y, m: mo, d: d };
  }

  // Draws the card; the promise settles once the canvas holds the finished picture (or is superseded / fails).
  function draw() {
    var my = ++token, p = parseDate();
    if (!p) { setStatus('Pick a date between 1900 and 2200.', true); return Promise.reject(new Error('Choose a valid date first.')); }
    return loadFonts(msgEl.value).then(function () {
      if (my !== token) return;                      // a newer edit has started; that draw will finish the job
      try {
        var data = Transit.dailyCard(p.y, p.m, p.d, +tzEl.value);
        TransitCard.render(canvas, data, msgEl.value, logo);
        setStatus('');
      } catch (e) { setStatus('Could not build the card: ' + e.message, true); throw e; }
    });
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(function () { draw().catch(function () {}); }, ms); }

  function shift(n) {
    var p = parseDate() || (function () { var t = new Date(); return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() }; })();
    var d = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    voiceIdx = 0;
    dateEl.value = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    schedule(0);
  }

  function blob() {
    return new Promise(function (res, rej) { canvas.toBlob(function (b) { b ? res(b) : rej(new Error('PNG export failed')); }, 'image/png'); });
  }
  function filename() { return 'transit-card-' + dateEl.value + '.png'; }

  $('download').addEventListener('click', function () {
    clearTimeout(timer);
    draw().then(blob).then(function (b) {
      var url = URL.createObjectURL(b), a = document.createElement('a');
      a.href = url; a.download = filename(); document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      setStatus('Saved ' + filename());
    }).catch(function (e) { setStatus(e.message, true); });
  });

  var shareBtn = $('share');
  try {
    if (navigator.canShare && navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] })) shareBtn.hidden = false;
  } catch (e) {}
  shareBtn.addEventListener('click', function () {
    clearTimeout(timer);
    draw().then(blob).then(function (b) {
      return navigator.share({ files: [new File([b], filename(), { type: 'image/png' })] });
    }).catch(function (e) { if (e && e.name !== 'AbortError') setStatus(e.message, true); });
  });

  // "Write in my style": cycle through voice.js options for the chosen date; the user can edit the text afterwards.
  var voiceIdx = 0;
  $('write').addEventListener('click', function () {
    var p = parseDate();
    if (!p) { setStatus('Pick a date first.', true); return; }
    var opts = Voice.candidates(Transit.dailyCard(p.y, p.m, p.d, +tzEl.value));
    msgEl.value = opts[voiceIdx % opts.length];
    $('writeHint').textContent = 'Version ' + (voiceIdx % opts.length + 1) + ' of ' + opts.length + '. Press again for another, or edit the text.';
    voiceIdx++;
    msgEl.dispatchEvent(new Event('input'));
  });

  $('prev').addEventListener('click', function () { shift(-1); });
  $('next').addEventListener('click', function () { shift(1); });
  dateEl.addEventListener('input', function () { voiceIdx = 0; schedule(0); });
  tzEl.addEventListener('change', function () { store('tc-tz', tzEl.value); voiceIdx = 0; schedule(0); });
  msgEl.addEventListener('input', function () {
    $('count').textContent = msgEl.value.length + ' / ' + msgEl.maxLength;
    store('tc-msg', msgEl.value); schedule(250);
  });

  // start: today's date on this device, remembered time zone and draft message (kept on this device only)
  dateEl.value = ymd(new Date());
  var tz = store('tc-tz'); if (tz && Array.prototype.some.call(tzEl.options, function (o) { return o.value === tz; })) tzEl.value = tz;
  var draft = store('tc-msg'); if (draft) { msgEl.value = draft; $('count').textContent = draft.length + ' / ' + msgEl.maxLength; }
  schedule(0);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { schedule(0); });
})();
