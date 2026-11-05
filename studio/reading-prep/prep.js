/* Reading Prep page logic: client form, chart + astrology, outline with notes saved per client in this browser. */
(function () {
  'use strict';

  var S = window.Soulprint, D = S.data, C = S.calc, T = S.content, A = S.astro, O = S.outline;
  var $ = function (id) { return document.getElementById(id); };

  var POPULAR = ['MM', 'TH', 'SG', 'MY', 'US', 'AU', 'GB', 'JP', 'KR', 'CA', 'AE', 'IN'];
  // Old names for time zones, in case a phone's browser does not know the newer name yet (same list as the chart page).
  var ZONE_ALIASES = {
    'Asia/Yangon': 'Asia/Rangoon', 'Europe/Kyiv': 'Europe/Kiev', 'Asia/Kolkata': 'Asia/Calcutta',
    'Asia/Ho_Chi_Minh': 'Asia/Saigon', 'Asia/Kathmandu': 'Asia/Katmandu', 'America/Nuuk': 'America/Godthab',
    'Pacific/Kanton': 'Pacific/Enderbury', 'America/Ciudad_Juarez': 'America/Ojinaga'
  };

  var countries = S.countries || [];
  var countryByCode = {};
  countries.forEach(function (c) { countryByCode[c.c] = c; });

  var storage = (function () {
    try { var s = window.localStorage, k = '__soulprint_probe'; s.setItem(k, '1'); s.removeItem(k); return s; } catch (e) { return null; }
  }());
  var store = S.store.createStore(storage);

  var state = {
    places: [],          // places of the chosen country, ready to search
    autoFilled: false,   // latitude / longitude / zone came from a picked suggestion (not typed by hand)
    activeIndex: -1,
    client: null,        // the client being worked on: { id, inputs, notes }
    summary: null,       // plain-words chart facts for that client
    saveTimer: null,
    dirty: false
  };

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  }
  function fold(s) {
    var t = String(s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/[’'`.]/g, '').replace(/\s+/g, ' ').trim();
  }
  function option(value, label, extra) {
    var o = document.createElement('option');
    o.value = value; o.textContent = label;
    if (extra && extra.disabled) o.disabled = true;
    if (extra && extra.selected) o.selected = true;
    return o;
  }
  function countryName(c) {
    try { if (window.Intl && Intl.DisplayNames) return new Intl.DisplayNames(['en'], { type: 'region' }).of(c.c) || c.n; } catch (e) { /* fall back */ }
    return c.n;
  }
  // "Myanmar (Burma)" -> "Myanmar", so the birth line never has two sets of brackets.
  function shortCountryName(c) { return countryName(c).replace(/\s*\([^)]*\)\s*$/, ''); }
  function usableZone(tz) {
    var tries = [tz, ZONE_ALIASES[tz]];
    for (var i = 0; i < tries.length; i++) {
      if (!tries[i]) continue;
      try { new Intl.DateTimeFormat('en-US', { timeZone: tries[i] }); return tries[i]; } catch (e) { /* try next */ }
    }
    return null;
  }
  function reduceMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function todayIso() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  var toastTimer = null;
  function toast(msg) {
    var el = $('toast');
    el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2600);
  }

  /* ---------- the form ---------- */

  function zoneLabel(tz) { return tz.replace(/_/g, ' '); }

  function ensureZoneOption(tz) {
    var sel = $('zone');
    for (var i = 0; i < sel.options.length; i++) if (sel.options[i].value === tz) return;
    sel.appendChild(option(tz, zoneLabel(tz)));
  }

  function initForm() {
    $('birthDate').max = todayIso();
    var sel = $('country');
    sel.innerHTML = '';
    sel.appendChild(option('', 'Choose birth country', { disabled: true }));
    var named = countries.map(function (c) { return { c: c, name: countryName(c) }; });
    var pop = document.createElement('optgroup'); pop.label = 'Popular';
    POPULAR.forEach(function (code) {
      var hit = named.filter(function (x) { return x.c.c === code; })[0];
      if (hit) pop.appendChild(option(code, hit.name));
    });
    sel.appendChild(pop);
    var all = document.createElement('optgroup'); all.label = 'All countries';
    named.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).forEach(function (x) { all.appendChild(option(x.c.c, x.name)); });
    sel.appendChild(all);
    sel.value = 'MM';
    onCountryChange();
  }

  function resetPlaceFields() {
    $('place').value = '';
    $('lat').value = '';
    $('lon').value = '';
    state.autoFilled = false;
    hideSuggest();
  }

  function onCountryChange() {
    var code = $('country').value, info = countryByCode[code];
    resetPlaceFields();
    $('place').placeholder = code === 'MM' ? 'e.g. Yangon' : 'Type the city or town';
    loadPlaces(code);
    fillZoneOptions(info);
  }

  // Lists the country's time zones. A country with one zone picks it for you; otherwise choose, or pick a place and it fills in.
  function fillZoneOptions(info) {
    var zone = $('zone');
    zone.innerHTML = '';
    if (!info) return;
    if (info.tz.length === 1) {
      zone.appendChild(option(info.tz[0], zoneLabel(info.tz[0]), { selected: true }));
    } else {
      zone.appendChild(option('', 'Choose the time zone', { selected: true }));
      info.tz.forEach(function (tz) { zone.appendChild(option(tz, zoneLabel(tz))); });
    }
  }

  function loadPlaces(code) {
    state.places = [];
    function ready() {
      if ($('country').value !== code) return; // another country was picked meanwhile
      var P = (S.places || {})[code];
      if (!P) return;
      state.places = P.c.map(function (e) {
        return { name: e[0], admin: e[1], lat: e[2], lon: e[3], tz: P.tz[e[4]], f: fold(e[0]), alt: fold(e[5] || '') };
      });
    }
    if (S.places && S.places[code]) { ready(); return; }
    var s = document.createElement('script');
    s.src = 'data/places/' + encodeURIComponent(code) + '.js?v=1';
    s.onload = ready;
    s.onerror = function () { /* no list for this country: coordinates are typed by hand */ };
    document.head.appendChild(s);
  }

  function searchPlaces(q) {
    var f = fold(q);
    if (!f) return [];
    var hits = [];
    for (var i = 0; i < state.places.length && hits.length < 80; i++) {
      var c = state.places[i], score = -1;
      if (c.f.indexOf(f) === 0) score = 0;
      else if ((' ' + c.f).indexOf(' ' + f) !== -1 || c.f.indexOf('-' + f) !== -1) score = 1;
      else if (c.alt && (' ' + c.alt).indexOf(' ' + f) !== -1) score = 2;
      if (score >= 0) hits.push({ c: c, score: score, order: i });
    }
    hits.sort(function (a, b) { return a.score - b.score || a.order - b.order; });
    return hits.slice(0, 7).map(function (h) { return h.c; });
  }

  function hideSuggest() {
    $('placeSuggest').hidden = true;
    $('place').setAttribute('aria-expanded', 'false');
    state.activeIndex = -1;
  }

  function showSuggest(items) {
    var ul = $('placeSuggest');
    if (!items.length) { hideSuggest(); return; }
    ul.innerHTML = items.map(function (c, i) {
      return '<li role="option" data-i="' + i + '">' + esc(c.name) + (c.admin ? ' <span>' + esc(c.admin) + '</span>' : '') + '</li>';
    }).join('');
    ul._items = items;
    ul.hidden = false;
    $('place').setAttribute('aria-expanded', 'true');
    state.activeIndex = -1;
  }

  function choosePlace(p) {
    $('place').value = p.name;
    $('lat').value = String(p.lat);
    $('lon').value = String(p.lon);
    var zone = usableZone(p.tz) ? p.tz : null;
    if (zone) { ensureZoneOption(zone); $('zone').value = zone; }
    state.autoFilled = true;
    hideSuggest();
  }

  function exactPlace(text) {
    var f = fold(text);
    for (var i = 0; i < state.places.length; i++) if (state.places[i].f === f) return state.places[i];
    return null;
  }

  function initPlaceBox() {
    var input = $('place'), ul = $('placeSuggest');
    input.addEventListener('input', function () {
      // Typing a different place must never leave the previous place's coordinates behind.
      if (state.autoFilled) {
        $('lat').value = ''; $('lon').value = '';
        var info = countryByCode[$('country').value];
        if (info && info.tz.length > 1) $('zone').value = '';
        state.autoFilled = false;
      }
      var items = searchPlaces(input.value);
      if (items.length && fold(items[0].name) === fold(input.value) && (items.length === 1 || fold(items[1].name) !== fold(input.value))) {
        choosePlace(items[0]);
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
        choosePlace(items[state.activeIndex]);
      } else if (e.key === 'Escape') hideSuggest();
    });
    input.addEventListener('blur', function () { setTimeout(hideSuggest, 150); });
    ul.addEventListener('pointerdown', function (e) { // pointerdown so a tap selects before the box loses focus
      var li = e.target.closest ? e.target.closest('li') : null;
      if (!li) return;
      e.preventDefault();
      choosePlace(ul._items[+li.getAttribute('data-i')]);
    });
    $('country').addEventListener('change', onCountryChange);
    ['lat', 'lon'].forEach(function (id) { $(id).addEventListener('input', function () { state.autoFilled = false; }); });
    $('timeUnknown').addEventListener('change', syncTimeUnknown);
  }

  function syncTimeUnknown() {
    var off = $('timeUnknown').checked;
    $('birthTime').disabled = off;
    if (off) $('birthTime').value = '12:00';
  }

  function showError(msg, focusEl) {
    var el = $('formError');
    el.textContent = msg; el.hidden = false;
    if (focusEl) focusEl.focus();
  }

  // Reads and checks the form. Returns the saved shape of a client's details, or { error, el }.
  function readForm() {
    var name = $('name').value.trim();
    if (!name) return { error: 'Please type the client’s name.', el: $('name') };

    var date = $('birthDate').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Please choose the birth date.', el: $('birthDate') };
    var p = date.split('-').map(Number);
    var test = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    if (p[0] < 1900 || test.getUTCMonth() !== p[1] - 1 || test.getUTCDate() !== p[2]) return { error: 'That birth date does not look right. Please check it.', el: $('birthDate') };
    if (test.getTime() > Date.now() + 864e5) return { error: 'That birth date is in the future. Please check it.', el: $('birthDate') };

    var unknown = $('timeUnknown').checked;
    var time = unknown ? '12:00' : $('birthTime').value;
    if (!/^\d{2}:\d{2}/.test(time)) return { error: 'Please choose the birth time, or tick “Time unknown”.', el: $('birthTime') };
    time = time.slice(0, 5);

    var code = $('country').value, info = countryByCode[code];
    if (!info) return { error: 'Please choose the birth country.', el: $('country') };
    var place = $('place').value.trim();
    if (!place) return { error: 'Please type the birth city or town.', el: $('place') };

    // A place typed in full but never tapped: use it if the list knows it.
    if (!$('lat').value.trim() && !$('lon').value.trim()) {
      var hit = exactPlace(place);
      if (hit) choosePlace(hit);
    }
    var lat = A.parseCoordinate($('lat').value, 'lat'), lon = A.parseCoordinate($('lon').value, 'lon');
    if (isNaN(lat) || isNaN(lon)) {
      var bad = isNaN(lat) ? $('lat') : $('lon');
      return { error: $('lat').value.trim() || $('lon').value.trim()
        ? 'Please check the latitude and longitude (for example 16.81 and 96.16, or 33.87 S).'
        : 'Pick the town from the suggestions, or type its latitude and longitude. The Rising sign needs them.', el: bad };
    }

    var tz = $('zone').value;
    if (!tz) return { error: 'Please choose the time zone.', el: $('zone') };
    if (!usableZone(tz)) return { error: 'This browser does not know that time zone. Please try another browser.', el: $('zone') };

    // fromList: the coordinates came from a picked suggestion, so editing the place later must clear them (never keep another town's).
    return { name: name, date: date, time: time, timeUnknown: unknown, country: code, countryName: shortCountryName(info), place: place, lat: lat, lon: lon, tz: tz, fromList: state.autoFilled };
  }

  function fillForm(inputs) {
    $('name').value = inputs.name;
    $('birthDate').value = inputs.date;
    $('timeUnknown').checked = !!inputs.timeUnknown;
    $('birthTime').value = inputs.time;
    syncTimeUnknown();
    $('country').value = inputs.country;
    if ($('country').value !== inputs.country) $('country').value = '';
    var info = countryByCode[$('country').value];
    resetPlaceFields();
    loadPlaces($('country').value);
    fillZoneOptions(info);
    $('place').value = inputs.place;
    $('lat').value = String(inputs.lat);
    $('lon').value = String(inputs.lon);
    ensureZoneOption(inputs.tz);
    $('zone').value = inputs.tz;
    state.autoFilled = !!inputs.fromList;
    $('formError').hidden = true;
  }

  /* ---------- calculating ---------- */

  function compute(inputs) {
    var d = inputs.date.split('-').map(Number), t = inputs.time.split(':').map(Number);
    var chart = C.calculateChart({ year: d[0], month: d[1], day: d[2], hour: t[0], minute: t[1], timeZone: usableZone(inputs.tz) });
    var astro = A.astrologyAt(chart.birthUtc.getTime(), inputs.lat, inputs.lon);
    return { chart: chart, astro: astro, summary: O.summarize(chart, astro, T, D, inputs) };
  }

  /* ---------- drawing the chart ---------- */

  function rows(list) {
    return '<dl>' + list.map(function (r) {
      return '<div class="row"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + (r[2] ? '<small>' + esc(r[2]) + '</small>' : '') + '</dd></div>';
    }).join('') + '</dl>';
  }

  function renderGlance(s) {
    $('glanceCard').innerHTML = '<h3>Human Design at a glance</h3>' + rows([
      ['Type', s.type],
      ['Strategy', s.strategy],
      ['Authority', s.authority],
      ['Profile', s.profile, s.profileName],
      ['Definition', s.definition, s.definitionGroups],
      ['Incarnation Cross', s.cross, s.crossGates],
      ['Not-self theme', s.notSelf],
      ['Signature', s.signature]
    ]);
  }

  function renderAstro(s) {
    $('astroCard').innerHTML = '<h3>Astrology</h3>' + rows([['Sun', s.sun], ['Moon', s.moon], ['Rising', s.rising]]) +
      (s.risingNote ? '<p class="astro-note">' + esc(s.risingNote) + '</p>' : '');
  }

  function renderCenters(chart) {
    function list(arr) {
      return arr.length ? '<ul class="sparkle-list cols">' + arr.map(function (c) { return '<li>' + esc(D.CENTER_NAMES[c]) + '</li>'; }).join('') + '</ul>' : '<p class="muted">None</p>';
    }
    $('centersCard').innerHTML =
      '<h3>Centers</h3>' +
      '<div class="two-col"><div><h4><span class="dot dot-def"></span>Defined</h4>' + list(chart.definedCenterList) + '</div>' +
      '<div><h4><span class="dot dot-open"></span>Open</h4>' + list(chart.openCenterList) + '</div></div>';
  }

  function renderChannels(chart, s) {
    var body = chart.channels.length
      ? '<ul class="sparkle-list">' + chart.channels.map(function (ch) {
        return '<li><span class="chan-key">' + ch.a + '&ndash;' + ch.b + '</span> <strong>' + esc(ch.name) + '</strong> <span class="muted">' +
          esc(D.CENTER_NAMES[ch.centers[0]]) + ' &harr; ' + esc(D.CENTER_NAMES[ch.centers[1]]) + '</span></li>';
      }).join('') + '</ul>'
      : '<p class="muted">No defined channels</p>';
    var hang = s.hangingGates.length ? '<p class="muted" style="margin-top:14px"><strong>Hanging gates</strong> (active, not part of a channel): ' + s.hangingGates.join(', ') + '</p>' : '';
    $('channelsCard').innerHTML = '<h3>Defined channels</h3>' + body + hang;
  }

  function renderGates(chart, tz) {
    var designDay = new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }).format(chart.designUtc);
    var trs = D.BODIES.map(function (b) {
      var p = chart.personality[b.key], d = chart.design[b.key];
      return '<tr><th scope="row">' + esc(b.name) + '</th><td><span class="gl gl-p">' + p.gate + '.' + p.line + '</span></td><td><span class="gl gl-d">' + d.gate + '.' + d.line + '</span></td></tr>';
    }).join('');
    $('gatesCard').innerHTML = '<h3>Activated gates</h3><p class="muted">Design date: ' + esc(designDay) + '</p>' +
      '<table class="gates"><thead><tr><th></th><th scope="col"><span class="dot dot-p"></span>Personality</th><th scope="col"><span class="dot dot-d"></span>Design</th></tr></thead><tbody>' + trs + '</tbody></table>';
  }

  function renderNotices(inputs, chart, astro) {
    var out = [];
    if (inputs.timeUnknown) out.push('Birth time unknown: noon was used. The Rising sign, the Moon’s degree, the lines and sometimes the Profile or gates can differ from the real chart.');
    if (chart.timeInfo.nonexistent) out.push('On that day the clocks jumped forward, so that exact time did not happen. Please double-check the birth time.');
    else if (chart.timeInfo.ambiguous) out.push('On that day the clocks were turned back, so that time happened twice. The first one was used.');
    $('notices').innerHTML = out.map(function (m) { return '<p class="notice">' + esc(m) + '</p>'; }).join('');
  }

  /* ---------- the outline and notes ---------- */

  function renderOutline(client, summary) {
    var cue = O.cues(summary), html = '', n = 0;
    O.GROUPS.forEach(function (g) {
      var secs = O.SECTIONS.filter(function (s) { return s.group === g.id; });
      if (!secs.length) return;
      html += '<h3 class="group-title">' + esc(g.title) + '</h3>';
      secs.forEach(function (s) {
        n++;
        html += '<article class="note-card" id="sec-' + s.id + '">' +
          '<div class="note-head"><span class="note-num" aria-hidden="true">' + n + '</span><h4>' + esc(s.title) + '</h4></div>' +
          (cue[s.id] ? '<p class="cue">' + esc(cue[s.id]) + '</p>' : '') +
          '<p class="prompt">' + esc(s.prompt) + '</p>' +
          '<textarea class="note" id="note-' + s.id + '" data-sec="' + s.id + '" rows="4" aria-label="Notes: ' + esc(s.title) + '" placeholder="Notes…"></textarea>' +
          '</article>';
      });
    });
    $('outline').innerHTML = html;
    Array.prototype.forEach.call($('outline').querySelectorAll('textarea.note'), function (ta) {
      ta.value = (client.notes || {})[ta.getAttribute('data-sec')] || '';
    });
    requestAnimationFrame(function () {
      Array.prototype.forEach.call($('outline').querySelectorAll('textarea.note'), autosize);
    });
  }

  function autosize(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(ta.scrollHeight + 2, 112) + 'px';
  }

  function setStatus(text, bad) {
    var el = $('saveStatus');
    el.textContent = text;
    el.classList.toggle('bad', !!bad);
  }

  function timeNow() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes();
    return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function scheduleSave() {
    state.dirty = true;
    setStatus('Saving…');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(flush, 500);
  }

  function flush() {
    clearTimeout(state.saveTimer);
    if (!state.client || !state.dirty) return;
    state.dirty = false;
    var ok = store.save(state.client);
    if (ok) setStatus('Saved at ' + timeNow() + ' · this browser only');
    else setStatus('Could not save in this browser. Use “Copy all notes” before you leave.', true);
    refreshSaved();
  }

  /* ---------- saved clients ---------- */

  function refreshSaved() {
    var list = store.list(), sel = $('savedPick');
    $('savedCard').hidden = list.length === 0;
    sel.innerHTML = '';
    sel.appendChild(option('', list.length ? 'Open a saved client (' + list.length + ')' : '', { selected: !state.client }));
    list.forEach(function (c) {
      var o = option(c.id, c.inputs.name + ' · ' + O.fmtDate(c.inputs.date));
      if (state.client && state.client.id === c.id) o.selected = true;
      sel.appendChild(o);
    });
    $('storageWarn').hidden = store.persistent;
  }

  function openClient(client, opts) {
    flush();
    var calc;
    try { calc = compute(client.inputs); } catch (err) {
      showError('Sorry, this client’s chart could not be calculated. Please check the details and prepare again.');
      if (window.console) console.error(err);
      return false;
    }
    state.client = client;
    state.summary = calc.summary;
    fillForm(client.inputs);
    $('editHint').textContent = 'Updating ' + client.inputs.name + '’s details keeps their notes. Use “New client” to start someone else.';
    $('editHint').hidden = false;

    $('resultsTitle').textContent = client.inputs.name;
    $('birthLine').textContent = calc.summary.birth;
    renderNotices(client.inputs, calc.chart, calc.astro);
    $('bodygraph').innerHTML = S.bodygraph.render(calc.chart);
    renderGlance(calc.summary);
    renderAstro(calc.summary);
    renderCenters(calc.chart);
    renderChannels(calc.chart, calc.summary);
    renderGates(calc.chart, usableZone(client.inputs.tz));
    renderOutline(client, calc.summary);
    setStatus(store.persistent ? 'Notes save automatically' : 'Notes will not be remembered in this browser', !store.persistent);

    $('results').hidden = false;
    refreshSaved();
    if (!opts || !opts.quiet) {
      $('results').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
      $('resultsTitle').focus({ preventScroll: true });
    }
    return true;
  }

  function onSubmit(e) {
    e.preventDefault();
    $('formError').hidden = true;
    var inputs = readForm();
    if (inputs.error) { showError(inputs.error, inputs.el); return; }
    try { compute(inputs); } catch (err) {
      showError('Sorry, something went wrong while calculating. Please check the details and try again.');
      if (window.console) console.error(err);
      return;
    }
    flush();
    var client = state.client
      ? { id: state.client.id, created: state.client.created, inputs: inputs, notes: state.client.notes || {} }
      : { id: store.newId(), inputs: inputs, notes: {} };
    store.save(client);
    openClient(store.get(client.id) || client);
  }

  function newClient() {
    flush();
    state.client = null; state.summary = null;
    $('results').hidden = true;
    $('editHint').hidden = true;
    $('name').value = ''; $('birthDate').value = ''; $('birthTime').value = ''; $('timeUnknown').checked = false;
    syncTimeUnknown();
    $('country').value = 'MM';
    onCountryChange();
    $('formError').hidden = true;
    refreshSaved();
    window.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
    $('name').focus({ preventScroll: true });
  }

  function deleteClient() {
    if (!state.client) return;
    var name = state.client.inputs.name;
    if (!window.confirm('Delete ' + name + ' and all their notes from this browser? This cannot be undone.')) return;
    clearTimeout(state.saveTimer);
    state.dirty = false;
    store.remove(state.client.id);
    newClient();
    toast(name + ' deleted');
  }

  /* ---------- copy all notes ---------- */

  function copyAll() {
    if (!state.client || !state.summary) return;
    var text = O.copyText(state.client, state.summary);
    function fallback() {
      var ta = $('copyText'), ok = false;
      $('copyFallback').hidden = false;
      ta.value = text; ta.focus(); ta.select();
      try { ok = document.execCommand && document.execCommand('copy'); } catch (e) { ok = false; }
      if (ok) { $('copyFallback').hidden = true; toast('Copied all notes'); }
      else ta.scrollIntoView({ block: 'center' });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { $('copyFallback').hidden = true; toast('Copied all notes'); }, fallback);
    } else fallback();
  }

  /* ---------- enlarge the chart ---------- */

  function openZoom() {
    var svg = $('bodygraph').querySelector('svg');
    if (!svg) return;
    $('bgZoomBody').innerHTML = '';
    $('bgZoomBody').appendChild(svg.cloneNode(true));
    $('bgZoom').hidden = false;
    document.body.style.overflow = 'hidden';
    $('bgZoomClose').focus();
  }
  function closeZoom() {
    $('bgZoom').hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- start ---------- */

  function init() {
    initForm();
    initPlaceBox();
    $('prepForm').addEventListener('submit', onSubmit);
    $('newBtn').addEventListener('click', newClient);
    $('deleteBtn').addEventListener('click', deleteClient);
    $('savedPick').addEventListener('change', function () {
      var c = this.value ? store.get(this.value) : null;
      if (c) openClient(c); else refreshSaved();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (b) { b.addEventListener('click', copyAll); });
    $('outline').addEventListener('input', function (e) {
      var ta = e.target;
      if (!ta.matches || !ta.matches('textarea.note') || !state.client) return;
      state.client.notes = state.client.notes || {};
      state.client.notes[ta.getAttribute('data-sec')] = ta.value;
      autosize(ta);
      scheduleSave();
    });
    $('bodygraph').addEventListener('click', openZoom);
    $('bgZoomClose').addEventListener('click', closeZoom);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('bgZoom').hidden) closeZoom(); });
    // Never lose the last few keystrokes when the page is closed or put in the background.
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });

    refreshSaved();
    var last = store.getLastId();
    if (last) openClient(store.get(last), { quiet: true });
  }

  init();
}());
