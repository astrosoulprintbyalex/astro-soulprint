/* Cosmic Weather: works out this week's sky on the visitor's device and draws the cards.
   The calculation is in sky.js, every sentence is in words.js. Nothing is saved or sent anywhere. */
(function () {
  'use strict';
  var Sky = window.CosmicSky, W = window.CosmicWords, A = window.Astronomy;
  var app = document.getElementById('cwApp');
  if (!app) return;

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function myNum(n) { return String(n).replace(/\d/g, function (d) { return '၀၁၂၃၄၅၆၇၈၉'.charAt(+d); }); }
  var VS = '︎'; // asks phones to draw the symbol as plain text, not as a colour emoji

  /* ---------- Dates (always Myanmar Time, wherever the visitor is) ---------- */
  function dayEn(ms) { var p = Sky.mmt(ms); return W.DAYS_EN[p.dow] + ' ' + p.d + ' ' + W.MONTHS_EN[p.m]; }
  function dayMy(ms) { var p = Sky.mmt(ms); return W.DAYS_MY[p.dow] + ' ' + myNum(p.d) + ' ' + W.MONTHS_MY[p.m]; }
  function timeEn(ms) { var p = Sky.mmt(ms); return pad(p.hh) + ':' + pad(p.mm); }
  function timeMy(ms) { var p = Sky.mmt(ms); return myNum(pad(p.hh)) + ':' + myNum(pad(p.mm)); }
  // "Mon 2 – Thu 5 Nov" (the month appears once when both days share it)
  function rangeEn(a, b) {
    var pa = Sky.mmt(a), pb = Sky.mmt(b);
    if (pa.d === pb.d && pa.m === pb.m) return dayEn(a);
    var left = pa.m === pb.m ? W.DAYS_EN[pa.dow] + ' ' + pa.d : dayEn(a);
    return left + ' – ' + dayEn(b);
  }
  function rangeMy(a, b) {
    var pa = Sky.mmt(a), pb = Sky.mmt(b);
    if (pa.d === pb.d && pa.m === pb.m) return dayMy(a);
    var left = pa.m === pb.m ? W.DAYS_MY[pa.dow] + ' ' + myNum(pa.d) : dayMy(a);
    return left + ' – ' + dayMy(b);
  }

  /* ---------- Little pictures ---------- */
  function moonIcon(q) {
    var lit = q === 2 ? '<circle cx="18" cy="18" r="14" class="m-lit"/>'
      : '<circle cx="18" cy="18" r="14" class="m-dark"/>' + (q === 1 ? '<path d="M18 4a14 14 0 0 1 0 28z" class="m-lit"/>' : q === 3 ? '<path d="M18 4a14 14 0 0 0 0 28z" class="m-lit"/>' : '');
    return '<svg viewBox="0 0 36 36" width="34" height="34" focusable="false">' + lit + '<circle cx="18" cy="18" r="14" class="m-ring"/></svg>';
  }
  function glyph(body) { return '<span class="cw-glyph">' + W.PLANET_GLYPH[body] + VS + '</span>'; }

  /* ---------- Cards ---------- */
  function card(o) {
    return '<article class="cw-card ' + o.cls + '">' +
      '<div class="cw-ico" aria-hidden="true">' + o.icon + '</div>' +
      '<div class="cw-body">' +
        '<p class="cw-kind">' + esc(o.kind) + '</p>' +
        '<h3>' + o.title + '</h3>' +
        (o.titleMy ? '<p class="cw-title-my" lang="my">' + o.titleMy + '</p>' : '') +
        '<p class="cw-when">' + esc(o.whenEn) + '<span lang="my">' + esc(o.whenMy) + '</span></p>' +
        '<p class="cw-my" lang="my">' + esc(o.my) + '</p>' +
        '<p class="cw-en">' + esc(o.en) + '</p>' +
      '</div></article>';
  }

  function eventCards(week) {
    var ev = [];
    week.phases.forEach(function (ph) {
      var name = W.PHASE[ph.quarter].name, sign = W.SIGNS[ph.sign], t = W.phaseText(ph);
      var ecl = ph.eclipse ? W.ECLIPSE[ph.eclipse.type].label : '';
      ev.push({ time: ph.time, html: card({
        cls: 'cw-phase', icon: moonIcon(ph.quarter), kind: ecl ? 'Moon phase · ' + ecl : 'Moon phase',
        title: esc(name) + ' in ' + esc(sign), titleMy: esc(name) + ' (' + esc(sign) + ' ထဲမှာ)' + (ecl ? ' · ' + esc(ecl) : ''),
        whenEn: dayEn(ph.time) + ' · ' + timeEn(ph.time), whenMy: dayMy(ph.time) + ' · ' + timeMy(ph.time), my: t.my, en: t.en }) });
    });
    week.ingresses.forEach(function (ig) {
      var t = W.ingressText(ig), sign = W.SIGNS[ig.sign];
      ev.push({ time: ig.time, html: card({
        cls: 'cw-ingress', icon: glyph(ig.body), kind: ig.body === 'Sun' ? 'Sun changes sign' : 'Planet changes sign',
        title: esc(ig.body) + (ig.retro ? ' moves back into ' : ' enters ') + esc(sign),
        titleMy: esc(ig.body) + ' က ' + esc(sign) + (ig.retro ? ' ထဲ ပြန်ဝင်ပါတယ်' : ' ထဲ ဝင်ပါပြီ'),
        whenEn: dayEn(ig.time) + ' · ' + timeEn(ig.time), whenMy: dayMy(ig.time) + ' · ' + timeMy(ig.time), my: t.my, en: t.en }) });
    });
    week.stations.forEach(function (st) {
      var t = W.stationText(st), rx = st.kind === 'retrograde';
      ev.push({ time: st.time, html: card({
        cls: rx ? 'cw-rx' : 'cw-direct', icon: glyph(st.body), kind: rx ? 'Retrograde begins' : 'Retrograde ends',
        title: esc(st.body) + (rx ? ' turns retrograde' : ' turns direct') + ' in ' + esc(W.SIGNS[st.sign]),
        titleMy: esc(st.body) + (rx ? ' Retrograde စတင်ပါပြီ' : ' Direct ပြန်ဖြစ်ပါပြီ') + ' (' + esc(W.SIGNS[st.sign]) + ' ထဲမှာ)',
        whenEn: dayEn(st.time) + ' · ' + timeEn(st.time), whenMy: dayMy(st.time) + ' · ' + timeMy(st.time), my: t.my, en: t.en }) });
    });
    ev.sort(function (a, b) { return a.time - b.time; });
    return ev.map(function (e) { return e.html; }).join('');
  }

  function moonCards(week) {
    return week.moon.map(function (seg) {
      var last = seg.to - 60000, s = W.SIGNS[seg.sign], m = W.MOON_SIGN[seg.sign];
      return '<article class="cw-card cw-moon">' +
        '<div class="cw-ico" aria-hidden="true"><span class="cw-glyph">' + W.SIGN_GLYPH[seg.sign] + VS + '</span></div>' +
        '<div class="cw-body">' +
          '<h3>Moon in ' + esc(s) + '</h3>' +
          '<p class="cw-title-my" lang="my">Moon က ' + esc(s) + ' ထဲမှာ</p>' +
          '<p class="cw-when">' + esc(rangeEn(Math.max(seg.from, week.start), last)) + '<span lang="my">' + esc(rangeMy(Math.max(seg.from, week.start), last)) + '</span></p>' +
          '<p class="cw-my" lang="my">' + esc(m.my) + '</p>' +
          '<p class="cw-en">' + esc(m.en) + '</p>' +
        '</div></article>';
    }).join('');
  }

  function render(nowMs) {
    var week = Sky.makeSky(A).week(nowMs);
    var last = week.end - 60000, mn = week.moonNow;
    var phaseName = { new: 'New Moon', waxingCrescent: 'Waxing Crescent', firstQuarter: 'First Quarter', waxingGibbous: 'Waxing Gibbous', full: 'Full Moon', waningGibbous: 'Waning Gibbous', lastQuarter: 'Last Quarter', waningCrescent: 'Waning Crescent' }[mn.name];

    // Top of the page: the week and the Moon right now.
    document.getElementById('cwWeek').innerHTML =
      '<span class="cw-weekchip"><b>This week</b> ' + esc(rangeEn(week.start, last)) + '</span>' +
      '<span class="cw-weekchip-my" lang="my">ဒီအပတ် ' + esc(rangeMy(week.start, last)) + '</span>' +
      '<p class="cw-moonnow">The Moon now: ' + esc(phaseName) + ' · ' + mn.lit + '% lit · in ' + esc(W.SIGNS[mn.sign]) + '</p>' +
      '<p class="cw-moonnow" lang="my">အခု Moon က ' + esc(W.SIGNS[mn.sign]) + ' ထဲမှာ၊ ' + esc(phaseName) + ' (' + myNum(mn.lit) + '% လင်းနေ)</p>';

    var events = eventCards(week);
    var quiet = '<article class="cw-card cw-quiet"><div class="cw-ico" aria-hidden="true"><span class="cw-glyph">✦</span></div><div class="cw-body">' +
      '<h3>A quiet week in the sky</h3>' +
      '<p class="cw-my" lang="my">ဒီအပတ်မှာ ကြီးကြီးမားမား ပြောင်းလဲမှု မရှိပါဘူး။ Moon ရဲ့ လှုပ်ရှားမှုလေးတွေကိုပဲ လိုက်ကြည့်ပြီး ဖြေးဖြေးလေး နေလို့ရတဲ့ အပတ်လေးပါနော်။ 🤍</p>' +
      '<p class="cw-en">No big planet changes this week, just the Moon moving along. A lovely week to go slowly.</p></div></article>';

    var rx = week.retrograde;
    var rxHtml = rx.length
      ? '<div class="cw-rxnow"><p class="cw-rxnow-title">Retrograde right now<span lang="my">အခု Retrograde ဖြစ်နေတာတွေ</span></p><p class="cw-chips">' +
        rx.map(function (b) { return '<span class="cw-chip">' + glyph(b) + ' ' + esc(b) + '</span>'; }).join('') + '</p></div>'
      : '<div class="cw-rxnow"><p class="cw-rxnow-title">Retrograde right now<span lang="my">အခု Retrograde ဖြစ်နေတာတွေ</span></p><p class="cw-rxnone">No planets are retrograde right now.<span lang="my">အခု Retrograde ဖြစ်နေတဲ့ Planet မရှိပါဘူး။</span></p></div>';

    app.innerHTML =
      '<h2 class="cw-h">The week\'s highlights<small lang="my">ဒီအပတ်ရဲ့ အဓိကအဖြစ်အပျက်တွေ</small></h2>' +
      '<div class="cw-list">' + (events || quiet) + '</div>' +
      rxHtml +
      '<h2 class="cw-h">The Moon through the week<small lang="my">တစ်ပတ်လုံး Moon ရဲ့ ခရီးလေး</small></h2>' +
      '<div class="cw-list cw-moons">' + moonCards(week) + '</div>' +
      '<p class="cw-foot">' + esc(W.UI.tz_en) + ' Planet positions use the tropical zodiac and are calculated on your device.' +
      '<span lang="my">' + esc(W.UI.tz_my) + ' Tropical Zodiac ကို သုံးထားပြီး ကိုယ့်ဖုန်းထဲမှာပဲ တွက်ချက်ထားတာပါ။</span></p>';
  }

  try {
    if (!A) throw new Error('astronomy library not loaded');
    // Add ?date=2026-11-09 to the link to preview another week (handy for checking). Otherwise it is always "now".
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search), when = m ? Date.parse(m[1] + 'T12:00:00+06:30') : NaN;
    render(isNaN(when) ? Date.now() : when);
  } catch (e) {
    app.innerHTML = '<p class="cw-error">Sorry, this week\'s sky could not load. Please refresh the page.<span lang="my">ဒီအပတ်ရဲ့ Sky ကို မပြနိုင်သေးပါဘူး။ Page ကို Refresh လုပ်ကြည့်ပေးပါနော်။</span></p>';
    if (window.console) console.error(e);
  }
})();
