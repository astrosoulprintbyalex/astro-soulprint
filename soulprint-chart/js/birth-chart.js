/* Birth Chart results: loads the Swiss Ephemeris on demand, works out the chart and draws the wheel, tables and meanings. */
(function () {
  'use strict';
  var S = window.Soulprint, A = S.astro, W = S.wheel, T = S.astroContent;
  var $ = function (id) { return document.getElementById(id); };

  var SHOW = {
    sun: ['Sun', ''], moon: ['Moon', ''], mercury: ['Mercury', ''], venus: ['Venus', ''], mars: ['Mars', ''], jupiter: ['Jupiter', ''],
    saturn: ['Saturn', ''], uranus: ['Uranus', ''], neptune: ['Neptune', ''], pluto: ['Pluto', ''],
    northNode: ['North Node', 'mean'], fortune: ['Part of Fortune', ''], juno: ['Juno', ''], chiron: ['Chiron', ''],
    vertex: ['Vertex', ''], lilith: ['Lilith', 'Black Moon, mean'], asc: ['Ascendant', 'Rising'], mc: ['Midheaven', 'MC']
  };
  var SHORT = { northNode: 'Node', asc: 'Asc', mc: 'MC', fortune: 'Fortune', vertex: 'Vertex', lilith: 'Lilith' };
  function shortName(k) { return SHORT[k] || SHOW[k][0]; }
  // The Ascendant and Midheaven are drawn as plain words (their own small label would only repeat the name)
  function aspPoint(k) { return (k === 'asc' || k === 'mc') ? '<b class="angle">' + shortName(k) + '</b>' : W.glyphHtml(k) + ' ' + shortName(k); }
  var HOUSE_NOTE = {
    W: { en: 'Whole Sign: each sign is one house, starting from your Rising sign.', my: 'Whole Sign: Sign တစ်ခုစီက အိမ်တစ်လုံးစီဖြစ်ပြီး ကိုယ့်ရဲ့ Rising Sign ကနေ စပါတယ်။' },
    P: { en: 'Placidus: houses are divided by time, so they can be different sizes.', my: 'Placidus: အိမ်တွေကို အချိန်နဲ့ ခွဲထားလို့ အိမ်တစ်လုံးချင်းစီ အရွယ်အစား မတူနိုင်ပါဘူး။' }
  };

  var current = null; // { inputs, chart, system }
  var pending = null;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Starts downloading the engine (about 2.5 MB, once) so it is ready by the time the form is filled in.
  function preload() {
    if (!pending) {
      pending = import('./swiss/loader.js').then(function (m) { return m.loadSwiss(); });
      pending.catch(function () { pending = null; });
    }
    return pending;
  }

  function fmtOrb(orb) {
    var d = Math.floor(orb), m = Math.floor((orb - d) * 60);
    return d + '°' + (m < 10 ? '0' : '') + m + '′';
  }
  function house(p, system) { return p.houses[system] || p.houses.W; }
  function retroCell(p) { return p.retrograde === null ? '<span class="dash">–</span>' : (p.retrograde ? '<span class="rx">R</span>' : '<span class="dash">–</span>'); }

  function pointLabel(p) {
    var s = SHOW[p.key], note = s[1];
    if (p.key === 'fortune') note = current.chart.isDay ? 'day chart' : 'night chart';
    return '<span class="pt-ico">' + W.glyphHtml(p.key) + '</span><span class="pt-name">' + s[0] + (note ? ' <small>' + note + '</small>' : '') + '</span>';
  }

  function renderBigThree(chart, system) {
    var by = {}; chart.points.forEach(function (p) { by[p.key] = p; });
    var rows = [['sun', by.sun, T.sun, T.headings.sun], ['moon', by.moon, T.moon, T.headings.moon], ['rising', by.asc, T.rising, T.headings.rising]];
    $('bigThree').innerHTML = rows.map(function (r) {
      var p = r[1], text = r[2][p.sign], h = r[3];
      var line = A.SIGNS[p.sign] + ' ' + A.format(p) + (r[0] === 'rising' ? '' : ' · House ' + house(p, system));
      return '<article class="card info-card big3">' +
        '<span class="tag">' + h.en + '</span>' +
        '<h3><span class="b3-glyph">' + W.signGlyphHtml(p.sign) + '</span> ' + h.en + ' in ' + A.SIGNS[p.sign] + '</h3>' +
        '<p class="card-sub">' + line + '</p>' +
        '<p>' + esc(text.en) + '</p>' +
        '<p class="b3-my" lang="my">' + esc(text.my) + '</p>' +
        '</article>';
    }).join('');
  }

  function renderTable(chart, system) {
    var rows = chart.points.map(function (p) {
      return '<tr><th scope="row" class="pt">' + pointLabel(p) + '</th>' +
        '<td class="sg"><span class="sg-main"><span class="sg-ico">' + W.signGlyphHtml(p.sign) + '</span> ' + A.SIGNS[p.sign] + '</span><span class="dg-m">' + A.format(p) + '</span></td>' +
        '<td class="dg">' + A.format(p) + '</td>' +
        '<td class="hs">' + house(p, system) + '</td>' +
        '<td class="rt">' + retroCell(p) + '</td></tr>';
    }).join('');
    $('pointsTable').innerHTML =
      '<thead><tr><th scope="col">Point<span lang="my">အချက်</span></th><th scope="col">Sign</th><th scope="col">Degree<span lang="my">ဒီဂရီ</span></th>' +
      '<th scope="col">House<span lang="my">အိမ်</span></th><th scope="col" title="Retrograde">Rx<span lang="my">နောက်ပြန်</span></th></tr></thead><tbody>' + rows + '</tbody>';
  }

  function renderAspects(chart) {
    var by = {}; chart.points.forEach(function (p) { by[p.key] = p; });
    if (!chart.aspects.length) { $('aspectsList').innerHTML = '<p class="muted">No major aspects within the usual orbs.</p>'; return; }
    $('aspectsList').innerHTML = '<table class="aspects"><thead><tr><th scope="col">Point<span lang="my">အချက်</span></th><th scope="col">Aspect</th><th scope="col">Point<span lang="my">အချက်</span></th><th scope="col">Orb<span lang="my">အကွာ</span></th></tr></thead><tbody>' +
      chart.aspects.map(function (a) {
        return '<tr><td class="ap-pt">' + aspPoint(a.a) + '</td>' +
          '<td class="ap-type asp-' + a.type + '"><span class="asp-dot"></span>' + a.name + '</td>' +
          '<td class="ap-pt">' + aspPoint(a.b) + '</td>' +
          '<td class="ap-orb">' + fmtOrb(a.orb) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function renderAll() {
    var c = current.chart, sys = current.system;
    $('wheel').innerHTML = W.render(c, sys);
    renderBigThree(c, sys);
    renderTable(c, sys);
    renderAspects(c);
    var note = HOUSE_NOTE[sys];
    $('houseNote').innerHTML = esc(note.en) + '<span lang="my">' + esc(note.my) + '</span>';
    Array.prototype.forEach.call(document.querySelectorAll('#houseToggle button'), function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-hs') === sys));
    });
  }

  function setSystem(sys) {
    if (!current || current.system === sys) return;
    if (sys === 'P' && !current.chart.placidusAvailable) return;
    current.system = sys;
    renderAll();
  }

  function setBusy(msg, my) {
    var box = $('birthStatus');
    box.hidden = !msg;
    box.innerHTML = msg ? '<p>' + esc(msg) + '</p><p lang="my">' + esc(my || '') + '</p>' : '';
    $('birthBody').hidden = !!msg;
  }

  /* inputs: { name, year, month, day, h12, minute, ampm, city, countryName, lat, lon, utcMs, offsetLabel, ambiguous, nonexistent, fmtDate, fmtTime } */
  function show(inputs) {
    var res = $('birthResults');
    res.hidden = false;
    setBusy('Reading the sky for your birth moment…', 'ကိုယ့်မွေးချိန်က ကောင်းကင်ကို ဖတ်နေပါတယ်…');
    $('birthTitle').textContent = 'Your Birth Chart';
    $('birthSub').textContent = 'For ' + inputs.name + ' · born ' + inputs.fmtDate + ', ' + inputs.fmtTime + ' · ' + inputs.city + ', ' + inputs.countryName + ' (' + inputs.offsetLabel + ')';
    var notice = $('birthNotice');
    if (inputs.nonexistent) { notice.textContent = 'On that day the clocks jumped forward, so that exact time did not happen. Please double-check your birth time.'; notice.hidden = false; }
    else if (inputs.ambiguous) { notice.textContent = 'On that day the clocks were turned back, so that time happened twice. We used the first one. If you were born the second time around, please let Alex know.'; notice.hidden = false; }
    else notice.hidden = true;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

    return preload().then(function (swe) {
      var chart = A.calculate(swe, { utcMs: inputs.utcMs, lat: inputs.lat, lon: inputs.lon });
      current = { inputs: inputs, chart: chart, system: chart.placidusAvailable ? 'P' : 'W' };
      var pl = $('houseToggle').querySelector('[data-hs="P"]');
      pl.disabled = !chart.placidusAvailable;
      $('placidusNote').hidden = chart.placidusAvailable;
      setBusy('');
      renderAll();
      $('birthTitle').focus({ preventScroll: true });
    }).catch(function (err) {
      if (window.console) console.error(err);
      setBusy('Sorry, the chart engine could not start. Please check your internet connection and try again.', 'တောင်းပန်ပါတယ်၊ Chart ကို မစတင်နိုင်ပါဘူး။ Internet ကို စစ်ပြီး ထပ်ကြိုးစားကြည့်ပါ။');
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('#houseToggle button'), function (b) {
      b.addEventListener('click', function () { setSystem(b.getAttribute('data-hs')); });
    });
    $('wheel').addEventListener('click', function () { if (S.ui && S.ui.zoomSvg) S.ui.zoomSvg($('wheel')); });
  }
  init();

  S.birth = { show: show, preload: preload };
}());
