/* 2027 Lord of the Year: the calculation and all the words.
   Annual profections (whole-sign houses, traditional rulers). Works in the browser (window.LordOfYear) and in Node (require). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LordOfYear = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var YEAR = 2027;

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  // Traditional rulers: Mars rules Scorpio and Saturn rules Aquarius (no modern rulers).
  var RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysIn(m, y) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }

  // The birthday in a given year (29 February falls back to 28 February in years without one).
  function birthdayIn(year, month, day) { return { year: year, month: month, day: Math.min(day, daysIn(month, year)) }; }

  function dayBefore(d) {
    var dt = new Date(Date.UTC(d.year, d.month - 1, d.day));
    dt.setUTCDate(dt.getUTCDate() - 1);
    return { year: dt.getUTCFullYear(), month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
  }

  /* birth: { year, month (1-12), day }, risingIndex: 0 = Aries ... 11 = Pisces
     Returns the profection for the birthday year that starts on the birthday in `year` (default 2027). */
  function profection(birth, risingIndex, year) {
    year = year || YEAR;
    var age = year - birth.year;                      // age reached on the birthday in `year`
    var houseIndex = ((age % 12) + 12) % 12;          // 0 = 1st house, 11 = 12th house
    var signIndex = (risingIndex + houseIndex) % 12;  // whole-sign houses: the 1st house is the rising sign
    var start = birthdayIn(year, birth.month, birth.day);
    var end = dayBefore(birthdayIn(year + 1, birth.month, birth.day));
    return {
      year: year, age: age, house: houseIndex + 1, sign: SIGNS[signIndex], signIndex: signIndex,
      lord: RULERS[signIndex], rising: SIGNS[risingIndex], risingIndex: risingIndex, start: start, end: end
    };
  }

  function formatDate(d) { return d.day + ' ' + MONTHS[d.month - 1] + ' ' + d.year; }

  /* ---------- Words (English and Burmese) ---------- */
  var HOUSES = [
    { title: 'Self & Identity', my: 'ကိုယ့်ကိုယ်ကိုယ်နဲ့ Identity',
      en: 'This year puts you at the center of your own story: a fresh chapter for your identity, your body and the way you show up in the world.',
      mm: 'ဒီနှစ်မှာ ကိုယ့်ကိုယ်ကိုယ် အဓိကထားရမယ့် ဘဝအခန်းသစ်တစ်ခု စတင်ပါတယ်။ ကိုယ်ဘယ်သူလဲ၊ ကိုယ့်ကိုယ်ကို ဘယ်လိုပြသချင်လဲဆိုတာကို ပြန်လည်ဖန်တီးနိုင်တဲ့ အချိန်ပါ။' },
    { title: 'Money & Values', my: 'ငွေကြေးနဲ့ တန်ဖိုးထားမှု',
      en: 'Money, income and what you truly value take the spotlight, so it is a good year to build steadier foundations and spend in line with what matters to you.',
      mm: 'ဒီနှစ်မှာ ငွေကြေး၊ ဝင်ငွေနဲ့ ကိုယ်တကယ်တန်ဖိုးထားတဲ့အရာတွေက အာရုံထဲ ပေါ်လာပါမယ်။ ကိုယ့်ရဲ့ ငွေကြေးအခြေခံကို ပိုခိုင်မာအောင် လုပ်ဖို့နဲ့ တန်ဖိုးထားတာတွေနဲ့ ကိုက်ညီအောင် သုံးစွဲဖို့ သင့်တော်တဲ့နှစ်ပါ။' },
    { title: 'Communication & Learning', my: 'ဆက်သွယ်ပြောဆိုမှုနဲ့ သင်ယူမှု',
      en: 'Communication, learning and everyday movement are active this year, with conversations, short trips and new skills opening small but meaningful doors.',
      mm: 'ဒီနှစ်မှာ ပြောဆိုဆက်သွယ်ခြင်း၊ သင်ယူခြင်းနဲ့ နေ့စဉ်လှုပ်ရှားမှုတွေ အားကောင်းလာပါမယ်။ စကားပြောဆိုမှုတွေ၊ ခရီးတိုလေးတွေနဲ့ ကျွမ်းကျင်မှုအသစ်တွေက သေးငယ်ပေမယ့် အဓိပ္ပာယ်ရှိတဲ့ တံခါးလေးတွေ ဖွင့်ပေးနိုင်ပါတယ်။' },
    { title: 'Home & Roots', my: 'အိမ်နဲ့ အမြစ်',
      en: 'Home, family and your inner roots come first, inviting you to create a place, and a feeling, where you can truly rest.',
      mm: 'ဒီနှစ်မှာ အိမ်၊ မိသားစုနဲ့ ကိုယ့်ရဲ့ အတွင်းအမြစ်တွေက အရေးကြီးလာပါမယ်။ စိတ်အေးအေးနဲ့ တကယ်အနားယူနိုင်တဲ့ နေရာနဲ့ ခံစားချက်တစ်ခုကို တည်ဆောက်ဖို့ ဖိတ်ခေါ်နေတဲ့နှစ်ပါ။' },
    { title: 'Joy & Romance', my: 'ပျော်ရွှင်မှုနဲ့ ရင်ခုန်မှု',
      en: 'Joy, romance and creativity are invited back in, so make room for play, passion and anything that makes your heart feel alive.',
      mm: 'ပျော်ရွှင်မှု၊ ချစ်ခြင်းမေတ္တာနဲ့ ဖန်တီးနိုင်စွမ်းတွေ ပြန်လည်ဝင်ရောက်လာတဲ့နှစ်ပါ။ ကစားပျော်ပါးမှု၊ စိတ်အားထက်သန်မှုနဲ့ ကိုယ့်နှလုံးသားကို အသက်ဝင်စေတဲ့ အရာတွေအတွက် နေရာပေးလိုက်ပါ။' },
    { title: 'Health & Routine', my: 'ကျန်းမာရေးနဲ့ နေ့စဉ်လုပ်ငန်းစဉ်',
      en: 'Daily routines, health and the way you work are in focus; small, steady habits can make this a year of real improvement.',
      mm: 'နေ့စဉ်လုပ်ငန်းစဉ်၊ ကျန်းမာရေးနဲ့ အလုပ်လုပ်ပုံတွေကို အာရုံစိုက်ရမယ့်နှစ်ပါ။ သေးငယ်ပေမယ့် ပုံမှန်လုပ်တဲ့ အလေ့အကျင့်လေးတွေက တကယ့်တိုးတက်မှုကို ဖန်တီးပေးနိုင်ပါတယ်။' },
    { title: 'Partnerships', my: 'ပူးပေါင်းဆက်ဆံရေး',
      en: "Partnerships step forward, from love and marriage to key collaborations, and the people beside you shape this year's story.",
      mm: 'ဒီနှစ်မှာ ချစ်သူ၊ အိမ်ထောင်ဖက်၊ လုပ်ဖော်ကိုင်ဖက်လို တစ်ဦးချင်းဆက်ဆံရေးတွေက ရှေ့ကို ထွက်လာပါမယ်။ ကိုယ့်ဘေးမှာရှိတဲ့လူတွေက ဒီနှစ်ရဲ့ ဇာတ်လမ်းကို ပုံဖော်ပေးမှာပါ။' },
    { title: 'Transformation', my: 'ပြောင်းလဲမှုနဲ့ နက်ရှိုင်းမှု',
      en: 'Deep change, shared resources and honest intimacy are the themes, a year to let go of what is finished and rebuild with more truth.',
      mm: 'နက်ရှိုင်းတဲ့ ပြောင်းလဲမှု၊ မျှဝေထားတဲ့ အရင်းအမြစ်တွေနဲ့ ရိုးသားတဲ့ နီးကပ်မှုတွေက ဒီနှစ်ရဲ့ အဓိကအကြောင်းအရာပါ။ ပြီးဆုံးသွားပြီဖြစ်တာတွေကို လွှတ်ပေးပြီး အမှန်တရားနဲ့ ပြန်လည်တည်ဆောက်တဲ့နှစ်ပါ။' },
    { title: 'Beliefs & Travel', my: 'ယုံကြည်မှုနဲ့ ခရီး',
      en: 'Your horizons widen this year through travel, study and big questions, inviting you to explore what you believe and where you want to go.',
      mm: 'ခရီးသွားခြင်း၊ ပညာသင်ယူခြင်းနဲ့ ကြီးမားတဲ့မေးခွန်းတွေကြောင့် ကိုယ့်ရဲ့ မျှော်မြင်ကွင်းတွေ ကျယ်ပြန့်လာမယ့်နှစ်ပါ။ ကိုယ်ယုံကြည်တာတွေနဲ့ ရောက်ချင်တဲ့နေရာကို စူးစမ်းဖို့ ဖိတ်ခေါ်နေပါတယ်။' },
    { title: 'Career & Reputation', my: 'အလုပ်အကိုင်နဲ့ ဂုဏ်သတင်း',
      en: 'Career, reputation and public achievement come into view, so step forward with purpose and let your work be seen.',
      mm: 'အလုပ်အကိုင်၊ ဂုဏ်သတင်းနဲ့ လူသိရှင်ကြားအောင်မြင်မှုတွေ ပေါ်လွင်လာမယ့်နှစ်ပါ။ ရည်ရွယ်ချက်ရှိရှိနဲ့ ရှေ့ထွက်ပြီး ကိုယ့်ရဲ့ အလုပ်ကို လူတွေမြင်စေလိုက်ပါ။' },
    { title: 'Friends & Hopes', my: 'မိတ်ဆွေနဲ့ မျှော်လင့်ချက်',
      en: 'Friends, community and your long-term hopes are highlighted, a year when the right circle can carry you closer to your dreams.',
      mm: 'မိတ်ဆွေ၊ လူမှုအသိုင်းအဝိုင်းနဲ့ ကိုယ့်ရဲ့ ရေရှည်မျှော်လင့်ချက်တွေ ထင်ရှားလာမယ့်နှစ်ပါ။ မှန်ကန်တဲ့ လူအုပ်စုက ကိုယ့်ရဲ့ အိပ်မက်တွေဆီ ပိုနီးကပ်အောင် ပို့ဆောင်ပေးနိုင်ပါတယ်။' },
    { title: 'Rest & Healing', my: 'အနားယူမှုနဲ့ ကုစားမှု',
      en: 'A quieter, more inward year, ideal for rest, healing and listening to your inner voice before the next chapter begins.',
      mm: 'ပိုတိတ်ဆိတ်ပြီး အတွင်းစိတ်ကို ဦးတည်တဲ့နှစ်ပါ။ နောက်အခန်းမစတင်ခင် အနားယူခြင်း၊ ကုစားခြင်းနဲ့ ကိုယ့်အတွင်းစိတ်ရဲ့ အသံကို နားထောင်ဖို့ သင့်တော်ပါတယ်။' }
  ];

  var PLANETS = {
    Sun: {
      en: 'With the Sun as your Lord of the Year, you are called to be seen, to lead with confidence and to live more fully as yourself.',
      mm: 'Sun က ဒီနှစ်ရဲ့ Lord of the Year ဖြစ်တဲ့အတွက် ကိုယ့်ကိုယ်ကို ယုံကြည်မှုနဲ့ ပြသဖို့၊ ဦးဆောင်ဖို့နဲ့ ကိုယ်ဖြစ်ချင်တဲ့ကိုယ်အဖြစ် ပိုအပြည့်အဝ နေထိုင်ဖို့ တိုက်တွန်းနေပါတယ်။' },
    Moon: {
      en: 'With the Moon leading, feelings, home and intuition guide the year; trust your inner rhythm and care for your emotional needs.',
      mm: 'Moon က ဦးဆောင်တဲ့အတွက် ခံစားချက်၊ အိမ်နဲ့ အတွင်းစိတ်အသိတို့က ဒီနှစ်ကို လမ်းပြပါမယ်။ ကိုယ့်ရဲ့ အတွင်းလှိုင်းတွေကို ယုံကြည်ပြီး စိတ်ခံစားမှုလိုအပ်ချက်တွေကို ဂရုစိုက်ပေးပါ။' },
    Mercury: {
      en: 'With Mercury leading, ideas, conversations and learning carry the year, so stay curious and keep your words clear.',
      mm: 'Mercury က ဦးဆောင်တဲ့အတွက် အတွေးအခေါ်၊ စကားပြောဆိုမှုနဲ့ သင်ယူမှုတွေက ဒီနှစ်ကို ရှေ့ဆက်စေပါမယ်။ စူးစမ်းချင်စိတ်ကို ထိန်းထားပြီး ကိုယ့်စကားတွေကို ရှင်းလင်းအောင် ပြောပါ။' },
    Venus: {
      en: 'With Venus leading, love, beauty and harmony soften the year; invest in relationships and in whatever brings you pleasure.',
      mm: 'Venus က ဦးဆောင်တဲ့အတွက် ချစ်ခြင်းမေတ္တာ၊ အလှအပနဲ့ သဟဇာတဖြစ်မှုတွေက ဒီနှစ်ကို နူးညံ့စေပါမယ်။ ဆက်ဆံရေးတွေနဲ့ ကိုယ့်ကို ပျော်ရွှင်စေတဲ့အရာတွေအတွက် အချိန်ပေးပါ။' },
    Mars: {
      en: 'With Mars leading, you have energy and drive to act; move with courage, and channel any friction into brave, clear action.',
      mm: 'Mars က ဦးဆောင်တဲ့အတွက် လုပ်ဆောင်ဖို့ စွမ်းအားနဲ့ တွန်းအားတွေ ရှိပါမယ်။ ရဲဝံ့စွာ ရွေ့လျားပြီး ပွတ်တိုက်မှုတွေကို ရှင်းလင်းတဲ့ လုပ်ဆောင်ချက်အဖြစ် ပြောင်းလဲပါ။' },
    Jupiter: {
      en: 'With Jupiter leading, growth, opportunity and generosity expand the year; say yes to what lifts you and share what you learn.',
      mm: 'Jupiter က ဦးဆောင်တဲ့အတွက် တိုးတက်မှု၊ အခွင့်အလမ်းနဲ့ ရက်ရောမှုတွေ ဒီနှစ်မှာ ကျယ်ပြန့်လာပါမယ်။ ကိုယ့်ကို မြှင့်တင်ပေးတာတွေကို လက်ခံပြီး သင်ယူထားတာတွေကို မျှဝေပါ။' },
    Saturn: {
      en: 'With Saturn leading, structure and patience shape the year; steady effort and clear boundaries build something that lasts.',
      mm: 'Saturn က ဦးဆောင်တဲ့အတွက် ဖွဲ့စည်းပုံနဲ့ စိတ်ရှည်မှုတွေက ဒီနှစ်ကို ပုံဖော်ပါမယ်။ ပုံမှန်ကြိုးစားမှုနဲ့ ရှင်းလင်းတဲ့ နယ်နိမိတ်တွေက ရေရှည်တည်တံ့တာကို တည်ဆောက်ပေးပါတယ်။' }
  };

  return {
    YEAR: YEAR, SIGNS: SIGNS, RULERS: RULERS, MONTHS: MONTHS, HOUSES: HOUSES, PLANETS: PLANETS,
    isLeap: isLeap, daysIn: daysIn, profection: profection, formatDate: formatDate
  };
}));
