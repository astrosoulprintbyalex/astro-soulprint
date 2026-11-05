/* 2027 Lord of the Year: the form and the result card. The calculation and all the words are in lord.js. */
(function () {
  'use strict';
  var L = window.LordOfYear;
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function option(value, label, opts) {
    var o = document.createElement('option'); o.value = value; o.textContent = label;
    if (opts && opts.disabled) o.disabled = true; if (opts && opts.selected) o.selected = true; return o;
  }
  function fill(select, placeholder, items) {
    select.innerHTML = '';
    select.appendChild(option('', placeholder, { disabled: true, selected: true }));
    items.forEach(function (it) { select.appendChild(option(it[0], it[1])); });
  }

  function init() {
    var days = [], i;
    for (i = 1; i <= 31; i++) days.push([String(i), String(i)]);
    fill($('lordDay'), 'Day', days);
    fill($('lordMonth'), 'Month', L.MONTHS.map(function (m, idx) { return [String(idx + 1), m]; }));
    fill($('lordRising'), 'Choose your rising sign', L.SIGNS.map(function (s, idx) { return [String(idx), s]; }));
    $('lordYear').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    $('lordForm').addEventListener('submit', onSubmit);
  }

  function showError(en, my, el) {
    var box = $('lordError');
    box.innerHTML = esc(en) + '<br><span lang="my">' + esc(my) + '</span>';
    box.hidden = false;
    if (el) el.focus();
  }

  function onSubmit(e) {
    e.preventDefault();
    $('lordError').hidden = true;
    var day = parseInt($('lordDay').value, 10), month = parseInt($('lordMonth').value, 10);
    var yearText = $('lordYear').value.trim(), year = parseInt(yearText, 10);
    var now = new Date(), maxYear = Math.min(now.getFullYear(), L.YEAR);

    if (!day || !month) return showError('Please choose your birth day and month.', 'မွေးရက်နဲ့ လကို ရွေးပေးပါ။', !day ? $('lordDay') : $('lordMonth'));
    if (!/^\d{4}$/.test(yearText) || year < 1900) return showError('Please type your birth year with 4 numbers, for example 1992.', 'မွေးနှစ်ကို ဂဏန်း ၄ လုံးနဲ့ ရိုက်ပေးပါ၊ ဥပမာ 1992။', $('lordYear'));
    if (year > maxYear) return showError('That birth date is in the future. Please check the year.', 'မွေးသက္ကရာဇ်က အနာဂတ်ဖြစ်နေပါတယ်။ မွေးနှစ်ကို ပြန်စစ်ပေးပါ။', $('lordYear'));
    if (day > L.daysIn(month, year)) return showError('That date does not exist. Please check the day and month.', 'အဲဒီရက်စွဲ မရှိပါဘူး။ ရက်နဲ့ လကို ပြန်စစ်ပေးပါ။', $('lordDay'));
    if ($('lordRising').value === '') return showError('Please choose your rising sign.', 'Rising Sign ကို ရွေးပေးပါ။', $('lordRising'));

    var p = L.profection({ year: year, month: month, day: day }, parseInt($('lordRising').value, 10));
    render(p);
  }

  // A 12-house wheel: house 1 starts at the left and the houses run counter-clockwise, as on a birth chart.
  function wheel(p) {
    var cx = 130, cy = 130, R = 122, r = 50, out = [];
    function pt(rad, deg) { var a = deg * Math.PI / 180; return [(cx + rad * Math.cos(a)).toFixed(1), (cy - rad * Math.sin(a)).toFixed(1)]; }
    out.push('<svg class="lord-wheel" viewBox="0 0 260 260" role="img" aria-label="House ' + p.house + ' in ' + esc(p.sign) + ' is activated in your 2027 birthday year">');
    for (var h = 0; h < 12; h++) {
      var a0 = 180 + h * 30, a1 = a0 + 30, mid = a0 + 15, on = h + 1 === p.house;
      var o0 = pt(R, a0), o1 = pt(R, a1), i1 = pt(r, a1), i0 = pt(r, a0);
      out.push('<path d="M' + o0 + ' A' + R + ',' + R + ' 0 0 0 ' + o1 + ' L' + i1 + ' A' + r + ',' + r + ' 0 0 1 ' + i0 + ' Z" class="lord-wedge' + (on ? ' on' : '') + '"/>');
      var tn = pt(100, mid), ts = pt(73, mid);
      out.push('<text x="' + tn[0] + '" y="' + (+tn[1] + 5) + '" class="lord-wnum' + (on ? ' on' : '') + '" text-anchor="middle">' + (h + 1) + '</text>');
      out.push('<text x="' + ts[0] + '" y="' + (+ts[1] + 3) + '" class="lord-wsign' + (on ? ' on' : '') + '" text-anchor="middle">' + L.SIGNS[(p.risingIndex + h) % 12].slice(0, 3).toUpperCase() + '</text>');
    }
    out.push('<circle cx="130" cy="130" r="' + (r - 4) + '" class="lord-hub"/>');
    out.push('<text x="130" y="127" class="lord-hub-year" text-anchor="middle">' + L.YEAR + '</text>');
    out.push('<text x="130" y="144" class="lord-hub-sub" text-anchor="middle">YOUR YEAR</text>');
    return out.join('') + '</svg>';
  }

  function render(p) {
    var h = L.HOUSES[p.house - 1], planet = L.PLANETS[p.lord];
    var html =
      '<article class="lord-card" tabindex="-1" id="lordCard">' +
        '<p class="lord-kicker">Your 2027 birthday year<span>' + esc(L.formatDate(p.start)) + ' &ndash; ' + esc(L.formatDate(p.end)) + '</span></p>' +
        '<div class="lord-grid">' +
          '<div class="lord-wheel-wrap">' + wheel(p) + '</div>' +
          '<div class="lord-facts">' +
            '<p class="lord-label">Activated house <small lang="my">အလင်းပေးခံရတဲ့ House</small></p>' +
            '<p class="lord-big">House ' + p.house + '</p>' +
            '<p class="lord-sub">' + esc(p.sign) + ' &middot; ' + esc(h.title) + '<span lang="my">' + esc(h.my) + '</span></p>' +
            '<div class="lord-rule"><span>&#10022;</span></div>' +
            '<p class="lord-label">Lord of the Year <small lang="my">ဒီနှစ်ကို ဦးဆောင်တဲ့ Planet</small></p>' +
            '<p class="lord-big gold">' + esc(p.lord) + '</p>' +
            '<p class="lord-sub">Ruler of ' + esc(p.sign) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="lord-text">' +
          '<p lang="my">' + esc(h.mm) + ' ' + esc(planet.mm) + '</p>' +
          '<p class="en">' + esc(h.en) + ' ' + esc(planet.en) + '</p>' +
        '</div>' +
        '<p class="lord-foot">Age ' + p.age + ' at your 2027 birthday &rarr; House ' + p.house + ' &middot; Rising ' + esc(p.rising) + '</p>' +
      '</article>';
    var box = $('lordResult');
    box.innerHTML = html;
    box.hidden = false;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    $('lordCard').focus({ preventScroll: true });
  }

  init();
}());
