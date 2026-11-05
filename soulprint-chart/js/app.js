/* Page logic: choosing a chart, the birth details form, city suggestions and the Human Design results.
   The Birth Chart results are drawn by birth-chart.js. */
(function () {
  'use strict';

  var S = window.Soulprint, D = S.data, C = S.calc, T = S.content, CFG = S.config || {};
  var $ = function (id) { return document.getElementById(id); };

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var POPULAR = ['MM', 'TH', 'SG', 'MY', 'US', 'AU', 'GB', 'JP', 'KR', 'CA', 'AE', 'IN'];
  // Old names for time zones, in case a phone's browser does not know the newer name yet.
  var ZONE_ALIASES = {
    'Asia/Yangon': 'Asia/Rangoon', 'Europe/Kyiv': 'Europe/Kiev', 'Asia/Kolkata': 'Asia/Calcutta',
    'Asia/Ho_Chi_Minh': 'Asia/Saigon', 'Asia/Kathmandu': 'Asia/Katmandu', 'America/Nuuk': 'America/Godthab',
    'Pacific/Kanton': 'Pacific/Enderbury', 'America/Ciudad_Juarez': 'America/Ojinaga'
  };

  var countries = S.countries || [];
  var countryByCode = {};
  countries.forEach(function (c) { countryByCode[c.c] = c; });

  var state = { cityList: [], selectedCity: null, activeIndex: -1, type: null, lastInputs: null };

  var TYPES = {
    hd: { name: 'Human Design Chart', submitEn: 'Show my Human Design Chart', submitMy: 'ကိုယ့် Human Design Chart ကို ကြည့်မယ်',
          switchEn: 'Switch to Birth Chart (Astrology)', switchMy: 'Birth Chart သို့ ပြောင်းမယ်', other: 'birth' },
    birth: { name: 'Birth Chart (Astrology)', submitEn: 'Show my Birth Chart', submitMy: 'ကိုယ့် Birth Chart ကို ကြည့်မယ်',
             switchEn: 'Switch to Human Design Chart', switchMy: 'Human Design Chart သို့ ပြောင်းမယ်', other: 'hd' }
  };

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }
  function fold(s) {
    var t = String(s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    // letters that do not split into a letter plus an accent (so "Tromso" finds "Tromsø")
    t = t.replace(/[øðđłıßæœþ]/g, function (ch) { return { 'ø': 'o', 'ð': 'd', 'đ': 'd', 'ł': 'l', 'ı': 'i', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'þ': 'th' }[ch]; });
    return t.replace(/[’'`.]/g, '').replace(/\s+/g, ' ').trim();
  }
  function option(value, label, extra) {
    var o = document.createElement('option');
    o.value = value; o.textContent = label;
    if (extra && extra.disabled) o.disabled = true;
    if (extra && extra.selected) o.selected = true;
    return o;
  }
  function myBlock(text) { return text ? '<p class="my-slot" lang="my">' + esc(text) + '</p>' : ''; }
  function countryName(c) {
    try { if (window.Intl && Intl.DisplayNames) return new Intl.DisplayNames(['en'], { type: 'region' }).of(c.c) || c.n; } catch (e) { /* fall back */ }
    return c.n;
  }
  function zoneLabel(tz) {
    var hint = (S.zoneHints || {})[tz];
    return tz.replace(/_/g, ' ') + (hint ? ' – ' + hint : '');
  }
  function usableZone(tz) {
    var tries = [tz, ZONE_ALIASES[tz]];
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      try { new Intl.DateTimeFormat('en-US', { timeZone: tries[i] }); return tries[i]; } catch (e) { /* try next */ }
    }
    return null;
  }

  /* ---------- build the form controls ---------- */

  function fillSelect(el, placeholder, items) {
    el.innerHTML = '';
    el.appendChild(option('', placeholder, { disabled: true, selected: true }));
    items.forEach(function (it) { el.appendChild(option(it[0], it[1])); });
  }

  function initForm() {
    var days = [], hours = [], mins = [], i;
    for (i = 1; i <= 31; i++) days.push([String(i), String(i)]);
    for (i = 1; i <= 12; i++) hours.push([String(i), String(i)]);
    for (i = 0; i < 60; i++) mins.push([String(i), (i < 10 ? '0' : '') + i]);
    fillSelect($('day'), 'Day', days);
    fillSelect($('month'), 'Month', MONTHS.map(function (m, idx) { return [String(idx + 1), m]; }));
    fillSelect($('hour'), 'Hr', hours);
    fillSelect($('minute'), 'Min', mins);

    var sel = $('country');
    sel.innerHTML = '';
    sel.appendChild(option('', 'Choose your birth country', { disabled: true }));
    var named = countries.map(function (c) { return { c: c, name: countryName(c) }; });
    var byName = function (a, b) { return a.name.localeCompare(b.name); };
    var pop = document.createElement('optgroup'); pop.label = 'Popular';
    POPULAR.forEach(function (code) {
      var hit = named.filter(function (x) { return x.c.c === code; })[0];
      if (hit) pop.appendChild(option(code, hit.name));
    });
    sel.appendChild(pop);
    var all = document.createElement('optgroup'); all.label = 'All countries';
    named.slice().sort(byName).forEach(function (x) { all.appendChild(option(x.c.c, x.name)); });
    sel.appendChild(all);
    sel.value = 'MM';
    onCountryChange();
  }

  /* ---------- country / city / time zone ---------- */

  function loadCities(code) {
    var info = countryByCode[code];
    state.cityList = [];
    if (!info || !info.k) return;
    function ready() {
      var raw = (S.cityData || {})[code] || [];
      if ($('country').value !== code) return; // user already picked another country
      state.cityList = raw.map(function (e) { return { name: e[0], admin: e[1], tz: e[2], f: fold(e[0]), alt: fold(e[3] || ''), lat: e[4], lon: e[5] }; });
    }
    if (S.cityData && S.cityData[code]) { ready(); return; }
    var s = document.createElement('script');
    s.src = 'data/cities/' + code + '.js';
    s.onload = ready;
    document.head.appendChild(s);
  }

  function onCountryChange() {
    var code = $('country').value, info = countryByCode[code];
    state.selectedCity = null;
    $('city').value = '';
    hideSuggest();
    $('city').placeholder = code === 'MM' ? 'e.g. Yangon' : 'Type your city or town';
    loadCities(code);

    var zoneField = $('zoneField'), zone = $('zone');
    zone.innerHTML = '';
    if (info && info.tz.length > 1) {
      zone.appendChild(option('', 'Choose the closest time zone', { selected: true }));
      info.tz.forEach(function (tz) { zone.appendChild(option(tz, zoneLabel(tz))); });
      zoneField.hidden = false;
      $('zoneHint').textContent = 'This country has more than one time zone. Pick your city above and we will fill this in, or choose the closest one.';
    } else {
      zoneField.hidden = true;
    }
  }

  function searchCities(q) {
    var f = fold(q);
    if (!f) return [];
    var hits = [];
    for (var i = 0; i < state.cityList.length && hits.length < 60; i++) {
      var c = state.cityList[i], score = -1;
      if (c.f.indexOf(f) === 0) score = 0;
      else if ((' ' + c.f).indexOf(' ' + f) !== -1 || c.f.indexOf('-' + f) !== -1) score = 1;
      else if (c.alt && (' ' + c.alt).indexOf(' ' + f) !== -1) score = 2;
      if (score >= 0) hits.push({ c: c, score: score, order: i });
    }
    hits.sort(function (a, b) { return a.score - b.score || a.order - b.order; });
    return hits.slice(0, 7).map(function (h) { return h.c; });
  }

  function hideSuggest() {
    $('citySuggest').hidden = true;
    $('city').setAttribute('aria-expanded', 'false');
    state.activeIndex = -1;
  }

  function showSuggest(items) {
    var ul = $('citySuggest');
    if (!items.length) { hideSuggest(); return; }
    ul.innerHTML = items.map(function (c, i) {
      return '<li role="option" data-i="' + i + '" id="sg' + i + '">' + esc(c.name) + (c.admin ? ' <span>' + esc(c.admin) + '</span>' : '') + '</li>';
    }).join('');
    ul._items = items;
    ul.hidden = false;
    $('city').setAttribute('aria-expanded', 'true');
    state.activeIndex = -1;
  }

  function chooseCity(c) {
    var info = countryByCode[$('country').value];
    state.selectedCity = c;
    $('city').value = c.name;
    hideSuggest();
    if (info && info.tz.length > 1) {
      $('zone').value = info.tz[c.tz];
      $('zoneHint').textContent = 'We filled this in from your city. Change it only if it looks wrong.';
    }
  }

  function exactCity(text) {
    var f = fold(text);
    for (var i = 0; i < state.cityList.length; i++) if (state.cityList[i].f === f) return state.cityList[i];
    return null;
  }

  function initCityBox() {
    var input = $('city'), ul = $('citySuggest');
    input.addEventListener('input', function () {
      state.selectedCity = null;
      var items = searchCities(input.value);
      // Typed the whole name already? Accept it and close the list so it never covers the button.
      if (items.length && fold(items[0].name) === fold(input.value) && (items.length === 1 || fold(items[1].name) !== fold(input.value))) {
        chooseCity(items[0]);
        return;
      }
      showSuggest(items);
    });
    input.addEventListener('keydown', function (e) {
      var items = ul._items || [];
      if (ul.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        state.activeIndex = (state.activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        Array.prototype.forEach.call(ul.children, function (li, i) { li.classList.toggle('active', i === state.activeIndex); });
      } else if (e.key === 'Enter' && state.activeIndex >= 0) {
        e.preventDefault();
        chooseCity(items[state.activeIndex]);
      } else if (e.key === 'Escape') hideSuggest();
    });
    input.addEventListener('blur', function () { setTimeout(hideSuggest, 150); });
    // pointerdown so a tap selects before the input loses focus
    ul.addEventListener('pointerdown', function (e) {
      var li = e.target.closest ? e.target.closest('li') : null;
      if (!li) return;
      e.preventDefault();
      chooseCity(ul._items[+li.getAttribute('data-i')]);
    });
    $('country').addEventListener('change', onCountryChange);
  }

  /* ---------- reading the form ---------- */

  function showError(msg, focusEl) {
    var el = $('formError');
    el.textContent = msg; el.hidden = false;
    if (focusEl) focusEl.focus();
  }

  function readForm() {
    var name = $('name').value.trim();
    if (!name) return { error: 'Please type your name.', el: $('name') };

    var day = parseInt($('day').value, 10), month = parseInt($('month').value, 10);
    var yearText = $('year').value.trim(), year = parseInt(yearText, 10);
    if (!day || !month) return { error: 'Please choose your birth day and month.', el: !day ? $('day') : $('month') };
    var thisYear = new Date().getFullYear();
    if (!/^\d{4}$/.test(yearText) || year < 1900 || year > thisYear) return { error: 'Please type your birth year with 4 numbers, for example 1992.', el: $('year') };
    var test = new Date(Date.UTC(year, month - 1, day));
    if (test.getUTCMonth() !== month - 1 || test.getUTCDate() !== day) return { error: 'That date does not exist. Please check the day and month.', el: $('day') };
    if (test.getTime() > Date.now() + 864e5) return { error: 'That birth date is in the future. Please check it.', el: $('year') };

    var h12 = parseInt($('hour').value, 10), minute = parseInt($('minute').value, 10);
    if (!h12 || isNaN(minute)) return { error: 'Please choose your birth time. A best estimate is fine.', el: !h12 ? $('hour') : $('minute') };
    var ampm = $('ampm').value;
    var hour = (h12 % 12) + (ampm === 'PM' ? 12 : 0);

    var code = $('country').value, info = countryByCode[code];
    if (!info) return { error: 'Please choose your birth country.', el: $('country') };
    var cityText = $('city').value.trim();
    if (!cityText) return { error: 'Please type your birth city or town.', el: $('city') };

    var tz, city = state.selectedCity || exactCity(cityText);
    if (info.tz.length === 1) tz = info.tz[0];
    else {
      if (city && !$('zone').value) $('zone').value = info.tz[city.tz];
      tz = $('zone').value;
      if (!tz) return { error: 'Please choose the time zone closest to your birth place.', el: $('zone') };
    }
    var usable = usableZone(tz);
    if (!usable) return { error: 'Sorry, this phone does not know the time zone for that place. Please try another browser.', el: $('country') };

    return {
      name: name, year: year, month: month, day: day, hour: hour, minute: minute, h12: h12, ampm: ampm,
      city: city ? city.name : cityText, countryName: countryName(info), timeZone: usable,
      lat: city && typeof city.lat === 'number' ? city.lat : null, lon: city && typeof city.lon === 'number' ? city.lon : null,
      hasCityList: !!info.k
    };
  }

  /* ---------- drawing the results ---------- */

  function fmtDate(y, m, d) { return d + ' ' + MONTHS[m - 1] + ' ' + y; }
  function fmtTimeParts(h12, minute, ampm) { return h12 + ':' + (minute < 10 ? '0' : '') + minute + ' ' + ampm; }

  function infoCard(label, title, subtitle, text, my) {
    return '<article class="card info-card"><span class="tag">' + esc(label) + '</span>' +
      '<h3>' + esc(title) + '</h3>' +
      (subtitle ? '<p class="card-sub">' + esc(subtitle) + '</p>' : '') +
      (text ? '<p>' + esc(text) + '</p>' : '') + myBlock(my) + '</article>';
  }

  function profileTitle(key) {
    var parts = key.split('/');
    return key + ' · ' + T.PROFILE_LINES[parts[0]] + ' / ' + T.PROFILE_LINES[parts[1]];
  }

  function renderSummary(chart) {
    var type = T.TYPES[chart.type], strat = T.STRATEGIES[chart.strategy], auth = T.AUTHORITIES[chart.authority];
    var prof = T.PROFILES[chart.profile], def = T.DEFINITIONS[chart.definition], angle = T.CROSS_ANGLES[chart.cross.angle];
    var notSelf = T.NOT_SELF[chart.type], sig = T.SIGNATURE[chart.type];
    var x = chart.cross;
    var crossTitle = T.crossTitle(x.angle, x.personalitySun);
    var crossGates = '(' + x.personalitySun + '/' + x.personalityEarth + ' | ' + x.designSun + '/' + x.designEarth + ')';

    var defSub = '';
    if (chart.groups.length > 1) {
      defSub = chart.groups.map(function (g) { return g.map(function (c) { return D.CENTER_NAMES[c]; }).join(', '); }).join('  |  ');
    }

    // Explanations are kept in content.js but not shown. To show one again, pass its text (and .my) as the last two arguments.
    $('summaryCards').innerHTML =
      infoCard('Type', type.name, '', '', '') +
      infoCard('Strategy', strat.name, '', '', '') +
      infoCard('Inner Authority', auth.name, '', '', '') +
      infoCard('Profile', profileTitle(chart.profile), '', '', '') +
      infoCard('Definition', def.name, defSub, '', '') +
      infoCard('Incarnation Cross', crossTitle, crossGates, '', '') +
      infoCard('Not-Self Theme', notSelf.name, '', '', '') +
      infoCard('Signature', sig.name, '', '', '');
  }

  function renderVariables(chart) {
    var rows = ['digestion', 'environment', 'motivation', 'perspective'].map(function (key) {
      var def = T.VARIABLES[key], v = chart.variables[key];
      var showDetail = CFG.showVariableDetails !== false;
      var arrowWord = v.side === 'left' ? 'Left arrow' : 'Right arrow';
      var sideName = def.sides[v.side], sub = def.subtypes[v.color - 1][v.side];
      var title = showDetail ? def.colors[v.color - 1] : 'Included in the 4 Arrows reading';
      var line = arrowWord + (sideName ? ' · ' + sideName : '') + (showDetail && sub ? ' · ' + sub : '') + (showDetail ? ' · ' + v.color + '.' + v.tone : '');
      return '<div class="var-row"><span class="var-arrow var-' + v.side + (key === 'digestion' || key === 'environment' ? ' var-design' : ' var-personality') + '" aria-hidden="true"></span><div>' +
        '<p class="var-name">' + esc(def.title) + ' <span class="muted">· ' + esc(def.where) + '</span></p>' +
        '<p class="var-title">' + esc(title) + '</p><p class="muted var-line">' + esc(line) + '</p>' +
        '</div></div>';
    }).join('');
    var link = CFG.arrowsLink || {};
    $('variablesCard').innerHTML = '<span class="tag">4 Arrows</span><h3>Your 4 Arrows</h3>' +
      '<div class="var-grid">' + rows + '</div>' +
      (link.href ? '<p class="var-cta"><a class="btn" href="' + esc(link.href) + '">' + esc(link.label || 'Get my 4 Arrows reading') + '</a></p>' : '');
  }

  function renderCenters(chart) {
    function list(arr) {
      return arr.length ? '<ul class="sparkle-list cols">' + arr.map(function (c) { return '<li>' + esc(D.CENTER_NAMES[c]) + '</li>'; }).join('') + '</ul>' : '<p class="muted">None</p>';
    }
    $('centersCard').innerHTML =
      '<h3>Your centers</h3>' +
      '<div class="two-col"><div><h4><span class="dot dot-def"></span>Defined</h4>' + list(chart.definedCenterList) + '</div>' +
      '<div><h4><span class="dot dot-open"></span>Open</h4>' + list(chart.openCenterList) + '</div></div>';
  }

  function renderChannels(chart) {
    var body;
    if (!chart.channels.length) {
      body = '<p class="muted">None</p>';
    } else {
      body = '<ul class="sparkle-list">' + chart.channels.map(function (ch) {
        return '<li><span class="chan-key">' + ch.a + '&ndash;' + ch.b + '</span> <strong>' + esc(ch.name) + '</strong> <span class="muted">' +
          esc(D.CENTER_NAMES[ch.centers[0]]) + ' &harr; ' + esc(D.CENTER_NAMES[ch.centers[1]]) + '</span></li>';
      }).join('') + '</ul>';
    }
    $('channelsCard').innerHTML = '<h3>Your defined channels</h3>' + body;
  }

  function renderGates(chart, tz) {
    var designDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }).format(chart.designUtc);
    var rows = D.BODIES.map(function (b) {
      var p = chart.personality[b.key], d = chart.design[b.key];
      return '<tr><th scope="row">' + esc(b.name) + '</th>' +
        '<td><span class="gl gl-p">' + p.gate + '.' + p.line + '</span></td>' +
        '<td><span class="gl gl-d">' + d.gate + '.' + d.line + '</span></td></tr>';
    }).join('');
    $('gatesCard').innerHTML = '<h3>Your activated gates</h3>' +
      '<p class="muted">Design date: ' + esc(designDay) + '</p>' +
      '<table class="gates"><thead><tr><th></th><th scope="col"><span class="dot dot-p"></span>Personality</th><th scope="col"><span class="dot dot-d"></span>Design</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function showResults(inputs, chart) {
    $('resultsSub').textContent = 'For ' + inputs.name + ' · born ' + fmtDate(inputs.year, inputs.month, inputs.day) + ', ' +
      fmtTimeParts(inputs.h12, inputs.minute, inputs.ampm) + ' · ' + inputs.city + ', ' + inputs.countryName + ' (' + chart.timeInfo.offsetLabel + ')';

    var notice = $('resultsNotice');
    if (chart.timeInfo.nonexistent) {
      notice.textContent = 'On that day the clocks jumped forward, so that exact time did not happen. Please double-check your birth time.';
      notice.hidden = false;
    } else if (chart.timeInfo.ambiguous) {
      notice.textContent = 'On that day the clocks were turned back, so that time happened twice. We used the first one. If you were born the second time around, please let Alex know.';
      notice.hidden = false;
    } else notice.hidden = true;

    $('bodygraph').innerHTML = S.bodygraph.render(chart);
    renderSummary(chart);
    renderVariables(chart);
    renderCenters(chart);
    renderChannels(chart);
    renderGates(chart, inputs.timeZone);

    $('birthResults').hidden = true;
    showCross('hd');
    var res = $('results');
    res.hidden = false;
    var title = $('resultsTitle');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    title.focus({ preventScroll: true });
  }

  var NO_COORDS = 'Please choose your birth city from the suggestions (type the first letters, then tap your city) so we can place the Ascendant and houses. If your town is not listed, choose the nearest bigger town.\nမွေးဖွားရာ မြို့ကို အကြံပြုစာရင်းထဲက ရွေးပေးပါ (စာလုံးအနည်းငယ်ရိုက်ပြီး မြို့ကို နှိပ်ပါ)။ မရှိရင် အနီးဆုံး မြို့ကြီးကို ရွေးပါ။';
  var NO_LIST = 'Sorry, we do not have a city list for this country yet, so we cannot place a Birth Chart. You can still see your Human Design Chart, or message Alex.\nတောင်းပန်ပါတယ်၊ ဒီနိုင်ငံအတွက် မြို့စာရင်း မရှိသေးလို့ Birth Chart ကို မတွက်နိုင်ပါဘူး။ Human Design Chart ကိုတော့ ကြည့်နိုင်ပါတယ်။';

  function runHD(inputs) {
    var chart;
    try {
      chart = C.calculateChart({ year: inputs.year, month: inputs.month, day: inputs.day, hour: inputs.hour, minute: inputs.minute, timeZone: inputs.timeZone });
    } catch (err) {
      showError('Sorry, something went wrong while calculating. Please check your details and try again.');
      if (window.console) console.error(err);
      return;
    }
    showResults(inputs, chart);
  }

  function runBirth(inputs) {
    if (inputs.lat === null || inputs.lon === null) { showError(inputs.hasCityList ? NO_COORDS : NO_LIST, $('city')); return; }
    var conv;
    try { conv = C.localToUtc(inputs.year, inputs.month, inputs.day, inputs.hour, inputs.minute, inputs.timeZone); }
    catch (err) { showError('Sorry, something went wrong while calculating. Please check your details and try again.'); if (window.console) console.error(err); return; }
    $('results').hidden = true;
    showCross('birth');
    S.birth.show({
      name: inputs.name, city: inputs.city, countryName: inputs.countryName, lat: inputs.lat, lon: inputs.lon,
      utcMs: conv.ms, offsetLabel: C.offsetLabel(conv.offset), ambiguous: conv.ambiguous, nonexistent: conv.nonexistent,
      fmtDate: fmtDate(inputs.year, inputs.month, inputs.day), fmtTime: fmtTimeParts(inputs.h12, inputs.minute, inputs.ampm)
    });
  }

  function run(inputs) {
    state.lastInputs = inputs;
    if (state.type === 'birth') runBirth(inputs); else runHD(inputs);
  }

  function onSubmit(e) {
    e.preventDefault();
    $('formError').hidden = true;
    var inputs = readForm();
    if (inputs.error) { showError(inputs.error, inputs.el); return; }
    run(inputs);
  }

  /* ---------- choosing a chart ---------- */

  function setType(type) {
    state.type = type;
    var t = TYPES[type];
    $('typeName').textContent = t.name;
    $('submitEn').textContent = t.submitEn;
    $('submitMy').textContent = t.submitMy;
    $('switchEn').textContent = t.switchEn;
    $('switchMy').textContent = t.switchMy;
    $('formError').hidden = true;
    if (type === 'birth' && S.birth) S.birth.preload(); // start fetching the engine while they fill in the form
  }

  function chooseType(type) {
    setType(type);
    $('stepChoose').hidden = true;
    $('stepDetails').hidden = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('stepDetails').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setTimeout(function () { $('name').focus({ preventScroll: true }); }, 350);
  }

  // The "see the other chart too" row under the results. Kept outside both result sections.
  function showCross(shown) {
    var other = TYPES[shown].other;
    $('cross').hidden = false;
    if (other === 'birth') {
      $('crossEn').textContent = 'Want to see your Birth Chart too? Your details are already filled in.';
      $('crossMy').textContent = 'Birth Chart ကိုပါ ကြည့်ချင်ပါသလား? အချက်အလက်တွေ ဖြည့်ပြီးသားပါ။';
      $('crossBtnEn').textContent = 'See my Birth Chart too';
      $('crossBtnMy').textContent = 'Birth Chart ကိုပါ ကြည့်မယ်';
    } else {
      $('crossEn').textContent = 'Want to see your Human Design Chart too? Your details are already filled in.';
      $('crossMy').textContent = 'Human Design Chart ကိုပါ ကြည့်ချင်ပါသလား? အချက်အလက်တွေ ဖြည့်ပြီးသားပါ။';
      $('crossBtnEn').textContent = 'See my Human Design Chart too';
      $('crossBtnMy').textContent = 'Human Design Chart ကိုပါ ကြည့်မယ်';
    }
    $('crossBtn').setAttribute('data-show', other);
  }

  /* ---------- enlarge the chart ---------- */

  function zoomSvg(container) {
    var svg = container && container.querySelector('svg');
    if (!svg) return;
    $('bgZoomBody').innerHTML = '';
    $('bgZoomBody').appendChild(svg.cloneNode(true));
    $('bgZoom').hidden = false;
    document.body.style.overflow = 'hidden';
    $('bgZoomClose').focus();
  }
  function openZoom() { zoomSvg($('bodygraph')); }
  function closeZoom() {
    $('bgZoom').hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- start ---------- */

  function init() {
    initForm();
    initCityBox();
    $('chartForm').addEventListener('submit', onSubmit);
    $('againBtn').addEventListener('click', function () { setTimeout(function () { $('name').focus(); }, 400); });
    $('againBtnBirth').addEventListener('click', function () { setTimeout(function () { $('name').focus(); }, 400); });
    Array.prototype.forEach.call(document.querySelectorAll('.choice'), function (b) {
      b.addEventListener('click', function () { chooseType(b.getAttribute('data-chart')); });
    });
    $('switchType').addEventListener('click', function () { setType(TYPES[state.type].other); });
    $('crossBtn').addEventListener('click', function () {
      if (!state.lastInputs) return;
      setType($('crossBtn').getAttribute('data-show'));
      run(state.lastInputs);
    });
    $('year').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    $('bodygraph').addEventListener('click', openZoom);
    S.ui = { zoomSvg: zoomSvg };
    $('bgZoomClose').addEventListener('click', closeZoom);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('bgZoom').hidden) closeZoom(); });
    $('footMessenger').href = CFG.messengerUrl || $('footMessenger').href;
    $('footFacebook').href = CFG.facebookUrl || $('footFacebook').href;
    if (CFG.messengerUrl) {
      $('inviteMessenger').href = CFG.messengerUrl;
      $('inviteHD').href = CFG.messengerUrl;
    }
    if (CFG.readingsUrl) $('inviteReadings').href = CFG.readingsUrl;
    if (CFG.messengerUrl) { $('inviteBirthMessenger').href = CFG.messengerUrl; $('inviteBirthHD').href = CFG.messengerUrl; }
    if (CFG.birthReadingUrl) $('inviteBirthReading').href = CFG.birthReadingUrl;
    $('footYear').textContent = new Date().getFullYear();
  }

  init();
}());
