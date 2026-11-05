/* Cosmic Weather: every sentence on the page (English "en" and Burmese "my").
   To change a meaning, edit the matching en / my line below. The sky maths is in sky.js, the layout is in page.js.
   Burmese keeps astrology words in English (Mercury, Retrograde, New Moon...) the way Alex writes, with ကိုယ်, နော် and လေး. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CosmicWords = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  var SIGN_GLYPH = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  var PLANET_GLYPH = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

  var DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var DAYS_MY = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_MY = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'ဩဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];

  /* ---------- Moon phases: first sentence ---------- */
  var PHASE = {
    0: { name: 'New Moon', en: 'A fresh start. It is a quiet moment to set one soft intention.',
         my: 'အစပြုချိန်လေးပါ။ ကိုယ့်စိတ်ထဲက Intention လေးတစ်ခုကို ဖြေးဖြေးလေး ချမှတ်ကြည့်ပါနော်။' },
    1: { name: 'First Quarter Moon', en: 'Things can feel a little tense now, which usually means something is being built. One small step is enough.',
         my: 'အခုအချိန်မှာ နည်းနည်း တင်းကျပ်သလို ခံစားရနိုင်ပါတယ်။ တစ်ခုခုကို တည်ဆောက်နေတယ်ဆိုတဲ့ သဘောပါပဲ။ ခြေလှမ်းသေးသေးလေး တစ်လှမ်းနဲ့တင် လုံလောက်ပါတယ်။' },
    2: { name: 'Full Moon', en: 'Feelings are bright and easy to see. Notice what has come to light, and thank yourself for how far you have come.',
         my: 'ခံစားချက်တွေ ပိုထင်ရှားလာတဲ့အချိန်လေးပါ။ ကိုယ့်ရှေ့ကို ဘာတွေ ပေါ်လာလဲ ကြည့်ပြီး ဒီအထိ လာခဲ့တဲ့ ကိုယ့်ကိုယ်ကို ကျေးဇူးတင်လိုက်ပါနော်။' },
    3: { name: 'Last Quarter Moon', en: 'A gentle time to release what feels heavy. Let it go with kindness, not force.',
         my: 'လေးလံနေတဲ့အရာတွေကို လွှတ်ချလိုက်ဖို့ သင့်တော်တဲ့အချိန်လေးပါ။ အတင်းမဟုတ်ဘဲ ကြင်နာစွာနဲ့ လွှတ်ချလိုက်ပါနော်။' }
  };

  var ECLIPSE = {
    solar: { label: 'Solar Eclipse', my: 'Solar Eclipse',
      en: 'This New Moon is a Solar Eclipse, so the reset can feel bigger than usual. Begin gently and give new things time to show themselves.',
      my_text: 'ဒီ New Moon က Solar Eclipse ဖြစ်လို့ အစပြုမှုက ပုံမှန်ထက် ပိုကြီးမားသလို ခံစားရနိုင်ပါတယ်။ ဖြေးဖြေးလေး စတင်ပြီး အသစ်တွေ ပေါ်လာဖို့ အချိန်ပေးထားပါနော်။' },
    lunar: { label: 'Lunar Eclipse', my: 'Lunar Eclipse',
      en: 'This Full Moon is a Lunar Eclipse, so something may reach its natural end. Let it go softly and trust that space is being made.',
      my_text: 'ဒီ Full Moon က Lunar Eclipse ဖြစ်လို့ တစ်ခုခုက သူ့ရဲ့ အဆုံးသတ်ကို ရောက်လာနိုင်ပါတယ်။ ပျော့ပျော့ပြောင်းပြောင်းလေး လွှတ်ချလိုက်ပြီး နေရာလွတ်လေး ဖြစ်လာမယ်လို့ ယုံကြည်ထားပါနော်။' }
  };

  /* ---------- The Moon in each sign: one gentle sentence (also the second sentence on a phase card) ---------- */
  var MOON_SIGN = [
    { en: 'Feelings come up fast and honest, so go easy on your first reaction.',
      my: 'ခံစားချက်တွေ မြန်မြန်ပေါ်လာနိုင်လို့ ပထမဆုံး တုံ့ပြန်မှုလေးကို ဖြေးဖြေးလေး ဆက်ဆံပါနော်။' },
    { en: 'Slow, cosy and comforting. Good for good food, rest and simple pleasures.',
      my: 'ဖြေးဖြေးလေး အေးအေးဆေးဆေး ဖြစ်ချင်တဲ့အချိန်ပါ။ အစားအသောက်၊ အနားယူခြင်းနဲ့ ရိုးရိုးလေး ပျော်စရာတွေနဲ့ သင့်တော်ပါတယ်။' },
    { en: 'Curious and chatty. Lovely for talking things through or trying something new.',
      my: 'စူးစမ်းချင်စိတ်နဲ့ စကားပြောချင်စိတ် များလာပါလိမ့်မယ်။ ကိုယ့်စိတ်ထဲက အရာတွေကို ပြောကြည့်ဖို့ ကောင်းပါတယ်။' },
    { en: 'Tender and homey. You may want closeness, comfort and familiar faces.',
      my: 'နူးညံ့ပြီး အိမ်လိုလို ခံစားရတဲ့အချိန်ပါ။ ရင်းနှီးတဲ့လူတွေနဲ့ အနီးကပ်နေချင်စိတ် ပိုရှိလာနိုင်ပါတယ်။' },
    { en: 'Warm and heartfelt. Let yourself be seen and celebrate your small wins.',
      my: 'နွေးထွေးပြီး ရင်ထဲက ထွက်လာတဲ့ ခံစားချက်တွေ ပေါ်လာပါလိမ့်မယ်။ ကိုယ့်ကိုယ်ကို ပြသဖို့၊ အောင်မြင်မှုသေးသေးလေးတွေကို ဂုဏ်ပြုဖို့ ကောင်းပါတယ်။' },
    { en: 'Quietly practical. A kind day to tidy up, plan and look after your body.',
      my: 'တိတ်တိတ်လေး လက်တွေ့ကျတဲ့အချိန်ပါ။ စီစဉ်ဖို့၊ သန့်ရှင်းရေးလုပ်ဖို့နဲ့ ကိုယ့်ကျန်းမာရေးကို ဂရုစိုက်ဖို့ သင့်တော်ပါတယ်။' },
    { en: 'Soft and social. Peace, fairness and beautiful things feel important.',
      my: 'နူးညံ့ပြီး လူမှုဆက်ဆံရေး ပိုလိုလားတဲ့အချိန်ပါ။ ငြိမ်းချမ်းမှု၊ မျှတမှုနဲ့ လှပတဲ့အရာတွေက ပိုအရေးကြီးလာပါလိမ့်မယ်။' },
    { en: 'Deep and private. Feelings run strong, so being honest with yourself helps.',
      my: 'နက်ရှိုင်းပြီး ကိုယ်ပိုင်ဆန်တဲ့ ခံစားချက်တွေ ပိုပြင်းလာနိုင်ပါတယ်။ ကိုယ့်ကိုယ်ကို ရိုးရိုးသားသား ပြန်ကြည့်ပေးတာ အထောက်အကူ ဖြစ်ပါလိမ့်မယ်။' },
    { en: 'Hopeful and a little restless. Lovely for fresh air, learning and wide-open thoughts.',
      my: 'မျှော်လင့်ချက်များပြီး နည်းနည်း လှုပ်ရှားချင်တဲ့အချိန်ပါ။ လေကောင်းလေသန့်ရှူဖို့၊ သင်ယူဖို့နဲ့ စိတ်ကို ကျယ်ကျယ်ဝန်းဝန်း ထားဖို့ ကောင်းပါတယ်။' },
    { en: 'Steady and serious. Feelings settle when you have one clear, small plan.',
      my: 'တည်ငြိမ်ပြီး ရင့်ကျက်တဲ့ အချိန်ပါ။ ရှင်းရှင်းလေး အစီအစဉ်သေးသေးလေး ရှိရင် စိတ်ထဲက ခံစားချက်တွေ ငြိမ်လာပါလိမ့်မယ်။' },
    { en: 'Open and a little detached. Space for friends, ideas and doing things your own way.',
      my: 'စိတ်ပွင့်လင်းပြီး နည်းနည်း အကွာအဝေးယူချင်တဲ့အချိန်ပါ။ သူငယ်ချင်းတွေ၊ စိတ်ကူးတွေနဲ့ ကိုယ့်ပုံစံနဲ့ကိုယ် လုပ်ကြည့်ဖို့ နေရာရှိပါတယ်။' },
    { en: 'Dreamy and sensitive. Rest, music and quiet time soothe the heart.',
      my: 'အိပ်မက်ဆန်ပြီး ထိလွယ်ရှလွယ်တဲ့အချိန်ပါ။ အနားယူခြင်း၊ ဂီတနဲ့ တိတ်ဆိတ်တဲ့အချိန်လေးတွေက စိတ်ကို ချမ်းမြေ့စေပါတယ်။' }
  ];

  /* ---------- Planets ---------- */
  // domain = what the planet looks after (used in the planet sentences). tone = the feel of the sign it enters.
  var PLANET = {
    Sun:     { domain_en: 'our focus and energy',                          domain_my: 'အာရုံစိုက်မှုနဲ့ ခွန်အား',
               tip_en: 'It is a gentle reset for the next month. Notice where you want to put your light.',
               tip_my: 'နောက်တစ်လလောက်အတွက် Reset လုပ်ဖို့ အချိန်လေးပါ။ ကိုယ့်အလင်းကို ဘယ်နေရာမှာ ထားချင်လဲ ကြည့်လိုက်ပါနော်။' },
    Mercury: { domain_en: 'thinking, talking and everyday plans',           domain_my: 'တွေးတာ၊ ပြောတာနဲ့ နေ့စဉ်အစီအစဉ်တွေ',
               tip_en: 'A good time to say things slowly and kindly.',
               tip_my: 'ဖြေးဖြေးလေး၊ ယဉ်ယဉ်လေး ပြောဆိုဖို့ သင့်တော်တဲ့အချိန်ပါ။',
               rx_en: 'Double-check messages and plans before you press send.',
               rx_my: 'Message တွေနဲ့ အစီအစဉ်တွေကို မပို့ခင် နောက်တစ်ခါ ပြန်စစ်ပေးပါနော်။',
               dr_en: 'Messages and plans start to flow more clearly.',
               dr_my: 'Message တွေနဲ့ အစီအစဉ်တွေ ပိုရှင်းလင်းလာပါလိမ့်မယ်။' },
    Venus:   { domain_en: 'love, money and what we enjoy',                  domain_my: 'အချစ်၊ ငွေကြေးနဲ့ ကိုယ်ပျော်စရာတွေ',
               tip_en: 'Treat yourself and the people you love with a little extra softness.',
               tip_my: 'ကိုယ့်ကိုယ်ကိုရော ချစ်ရတဲ့သူတွေကိုပါ နူးညံ့နူးညံ့လေး ဆက်ဆံကြည့်ပါနော်။',
               rx_en: 'Ask yourself what you truly value before you spend or commit your heart.',
               rx_my: 'ငွေသုံးမယ်၊ စိတ်နှလုံး ပေးမယ်ဆိုရင် ကိုယ်ဘာကို တကယ်တန်ဖိုးထားလဲ ကိုယ့်ကိုယ်ကို မေးကြည့်ပါနော်။',
               dr_en: 'What you value feels clearer, and love and money can move forward.',
               dr_my: 'ကိုယ်တန်ဖိုးထားတာတွေ ပိုရှင်းလာပြီး အချစ်နဲ့ ငွေကြေးကိစ္စတွေ ရှေ့ဆက်နိုင်ပါပြီ။' },
    Mars:    { domain_en: 'drive, courage and action',                      domain_my: 'လှုံ့ဆော်အား၊ သတ္တိနဲ့ လုပ်ဆောင်မှု',
               tip_en: 'Pick one thing to move forward on, instead of ten.',
               tip_my: 'တစ်ဆယ်ခုမဟုတ်ဘဲ တစ်ခုတည်းကို ရွေးပြီး ရှေ့ဆက်ကြည့်ပါနော်။',
               rx_en: 'Rest your energy and finish what is already started.',
               rx_my: 'အားအင်ကို သိမ်းထားပြီး စလုပ်ထားပြီးသားတွေကို အဆုံးသတ်ပါနော်။',
               dr_en: 'Your energy and motivation start to return.',
               dr_my: 'ကိုယ့်ရဲ့ အားအင်နဲ့ လုံ့လဝီရိယ ပြန်လည်လာပါလိမ့်မယ်။' },
    Jupiter: { domain_en: 'growth, luck and big hopes',                     domain_my: 'ကြီးထွားမှု၊ ကံကောင်းမှုနဲ့ မျှော်လင့်ချက်ကြီးတွေ',
               tip_en: 'Notice where you feel hopeful. That is usually where you are meant to grow.',
               tip_my: 'ကိုယ်ဘယ်နေရာမှာ မျှော်လင့်ချက်ရှိလဲ သတိထားကြည့်ပါနော်။ အဲဒီနေရာက ကိုယ်ကြီးထွားဖို့ နေရာဖြစ်လေ့ရှိပါတယ်။',
               rx_en: 'Look inward at what growth really means for you.',
               rx_my: 'ကိုယ့်အတွက် ကြီးထွားမှုဆိုတာ ဘာလဲဆိုတာ အတွင်းဘက်ကို ပြန်ကြည့်ပါနော်။',
               dr_en: 'Growth and good opportunities pick up pace again.',
               dr_my: 'ကြီးထွားမှုနဲ့ အခွင့်အလမ်းကောင်းတွေ ပြန်လည်အရှိန်ရလာပါလိမ့်မယ်။' },
    Saturn:  { domain_en: 'responsibility and long-term commitments',       domain_my: 'တာဝန်ယူမှုနဲ့ ရေရှည်ကတိကဝတ်တွေ',
               tip_en: 'Take an honest, steady look at what is worth committing to.',
               tip_my: 'ဘာကို ရေရှည်ကတိပေးသင့်လဲ ရိုးရိုးသားသား၊ တည်တည်ငြိမ်ငြိမ်လေး ကြည့်ပါနော်။',
               rx_en: 'Review the foundations you are building and strengthen them quietly.',
               rx_my: 'ကိုယ်တည်ဆောက်နေတဲ့ အုတ်မြစ်တွေကို ပြန်ကြည့်ပြီး တိတ်တိတ်လေး ခိုင်မာအောင် လုပ်ပါနော်။',
               dr_en: 'The structures you have been working on feel steadier.',
               dr_my: 'ကိုယ်ကြိုးစားတည်ဆောက်လာတာတွေ ပိုတည်ငြိမ်လာပါလိမ့်မယ်။' },
    Uranus:  { domain_en: 'change and surprises',                           domain_my: 'ပြောင်းလဲမှုနဲ့ မမျှော်လင့်ထားတာတွေ',
               tip_en: 'Stay open to small surprises. You do not need to force change.',
               tip_my: 'မမျှော်လင့်ထားတဲ့ အဖြစ်အပျက်သေးသေးလေးတွေကို ဖွင့်ဖွင့်လေး လက်ခံပါနော်။ ပြောင်းလဲမှုကို အတင်း မလုပ်ပေးရပါဘူး။',
               rx_en: 'Look at what in your life is asking for freedom.',
               rx_my: 'ကိုယ့်ဘဝထဲက ဘာက လွတ်လပ်မှု တောင်းနေလဲ ပြန်ကြည့်ပါနော်။',
               dr_en: 'Changes you have been sensing begin to move again.',
               dr_my: 'ကိုယ်ခံစားမိနေတဲ့ ပြောင်းလဲမှုတွေ ပြန်လည်လှုပ်ရှားလာပါလိမ့်မယ်။' },
    Neptune: { domain_en: 'dreams, intuition and imagination',              domain_my: 'အိပ်မက်၊ Intuition နဲ့ စိတ်ကူး',
               tip_en: 'Rest, listen inward, and let things stay a little unclear for now.',
               tip_my: 'အနားယူပြီး အတွင်းစိတ်ကို နားထောင်ပါနော်။ အခုတော့ အရာတွေ နည်းနည်းမရှင်းသေးတာကို ခွင့်ပြုထားလိုက်ပါ။',
               rx_en: 'Your intuition gets quieter and deeper, so give it room.',
               rx_my: 'ကိုယ့် Intuition က ပိုတိတ်ဆိတ်ပြီး ပိုနက်လာပါလိမ့်မယ်။ နေရာပေးထားပါနော်။',
               dr_en: 'Dreams and intuition become easier to trust again.',
               dr_my: 'အိပ်မက်နဲ့ Intuition တွေကို ပြန်ယုံကြည်ရလွယ်လာပါလိမ့်မယ်။' },
    Pluto:   { domain_en: 'deep change and what we let go of',              domain_my: 'နက်နက်ရှိုင်းရှိုင်း ပြောင်းလဲမှုနဲ့ လွှတ်ချလိုက်တာတွေ',
               tip_en: 'Old layers may rise slowly. Go gently, there is no rush.',
               tip_my: 'အရင်ကအလွှာတွေ ဖြေးဖြေးလေး ပေါ်လာနိုင်ပါတယ်။ အလျင်မလိုဘဲ ဖြေးဖြေးလေး သွားပါနော်။',
               rx_en: 'Look at what you are ready to release, in your own time.',
               rx_my: 'ကိုယ်ဘာကို လွှတ်ချဖို့ အဆင်သင့်ဖြစ်နေလဲ ကိုယ့်အချိန်နဲ့ကိုယ် ကြည့်ပါနော်။',
               dr_en: 'Deep changes begin to move forward again, steadily.',
               dr_my: 'နက်နက်ရှိုင်းရှိုင်း ပြောင်းလဲမှုတွေ တည်ငြိမ်စွာ ရှေ့ဆက်လာပါလိမ့်မယ်။' }
  };

  // The feel of the sign a planet moves into (an adjective phrase in English, a describing phrase in Burmese).
  var SIGN_TONE = [
    { en: 'bold, direct',            my: 'ရဲရင့်ပြီး တိုက်ရိုက်ဆန်တဲ့' },
    { en: 'steady, sensual',         my: 'တည်ငြိမ်ပြီး အရသာခံတတ်တဲ့' },
    { en: 'curious, light',          my: 'စူးစမ်းချင်ပြီး ပေါ့ပါးတဲ့' },
    { en: 'tender, protective',      my: 'နူးညံ့ပြီး ကာကွယ်ပေးချင်တဲ့' },
    { en: 'warm, expressive',        my: 'နွေးထွေးပြီး ဖော်ပြတတ်တဲ့' },
    { en: 'careful, practical',      my: 'သေချာဂရုစိုက်ပြီး လက်တွေ့ကျတဲ့' },
    { en: 'gentle, balanced',        my: 'ပျော့ပျောင်းပြီး မျှတတဲ့' },
    { en: 'deep, honest',            my: 'နက်ရှိုင်းပြီး ရိုးသားတဲ့' },
    { en: 'hopeful, adventurous',    my: 'မျှော်လင့်ချက်ရှိပြီး စွန့်စားချင်တဲ့' },
    { en: 'serious, grounded',       my: 'ရင့်ကျက်ပြီး မြေပြင်ပေါ်ရောက်တဲ့' },
    { en: 'open-minded, original',   my: 'စိတ်ပွင့်ပြီး ထူးခြားတဲ့' },
    { en: 'dreamy, soft',            my: 'အိပ်မက်ဆန်ပြီး နူးညံ့တဲ့' }
  ];

  /* ---------- Page labels ---------- */
  var UI = {
    tz_en: 'Times are Myanmar Time (MMT).',
    tz_my: 'အချိန်တွေကို မြန်မာစံတော်ချိန် (MMT) နဲ့ ပြထားပါတယ်။'
  };

  /* ---------- Sentence builders ---------- */
  function phaseText(ph) {
    if (ph.eclipse) { var e = ECLIPSE[ph.eclipse.type]; return { en: e.en, my: e.my_text }; }
    return { en: PHASE[ph.quarter].en + ' ' + MOON_SIGN[ph.sign].en, my: PHASE[ph.quarter].my + ' ' + MOON_SIGN[ph.sign].my };
  }
  function ingressText(ig) {
    var p = PLANET[ig.body], t = SIGN_TONE[ig.sign];
    return {
      en: ig.body + ' now brings a ' + t.en + ' feel to ' + p.domain_en + '. ' + p.tip_en,
      my: ig.body + ' က ကိုယ့်ရဲ့ ' + p.domain_my + ' ကို ' + t.my + ' ပုံစံလေး ဖြစ်စေပါလိမ့်မယ်။ ' + p.tip_my
    };
  }
  function stationText(st) {
    var p = PLANET[st.body];
    if (st.kind === 'retrograde') return {
      en: st.body + ' slows down and turns retrograde, so ' + p.domain_en + ' ask for a gentler second look. ' + p.rx_en,
      my: st.body + ' က Retrograde ဖြစ်သွားလို့ ကိုယ့်ရဲ့ ' + p.domain_my + ' ကို နှေးနှေးလေး ပြန်ကြည့်ဖို့ ဖိတ်ခေါ်နေပါတယ်။ ' + p.rx_my
    };
    return {
      en: st.body + ' turns direct, and ' + p.domain_en + ' begin to move forward again. ' + p.dr_en,
      my: st.body + ' က Direct ပြန်ဖြစ်လို့ ကိုယ့်ရဲ့ ' + p.domain_my + ' က ရှေ့ကို ပြန်ရွေ့လာပါလိမ့်မယ်။ ' + p.dr_my
    };
  }

  return {
    SIGNS: SIGNS, SIGN_GLYPH: SIGN_GLYPH, PLANET_GLYPH: PLANET_GLYPH, PHASE: PHASE, ECLIPSE: ECLIPSE, MOON_SIGN: MOON_SIGN, PLANET: PLANET, SIGN_TONE: SIGN_TONE,
    DAYS_EN: DAYS_EN, DAYS_MY: DAYS_MY, MONTHS_EN: MONTHS_EN, MONTHS_MY: MONTHS_MY, UI: UI,
    phaseText: phaseText, ingressText: ingressText, stationText: stationText
  };
}));
