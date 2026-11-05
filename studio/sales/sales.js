/* Sales Tracker — private, runs only in this browser. Data: localStorage + JSON backup. */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'soulprint-sales-v1';
  var DEFAULT_GOAL = 50000;
  var STATUSES = ['paid', 'deposit', 'pending'];
  var STATUS_LABEL = { paid: 'Paid', deposit: 'Deposit paid', pending: 'Not paid yet' };

  // Names and THB prices match the category pages. The price pre-fills the amount; you can change it.
  var PACKAGES = [
    { name: 'Aligned Love — Mini', price: 444 },
    { name: 'Synastry Chart Package', price: 800 },
    { name: 'Aligned Wealth & Career — Mini', price: 444 },
    { name: 'Karmic Healing & Aura Protection — Mini', price: 444 },
    { name: 'Transit — 3 Months', price: 444 },
    { name: 'Transit — 6 Months', price: 666 },
    { name: 'Progressed Chart', price: 1222 },
    { name: 'Birth Chart — Full Chart', price: 1222 },
    { name: 'Human Design — Full Chart', price: 1222 },
    { name: 'HD 4 Arrows', price: 800 },
    { name: 'HD Healing', price: 444 },
    { name: 'HD Love', price: 444 },
    { name: 'HD Wealth & Career', price: 444 },
    { name: '2027 Cosmic Roadmap', price: 1444 },
    { name: 'Other', price: 0 }
  ];

  /* ---------- pure logic (tested in tests/sales.test.js) ---------- */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr(now) {
    var d = now || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function monthKey(dateStr) { return String(dateStr).slice(0, 7); }

  function validDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = s.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    return d.getFullYear() === p[0] && d.getMonth() === p[1] - 1 && d.getDate() === p[2];
  }

  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // Returns a clean sale, or null if it can't be used.
  function cleanSale(s) {
    if (!s || typeof s !== 'object') return null;
    var amount = Math.round(Number(s.amount));
    if (!validDate(s.date) || !isFinite(amount) || amount < 0) return null;
    return {
      id: typeof s.id === 'string' && s.id ? s.id.slice(0, 40) : newId(),
      date: s.date,
      client: String(s.client == null ? '' : s.client).trim().slice(0, 80),
      pkg: String(s.pkg == null ? 'Other' : s.pkg).trim().slice(0, 80) || 'Other',
      amount: amount,
      status: STATUSES.indexOf(s.status) >= 0 ? s.status : 'pending'
    };
  }

  function sum(list) { return list.reduce(function (t, s) { return t + s.amount; }, 0); }

  function monthSummary(sales, key) {
    var m = sales.filter(function (s) { return monthKey(s.date) === key; });
    var paid = sum(m.filter(function (s) { return s.status === 'paid'; }));
    var total = sum(m);
    return { count: m.length, total: total, paid: paid, open: total - paid };
  }

  function byPackage(sales, key) {
    var map = {};
    sales.forEach(function (s) {
      if (monthKey(s.date) !== key) return;
      var e = map[s.pkg] || (map[s.pkg] = { pkg: s.pkg, count: 0, total: 0 });
      e.count += 1; e.total += s.amount;
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.total - a.total || a.pkg.localeCompare(b.pkg); });
  }

  // Newest first. Includes the current month even when empty. At most `limit` months.
  function history(sales, currentKey, limit) {
    var keys = {};
    keys[currentKey] = true;
    sales.forEach(function (s) { keys[monthKey(s.date)] = true; });
    return Object.keys(keys).sort().reverse().slice(0, limit || 12).map(function (k) {
      var m = monthSummary(sales, k);
      return { key: k, total: m.total, count: m.count };
    });
  }

  function ringOffset(total, goal, circumference) {
    var frac = goal > 0 ? Math.min(Math.max(total / goal, 0), 1) : 0;
    return circumference * (1 - frac);
  }

  function parseBackup(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('That file is not a valid backup.'); }
    var list = Array.isArray(data) ? data : data && data.sales;
    if (!Array.isArray(list)) throw new Error('That file has no sales in it.');
    var sales = list.map(cleanSale).filter(Boolean);
    var goal = data && Math.round(Number(data.goal));
    return {
      sales: sales,
      skipped: list.length - sales.length,
      goal: goal > 0 ? goal : null
    };
  }

  var api = {
    PACKAGES: PACKAGES, STATUSES: STATUSES, DEFAULT_GOAL: DEFAULT_GOAL,
    todayStr: todayStr, monthKey: monthKey, validDate: validDate, cleanSale: cleanSale,
    monthSummary: monthSummary, byPackage: byPackage, history: history,
    ringOffset: ringOffset, parseBackup: parseBackup
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  /* ---------- UI ---------- */

  var $ = function (id) { return document.getElementById(id); };
  var fmt = new Intl.NumberFormat('en-US');
  var money = function (n) { return fmt.format(n); };
  var CIRC = 2 * Math.PI * 58;

  var state = { goal: DEFAULT_GOAL, lastBackup: null, sales: [] };
  var storageOk = true;
  var editingId = null;
  var viewAll = false;
  var amountTouched = false;

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        state.sales = (d.sales || []).map(cleanSale).filter(Boolean);
        state.goal = Math.round(Number(d.goal)) > 0 ? Math.round(Number(d.goal)) : DEFAULT_GOAL;
        state.lastBackup = d.lastBackup || null;
      }
    } catch (e) { storageOk = false; }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      storageOk = true;
    } catch (e) { storageOk = false; }
    $('storageWarn').hidden = storageOk;
  }

  var monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
  function monthLabel(key, withYear) {
    var p = key.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, 1);
    return withYear ? monthFmt.format(d) : d.toLocaleDateString('en-GB', { month: 'long' });
  }
  function shortMonth(key) {
    var p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }
  function dayLabel(dateStr) {
    var p = dateStr.split('-').map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    var o = { day: 'numeric', month: 'short' };
    if (p[0] !== new Date().getFullYear()) o.year = 'numeric';
    return d.toLocaleDateString('en-GB', o);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function barRow(name, valueText, subText, pct, goalPct) {
    var li = el('li');
    var top = el('div', 'top');
    top.appendChild(el('span', 'name', name));
    var val = el('span', 'val', valueText);
    if (subText) { val.appendChild(document.createTextNode(' ')); val.appendChild(el('small', null, subText)); }
    top.appendChild(val);
    li.appendChild(top);
    var track = el('div', 'track-bar');
    var fill = el('div', 'fill');
    fill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    track.appendChild(fill);
    if (goalPct != null) {
      var mark = el('div', 'goal-mark');
      mark.style.left = 'calc(' + Math.min(100, goalPct) + '% - 1px)';
      track.appendChild(mark);
    }
    li.appendChild(track);
    return li;
  }

  function render() {
    var curKey = monthKey(todayStr());
    $('monthName').textContent = monthLabel(curKey, true);

    // hero
    var s = monthSummary(state.sales, curKey);
    $('monthTotal').textContent = money(s.total);
    $('paidTotal').textContent = money(s.paid);
    $('openTotal').textContent = money(s.open);
    $('saleCount').textContent = s.count;
    var pct = Math.round((s.total / state.goal) * 100);
    var left = state.goal - s.total;
    var line = $('goalLine');
    line.textContent = '';
    if (left > 0) {
      line.appendChild(document.createTextNode(pct + '% of ' + money(state.goal) + ' THB · '));
      line.appendChild(el('b', null, money(left) + ' THB'));
      line.appendChild(document.createTextNode(' to go'));
    } else {
      line.appendChild(el('b', null, 'Goal reached ✦ '));
      line.appendChild(document.createTextNode(pct + '% of ' + money(state.goal) + ' THB'));
    }
    var prog = $('ringProg');
    prog.style.strokeDasharray = CIRC;
    prog.style.strokeDashoffset = ringOffset(s.total, state.goal, CIRC);
    $('ringLabel').setAttribute('aria-label',
      money(s.total) + ' Thai baht this month, ' + pct + ' percent of the ' + money(state.goal) + ' goal');
    if (document.activeElement !== $('goalInput')) $('goalInput').value = state.goal;

    // by package
    $('pkgSub').textContent = monthLabel(curKey, true);
    var pk = byPackage(state.sales, curKey);
    var pb = $('pkgBars');
    pb.textContent = '';
    if (!pk.length) pb.appendChild(el('li', 'empty', 'No sales yet this month.'));
    pk.forEach(function (p) {
      pb.appendChild(barRow(p.pkg, money(p.total) + ' THB',
        '× ' + p.count, s.total ? (p.total / s.total) * 100 : 0));
    });

    // history
    var hist = history(state.sales, curKey, 12);
    var max = Math.max(state.goal, Math.max.apply(null, hist.map(function (h) { return h.total; })));
    var hb = $('histBars');
    hb.textContent = '';
    hist.forEach(function (h) {
      var name = shortMonth(h.key) + (h.total >= state.goal ? ' ✦' : '');
      hb.appendChild(barRow(name, money(h.total) + ' THB', h.count + (h.count === 1 ? ' sale' : ' sales'),
        (h.total / max) * 100, (state.goal / max) * 100));
    });

    renderLog(curKey);
    renderBackupInfo();
  }

  function renderLog(curKey) {
    var list = state.sales.filter(function (x) { return viewAll || monthKey(x.date) === curKey; })
      .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var ul = $('log');
    ul.textContent = '';
    if (!list.length) {
      ul.appendChild(el('li', 'empty', viewAll ? 'No sales logged yet.' : 'No sales this month yet. Add your first one above.'));
    }
    list.forEach(function (x) {
      var li = el('li');
      var l1 = el('div', 'l1');
      l1.appendChild(el('span', 'client', x.client || 'No name'));
      l1.appendChild(el('span', 'amt', money(x.amount) + ' THB'));
      var l2 = el('div', 'l2');
      l2.appendChild(el('span', 'meta', dayLabel(x.date) + ' · ' + x.pkg));
      l2.appendChild(el('span', 'pill ' + x.status, STATUS_LABEL[x.status]));
      var btns = el('div', 'btns');
      var ed = el('button', null, 'Edit'); ed.type = 'button';
      ed.setAttribute('aria-label', 'Edit sale for ' + (x.client || 'no name'));
      ed.addEventListener('click', function () { startEdit(x.id); });
      var del = el('button', 'del', 'Delete'); del.type = 'button';
      del.setAttribute('aria-label', 'Delete sale for ' + (x.client || 'no name'));
      del.addEventListener('click', function () { removeSale(x.id); });
      btns.appendChild(ed); btns.appendChild(del);
      li.appendChild(l1); li.appendChild(l2); li.appendChild(btns);
      ul.appendChild(li);
    });
  }

  function renderBackupInfo() {
    var t = state.lastBackup;
    $('lastBackup').textContent = t
      ? 'Last backup: ' + new Date(t).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      : 'No backup exported yet.';
  }

  /* form */
  function resetForm() {
    editingId = null; amountTouched = false;
    $('fDate').value = todayStr();
    $('fClient').value = '';
    $('fPackage').selectedIndex = 0;
    $('fAmount').value = PACKAGES[0].price || '';
    $('fStatus').value = 'paid';
    $('formTitle').textContent = 'Log a sale';
    $('saveBtn').textContent = 'Add sale';
    $('cancelEdit').hidden = true;
    showError('');
  }
  function showError(msg) { var e = $('formError'); e.textContent = msg; e.hidden = !msg; }

  function packagePrice(name) {
    for (var i = 0; i < PACKAGES.length; i++) if (PACKAGES[i].name === name) return PACKAGES[i].price;
    return 0;
  }

  function startEdit(id) {
    var x = state.sales.filter(function (s) { return s.id === id; })[0];
    if (!x) return;
    editingId = id; amountTouched = true;
    var sel = $('fPackage');
    if (!Array.prototype.some.call(sel.options, function (o) { return o.value === x.pkg; })) {
      var o = document.createElement('option'); o.value = o.textContent = x.pkg; sel.appendChild(o);
    }
    $('fDate').value = x.date; $('fClient').value = x.client; sel.value = x.pkg;
    $('fAmount').value = x.amount; $('fStatus').value = x.status;
    $('formTitle').textContent = 'Edit sale';
    $('saveBtn').textContent = 'Save changes';
    $('cancelEdit').hidden = false;
    showError('');
    $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    $('fClient').focus({ preventScroll: true });
  }

  function removeSale(id) {
    var x = state.sales.filter(function (s) { return s.id === id; })[0];
    if (!x || !confirm('Delete the sale for ' + (x.client || 'no name') + ' (' + money(x.amount) + ' THB)?')) return;
    state.sales = state.sales.filter(function (s) { return s.id !== id; });
    if (editingId === id) resetForm();
    save(); render();
  }

  function onSubmit(ev) {
    ev.preventDefault();
    var sale = cleanSale({
      id: editingId || newId(),
      date: $('fDate').value, client: $('fClient').value, pkg: $('fPackage').value,
      amount: $('fAmount').value === '' ? NaN : $('fAmount').value, status: $('fStatus').value
    });
    if (!sale) { showError('Please choose a date and enter the amount in THB.'); return; }
    if (!sale.client) { showError('Please enter the client name.'); $('fClient').focus(); return; }
    if (editingId) {
      state.sales = state.sales.map(function (s) { return s.id === editingId ? sale : s; });
    } else {
      state.sales.push(sale);
    }
    var keepDate = $('fDate').value;
    save(); resetForm();
    if (!editingId) $('fDate').value = keepDate; // quick logging of several sales on the same day
    render();
  }

  /* backup */
  function say(msg, bad) { var m = $('backupMsg'); m.textContent = msg; m.className = 'status' + (bad ? ' bad' : ''); }

  function exportBackup() {
    state.lastBackup = new Date().toISOString();
    var payload = JSON.stringify({ app: 'soulprint-sales', version: 1, exportedAt: state.lastBackup,
      goal: state.goal, sales: state.sales }, null, 2);
    var a = document.createElement('a');
    var url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.href = url; a.download = 'soulprint-sales-backup-' + todayStr() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    save(); renderBackupInfo();
    say('Backup saved (' + state.sales.length + ' sales). Keep the file somewhere safe.');
  }

  function importBackup(file) {
    if (!file) return;
    var r = new FileReader();
    r.onerror = function () { say('Could not read that file.', true); };
    r.onload = function () {
      var res;
      try { res = parseBackup(String(r.result)); } catch (e) { say(e.message, true); return; }
      var msg = 'Replace the ' + state.sales.length + ' sales in this browser with ' + res.sales.length +
        ' sales from the backup?' + (res.skipped ? ' (' + res.skipped + ' unreadable rows will be skipped.)' : '');
      if (!confirm(msg)) { say('Import cancelled. Nothing changed.'); return; }
      state.sales = res.sales;
      if (res.goal) state.goal = res.goal;
      save(); resetForm(); render();
      say('Imported ' + res.sales.length + ' sales.');
    };
    r.readAsText(file);
  }

  function init() {
    load();
    var sel = $('fPackage');
    PACKAGES.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.name;
      o.textContent = p.name + (p.price ? ' · ' + money(p.price) + ' THB' : '');
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      if (!amountTouched || $('fAmount').value === '') {
        var pr = packagePrice(sel.value);
        $('fAmount').value = pr || '';
        amountTouched = false;
      }
    });
    $('fAmount').addEventListener('input', function () { amountTouched = true; });
    $('form').addEventListener('submit', onSubmit);
    $('cancelEdit').addEventListener('click', resetForm);
    $('goalInput').addEventListener('change', function () {
      var g = Math.round(Number($('goalInput').value));
      if (g > 0) { state.goal = g; save(); }
      render();
    });
    function setView(all) {
      viewAll = all;
      $('viewAll').setAttribute('aria-pressed', all);
      $('viewMonth').setAttribute('aria-pressed', !all);
      render();
    }
    $('viewMonth').addEventListener('click', function () { setView(false); });
    $('viewAll').addEventListener('click', function () { setView(true); });
    $('exportBtn').addEventListener('click', exportBackup);
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (e) { importBackup(e.target.files[0]); e.target.value = ''; });
    resetForm();
    $('storageWarn').hidden = storageOk;
    render();
  }
  init();
})(typeof window !== 'undefined' ? window : globalThis);
