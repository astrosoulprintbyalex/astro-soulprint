/* "Write in my style": short card messages in Alex's Burmese-English voice, filled with the day's real transits.
   These are hand-written templates (no AI, no network), built from the voice guide: ကိုယ် pronoun, နော် / လေး softeners,
   short lines with … pauses, an em-dash reveal, Title Case English terms, one soft 🤍 / ✨ at the end, and a
   "look at your own chart" prompt for transits. Works in the browser and in Node (tests). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Voice = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(date, off) { var d = new Date(date.getTime() + off * 60e3); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }
  function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (_, k) { return v[k]; }); }

  // One line per sign: what the Moon's mood feels like. Each ends in "Energy" and is followed by ပါ။
  var MOON_THEME = {
    Aries: 'စတင်ချင်တဲ့ စိတ်အားထက်သန်မှု Energy',
    Taurus: 'တည်ငြိမ်မှုနဲ့ သက်တောင့်သက်သာ ရှိချင်တဲ့ Energy',
    Gemini: 'စကားပြောချင်၊ သိချင်စပ်စုချင်တဲ့ Energy',
    Cancer: 'အိမ်လို နွေးထွေးမှုကို တောင့်တတဲ့ Energy',
    Leo: 'ကိုယ့်ကိုယ်ကို ပွင့်လင်းစွာ ဖော်ထုတ်ချင်တဲ့ Energy',
    Virgo: 'အသေးစိတ်လေးတွေကို စီစစ်ပြီး ပြုစုချင်တဲ့ Energy',
    Libra: 'ဟန်ချက်ညီမျှမှုကို ရှာနေတဲ့ Energy',
    Scorpio: 'နက်နက်ရှိုင်းရှိုင်း ခံစားမိတဲ့ Energy',
    Sagittarius: 'လွတ်လပ်မှုနဲ့ အလင်းရောင်ကို ရှာချင်တဲ့ Energy',
    Capricorn: 'တာဝန်ယူပြီး တစ်လှမ်းချင်း တည်ဆောက်ချင်တဲ့ Energy',
    Aquarius: 'ကိုယ့်လမ်းကိုယ် ရွေးချင်တဲ့ Energy',
    Pisces: 'နှလုံးသားနဲ့ ခံစားမိတဲ့ Energy'
  };

  function topics(card) {
    var off = card.offsetMin || 0, out = [], m = card.moon;

    // 1) the week's events, soonest first (up to three)
    card.events.slice(0, 3).forEach(function (e) {
      var v = { P: e.body, S: e.sign, date: fmtDate(e.date, off) };
      if (e.type === 'ingress') {
        out.push([
          fill('{date} မှာ {P} က {S} ထဲကို ဝင်ရောက်တော့မယ်…\nအရေးကြီးတဲ့ Energy Shift လေးတစ်ခုပါ။\nကိုယ့်ဇာတာထဲမှာ {S} ကျတဲ့ House လေးကို ကြည့်ကြည့်ပါနော်။ ✨', v),
          fill('{P} in {S}…\nကိုယ့်ဘဝမှာ ဘယ်နေရာလေးက အသစ်ပြောင်းလာမလဲ—\n{S} ကျတဲ့ House လေးကို ကြည့်လိုက်ပါနော်။ ✨', v)
        ]);
      } else if (e.type === 'station-retrograde') {
        out.push([
          fill('{date} မှာ {P} Retrograde စတင်မယ်…\nမြန်မြန်ဆန်ဆန် မလုပ်ဘဲ ပြန်ကြည့်ဖို့ အချိန်လေးပါ။\nအတိတ်က Patterns လေးတွေကို ညင်ညင်သာသာ သုံးသပ်ကြည့်ပါနော်။ 🤍', v),
          fill('{P} Retrograde in {S}…\nတချို့တွေအတွက်တော့ ပြန်လည်သုံးသပ်ချိန်…\nတချို့တွေအတွက်တော့ ခဏနားချိန်လေးပါနော်။ 🤍\nNo rush. 🫶🏻', v)
        ]);
      } else {
        out.push([
          fill('{date} မှာ {P} Direct ပြန်ဖြစ်မယ်…\nရပ်နေသလို ခံစားရတဲ့ အရာလေးတွေ ပြန်လှုပ်ရှားလာပါလိမ့်မယ်။\nအလျင်မလိုဘဲ ခြေလှမ်းလေး တစ်လှမ်းချင်းစီ ဆက်လိုက်ပါနော်။ ✨', v),
          fill('{P} Direct in {S}…\nပြန်လည်သုံးသပ်ခဲ့တာလေးတွေကို ကိုယ့်ဘဝထဲ ပြန်ထည့်လို့ရတဲ့ အချိန်…\n{S} ကျတဲ့ House လေးမှာ ဘာတွေ ပြောင်းလာလဲ ကြည့်ကြည့်ပါနော်။ 🤍', v)
        ]);
      }
    });

    // 2) exact New / Full / Quarter Moon today
    if (m.exact) {
      var q = { N: m.exact.name, S: m.exact.sign };
      if (m.exact.name === 'New Moon') out.push([
        fill('New Moon in {S}…\nအစပြုချင်တဲ့ Intention လေးတစ်ခုကို ကိုယ့်စိတ်ထဲမှာ ရွေးလိုက်ပါနော်။\nအကြီးကြီး မဟုတ်လည်း ရပါတယ်… 🤍', q),
        fill('New Moon in {S}…\nကိုယ့်ကိုယ်ကို စတင်ရွေးချယ်လိုက်တဲ့အချိန်…\nအသစ်ဖြစ်လာမယ့် အရာလေးကို လက်ခံလိုက်တဲ့အချိန်…\nဒီနေ့ Intention လေးတစ်ခု ရေးထားလိုက်ပါနော်။ ✨', q)
      ]);
      else if (m.exact.name === 'Full Moon') out.push([
        fill('Full Moon in {S}…\nကိုယ့်ထဲမှာ ပြည့်လာတာတွေကို သတိထားကြည့်ပြီး—\nလွှတ်ချချင်တာလေးကို Release လုပ်လိုက်ပါနော်။ ✨', q),
        fill('Full Moon in {S}…\nထွက်ပေါ်လာတဲ့ ခံစားချက်လေးတွေကို မဖိနှိပ်ဘဲ…\nကိုယ့်ကိုယ်ကို ကြင်နာစွာ နားထောင်ပေးလိုက်ပါနော်။ 🤍', q)
      ]);
      else out.push([
        fill('{N} in {S}…\nအလယ်လမ်းမှာ ကိုယ့်ကိုယ်ကို ပြန်စစ်ကြည့်ဖို့ အချိန်လေးပါ။\nပြင်ချင်တာရှိရင် ညင်ညင်သာသာ Adjust လုပ်လိုက်ပါနော်။ 🤍', q),
        fill('{N} in {S}…\nကိုယ်ဘယ်ကိုရောက်နေပြီလဲ…\nဆိုတာလေးကို ခဏရပ်ပြီး ကြည့်လိုက်ပါနော်။ ✨', q)
      ]);
    }

    // 3) the Moon's sign today
    var waxing = /Waxing|First/.test(m.phase) || (m.exact && m.exact.name === 'New Moon');
    var vibe = waxing ? 'တဖြည်းဖြည်း တိုးပွားလာတဲ့ Energy' : 'တဖြည်းဖြည်း လွှတ်ချတဲ့ Energy';
    var mv = { S: m.sign, theme: MOON_THEME[m.sign], phase: m.phase, vibe: vibe };
    out.push([
      fill('ဒီနေ့ Moon က {S} ထဲမှာ…\n{theme} ပါ။\nကိုယ့်စိတ်ခံစားချက်လေးတွေကို ဖြည်းဖြည်းချင်း နားထောင်ကြည့်ပါနော်။ 🤍', mv),
      fill('Moon in {S} · {phase}…\n{vibe} ပါ။\n{theme} ကို သတိထားကြည့်ပါနော်။ ✨', mv)
    ]);

    // 4) planets retrograde right now
    if (card.retrogradeNow.length) {
      var list = card.retrogradeNow.join(' · ');
      out.push([
        'Retrograde ဖြစ်နေတဲ့ ကာလ…\n' + list + '\nပြန်လည်သုံးသပ်ဖို့ ခေါ်နေတဲ့ Energy လေးပါ။\nကိုယ့်အချိန်နဲ့ကိုယ် ဖြည်းဖြည်းသွားလိုက်ပါနော်။ 🤍',
        'ဒီအပတ် ' + list + ' Retrograde…\nအသစ်ကို မလောဘဲ—\nအရင်ကို ပြန်ကြည့်ပြီး Heal လုပ်ဖို့ ကောင်းတဲ့အချိန်လေးပါနော်။ ✨'
      ]);
    }
    return out;
  }

  /* All message options for the card, best first: every topic's first wording, then every second wording. */
  function candidates(card) {
    var t = topics(card), out = [];
    [0, 1].forEach(function (k) { t.forEach(function (pair) { out.push(pair[k]); }); });
    return out;
  }

  return { candidates: candidates, MOON_THEME: MOON_THEME };
});
