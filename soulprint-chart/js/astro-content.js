/* Short, original meanings for the Sun, Moon and Rising in each sign (English + Burmese).
   Edit the text between the quote marks. The Burmese line is shown under the English one. */
window.Soulprint = window.Soulprint || {};
window.Soulprint.astroContent = (function () {
  'use strict';

  var SUN = [
    { en: 'You are a natural starter. You feel most alive when you can move first, speak plainly and follow your own spark.',
      my: 'ကိုယ်က စတင်တတ်သူပါ။ ကိုယ့်ရဲ့ မီးပွားနောက်ကို ရဲရဲလိုက်ပြီး ရိုးရိုးသားသား ပြောဆိုလုပ်ဆောင်တဲ့အခါ အသက်ဝင်ဝင်ဆုံး ခံစားရပါတယ်။' },
    { en: 'You build a steady life one calm step at a time. You feel like yourself when things are real, beautiful and unhurried.',
      my: 'တည်ငြိမ်စွာ တစ်လှမ်းချင်း ဘဝကို တည်ဆောက်တတ်သူပါ။ လက်တွေ့ကျပြီး လှပတဲ့အရာတွေကို မြန်မြန်မလုပ်ဘဲ ခံစားရတဲ့အခါ ကိုယ့်ကိုယ်ကို ပြန်တွေ့ပါတယ်။' },
    { en: 'Curiosity runs you. You come alive through conversation, learning and trying a little of everything.',
      my: 'စပ်စုချင်စိတ်က ကိုယ့်ကို မောင်းနှင်ပါတယ်။ စကားပြောခြင်း၊ သင်ယူခြင်းနဲ့ အမျိုးမျိုး စမ်းကြည့်ခြင်းတွေကနေ အသက်ဝင်လာပါတယ်။' },
    { en: 'You lead with care. Home, family and feeling safe shape who you are, and you protect what you love.',
      my: 'စောင့်ရှောက်မှုနဲ့ ဦးဆောင်တတ်သူပါ။ အိမ်၊ မိသားစုနဲ့ လုံခြုံမှုက ကိုယ့်ကို ပုံဖော်ပြီး ချစ်တဲ့သူတွေကို ကာကွယ်တတ်ပါတယ်။' },
    { en: 'You shine when you are warm, generous and seen for who you really are. Your heart wants to create and to be loyal.',
      my: 'နွေးထွေးပြီး ရက်ရောကာ ကိုယ်အစစ်အတိုင်း မြင်ခံရတဲ့အခါ ထွန်းလင်းတောက်ပပါတယ်။ ကိုယ့်နှလုံးသားက ဖန်တီးချင်ပြီး သစ္စာရှိချင်ပါတယ်။' },
    { en: 'You show love through usefulness. Details, honest effort and quietly making things better are your strengths.',
      my: 'အသုံးဝင်အောင် ကူညီခြင်းနဲ့ ချစ်ခြင်းကို ပြတတ်သူပါ။ အသေးစိတ်၊ ရိုးသားတဲ့ ကြိုးစားမှုနဲ့ တိတ်တိတ်လေး ပိုကောင်းအောင် လုပ်ပေးတာတွေက ကိုယ့်ရဲ့ အားသာချက်တွေပါ။' },
    { en: 'You look for balance and harmony. Fairness, beauty and close partnership help you feel whole.',
      my: 'ညီမျှမှုနဲ့ သဟဇာတကို ရှာဖွေသူပါ။ တရားမျှတမှု၊ အလှအပနဲ့ နီးကပ်တဲ့ ပတ်သက်မှုတွေက ကိုယ့်ကို ပြည့်စုံစေပါတယ်။' },
    { en: 'You go deep or not at all. You feel things strongly, notice what is hidden and change through honest intensity.',
      my: 'နက်နက်ရှိုင်းရှိုင်း သွားသူပါ။ ခံစားမှုကြီးပြီး ဖုံးကွယ်ထားတာတွေကို သတိထားမိကာ ရိုးသားတဲ့ ပြင်းထန်မှုကနေ ပြောင်းလဲသွားပါတယ်။' },
    { en: 'You need room and meaning. Adventure, truth and big ideas lift you, and you grow by exploring.',
      my: 'နေရာနဲ့ အဓိပ္ပာယ် လိုအပ်သူပါ။ စွန့်စားခြင်း၊ အမှန်တရားနဲ့ ကြီးကျယ်တဲ့ အတွေးတွေက ကိုယ့်ကို မြှင့်တင်ပေးပြီး ရှာဖွေရင်း ကြီးထွားပါတယ်။' },
    { en: 'You are patient and serious about your goals. You build slowly, take responsibility and earn lasting respect.',
      my: 'ပန်းတိုင်ကို သည်းခံပြီး လေးလေးနက်နက် လုပ်သူပါ။ ဖြည်းဖြည်းချင်း တည်ဆောက်ကာ တာဝန်ယူပြီး ရေရှည်လေးစားမှု ရပါတယ်။' },
    { en: 'You think your own way. You value freedom, friendship and ideas that could make life better for everyone.',
      my: 'ကိုယ့်နည်းကိုယ်ဟန်နဲ့ တွေးသူပါ။ လွတ်လပ်မှု၊ ခင်မင်ရင်းနှီးမှုနဲ့ လူတိုင်းအတွက် ဘဝကို ပိုကောင်းစေမယ့် အတွေးတွေကို တန်ဖိုးထားပါတယ်။' },
    { en: 'You feel everything and imagine freely. Compassion, creativity and intuition are your gifts, and you need quiet to refill.',
      my: 'အရာရာကို ခံစားတတ်ပြီး လွတ်လပ်စွာ စိတ်ကူးနိုင်သူပါ။ ကရုဏာ၊ ဖန်တီးမှုနဲ့ Intuition တွေက ကိုယ့်ရဲ့ ဆုလာဘ်တွေဖြစ်ပြီး ပြန်လည်အားဖြည့်ဖို့ တိတ်ဆိတ်မှု လိုအပ်ပါတယ်။' }
  ];

  var MOON = [
    { en: 'You feel first and fast. You need action, honesty and room to let feelings out, then you let them go.',
      my: 'ခံစားမှုက မြန်မြန်လာပါတယ်။ ခံစားချက်ကို ထုတ်ပြောဖို့ လှုပ်ရှားမှု၊ ရိုးသားမှုနဲ့ နေရာ လိုအပ်ပြီး ပြီးရင် ပြန်လွှတ်ပေးလိုက်နိုင်ပါတယ်။' },
    { en: 'You need calm, comfort and routines you can trust. Good food, touch and a steady home settle you.',
      my: 'တည်ငြိမ်မှု၊ သက်တောင့်သက်သာနဲ့ ယုံကြည်စိတ်ချရတဲ့ လုပ်ငန်းစဉ်တွေ လိုအပ်ပါတယ်။ အစားအသောက်ကောင်းကောင်း၊ ထိတွေ့ကိုင်တွယ်မှုနဲ့ တည်ငြိမ်တဲ့ အိမ်က စိတ်ကို ငြိမ်းစေပါတယ်။' },
    { en: 'You process feelings by talking and thinking. You need variety, conversation and a mind that stays busy.',
      my: 'စကားပြောပြီး တွေးခေါ်ခြင်းနဲ့ ခံစားချက်ကို ဖြေရှင်းတတ်ပါတယ်။ အမျိုးမျိုးကွဲပြားမှု၊ စကားဝိုင်းနဲ့ အလုပ်များနေတဲ့ စိတ်ကို လိုအပ်ပါတယ်။' },
    { en: 'Your feelings run deep and you need to feel safe. Closeness, home and being cared for are essential.',
      my: 'ခံစားမှုတွေက နက်ရှိုင်းပြီး လုံခြုံမှု ခံစားရဖို့ လိုပါတယ်။ ရင်းနှီးမှု၊ အိမ်နဲ့ ဂရုစိုက်ခံရမှုတွေက မရှိမဖြစ်ပါ။' },
    { en: 'You need warmth, appreciation and play. Feeling special to the people you love brings out your big heart.',
      my: 'နွေးထွေးမှု၊ တန်ဖိုးထားခံရမှုနဲ့ ပျော်ရွှင်မှု လိုအပ်ပါတယ်။ ချစ်သူတွေအတွက် ထူးခြားတယ်လို့ ခံစားရတဲ့အခါ ကိုယ့်ရဲ့ နှလုံးသားကြီးမားမှု ပေါ်လာပါတယ်။' },
    { en: 'You settle by being useful and tidy. Order, routine and clear plans calm a mind that worries easily.',
      my: 'အသုံးဝင်ပြီး သပ်ရပ်မှုနဲ့ စိတ်ငြိမ်သွားပါတယ်။ စနစ်တကျ၊ လုပ်ငန်းစဉ်နဲ့ ရှင်းလင်းတဲ့ အစီအစဉ်တွေက လွယ်လွယ်ပူပန်တတ်တဲ့ စိတ်ကို ငြိမ်းစေပါတယ်။' },
    { en: 'You need peace and gentle company. When things around you are in harmony, you can feel okay inside.',
      my: 'ငြိမ်းချမ်းမှုနဲ့ ယဉ်ကျေးတဲ့ အပေါင်းအသင်း လိုအပ်ပါတယ်။ ပတ်ဝန်းကျင် သဟဇာတဖြစ်တဲ့အခါ ကိုယ်တွင်းမှာ အဆင်ပြေပါတယ်။' },
    { en: 'You feel with great intensity and keep much of it private. Trust, loyalty and deep honesty make you feel safe.',
      my: 'ပြင်းပြင်းထန်ထန် ခံစားပြီး အများကြီးကို သီးသန့်ထားတတ်ပါတယ်။ ယုံကြည်မှု၊ သစ္စာရှိမှုနဲ့ နက်နက်ရှိုင်းရှိုင်း ရိုးသားမှုက လုံခြုံစေပါတယ်။' },
    { en: 'You need freedom and hope. Fresh air, movement and a good laugh keep your feelings light.',
      my: 'လွတ်လပ်မှုနဲ့ မျှော်လင့်ချက် လိုအပ်ပါတယ်။ လေကောင်းလေသန့်၊ လှုပ်ရှားမှုနဲ့ ရယ်မောမှုက ခံစားချက်ကို ပေါ့ပါးစေပါတယ်။' },
    { en: 'You hold your feelings with care and keep going. Structure and respect help you feel secure, and you are slow to ask for comfort.',
      my: 'ခံစားချက်ကို ဂရုတစိုက် ကိုင်ဆောင်ပြီး ဆက်လျှောက်တတ်ပါတယ်။ ဖွဲ့စည်းမှုနဲ့ လေးစားမှုက လုံခြုံစေပြီး နှစ်သိမ့်မှုကို တောင်းဖို့ နှေးတတ်ပါတယ်။' },
    { en: 'You need space to feel in your own way. Friendship, honesty and a little distance help you stay calm.',
      my: 'ကိုယ့်ဟန်နဲ့ ခံစားဖို့ နေရာ လိုအပ်ပါတယ်။ ခင်မင်မှု၊ ရိုးသားမှုနဲ့ အနည်းငယ် အကွာအဝေးက စိတ်ကို တည်ငြိမ်စေပါတယ်။' },
    { en: 'You soak up the feelings around you. You need quiet, creativity and gentle time alone to recharge.',
      my: 'ပတ်ဝန်းကျင်က ခံစားချက်တွေကို စုပ်ယူတတ်ပါတယ်။ ပြန်လည်အားဖြည့်ဖို့ တိတ်ဆိတ်မှု၊ ဖန်တီးမှုနဲ့ တစ်ကိုယ်တည်း နူးညံ့တဲ့ အချိန် လိုအပ်ပါတယ်။' }
  ];

  var RISING = [
    { en: 'People meet you as direct, quick and brave. You walk into new things head first.',
      my: 'လူတွေက ကိုယ့်ကို တိုက်ရိုက်ပြောတတ်၊ မြန်မြန်ဆန်ဆန်နဲ့ ရဲရင့်သူအဖြစ် တွေ့ပါတယ်။ အသစ်တွေကို ခေါင်းထိုးဝင်ပါတယ်။' },
    { en: 'You come across as calm, grounded and easy to be around. People feel steadiness in your presence.',
      my: 'တည်ငြိမ်၊ မြေစိုက်ပြီး ရင်းနှီးရလွယ်သူအဖြစ် မြင်ပါတယ်။ ကိုယ့်ရှေ့မှာ တည်ငြိမ်မှုကို ခံစားရပါတယ်။' },
    { en: 'You come across as bright, chatty and curious. You adapt quickly to whoever you meet.',
      my: 'တောက်ပြီး စကားများ၊ စပ်စုတတ်သူအဖြစ် မြင်ပါတယ်။ ဆုံတွေ့သူကို အမြန်လိုက်လျောညီထွေ နေတတ်ပါတယ်။' },
    { en: 'You come across as gentle and protective. People sense your care before you say a word.',
      my: 'နူးညံ့ပြီး ကာကွယ်စောင့်ရှောက်တတ်သူအဖြစ် မြင်ပါတယ်။ စကားမပြောခင်ကတည်းက ကိုယ့်ရဲ့ ဂရုစိုက်မှုကို လူတွေ ခံစားမိပါတယ်။' },
    { en: 'You come across as warm, confident and a little dramatic in the best way. People notice you when you enter.',
      my: 'နွေးထွေး၊ ယုံကြည်မှုရှိပြီး ကောင်းတဲ့ဘက်က နည်းနည်း ဖျတ်ဖျတ်လတ်လတ်ရှိသူအဖြစ် မြင်ပါတယ်။ ကိုယ်ဝင်လာတာနဲ့ လူတွေ သတိထားမိပါတယ်။' },
    { en: 'You come across as modest, thoughtful and capable. People trust you to get things right.',
      my: 'ရိုးရိုးစင်းစင်း၊ စဉ်းစားတတ်ပြီး စွမ်းဆောင်နိုင်သူအဖြစ် မြင်ပါတယ်။ အရာတွေကို မှန်ကန်အောင် လုပ်နိုင်လိမ့်မယ်လို့ လူတွေ ယုံကြည်ပါတယ်။' },
    { en: 'You come across as charming and fair. You aim to make everyone feel at ease.',
      my: 'ဆွဲဆောင်မှုရှိပြီး မျှတသူအဖြစ် မြင်ပါတယ်။ လူတိုင်း သက်တောင့်သက်သာ ခံစားရအောင် ကြိုးစားပါတယ်။' },
    { en: 'You come across as intense and hard to read. People feel your presence and sense there is more beneath.',
      my: 'ပြင်းပြပြီး ဖတ်လို့ခက်သူအဖြစ် မြင်ပါတယ်။ ကိုယ့်ရှိနေမှုကို လူတွေ ခံစားမိပြီး အတွင်းမှာ ပိုရှိနေတာကို သိပါတယ်။' },
    { en: 'You come across as friendly, open and upbeat. You meet life with a big smile and a sense of adventure.',
      my: 'ရင်းနှီးပြီး ပွင့်လင်း၊ အားရှိသူအဖြစ် မြင်ပါတယ်။ ဘဝကို အပြုံးကြီးနဲ့ စွန့်စားစိတ်နဲ့ ကြိုဆိုပါတယ်။' },
    { en: 'You come across as composed and responsible. People see someone mature and dependable.',
      my: 'တည်ငြိမ်ပြီး တာဝန်ယူတတ်သူအဖြစ် မြင်ပါတယ်။ အရွယ်ရောက်ပြီး အားကိုးရသူကို လူတွေ တွေ့ပါတယ်။' },
    { en: 'You come across as friendly yet independent, and a little unusual. You stand out by simply being yourself.',
      my: 'ရင်းနှီးပေမယ့် လွတ်လပ်ပြီး နည်းနည်း ထူးခြားသူအဖြစ် မြင်ပါတယ်။ ကိုယ်အတိုင်းနေရုံနဲ့ ထင်ရှားပါတယ်။' },
    { en: 'You come across as soft, dreamy and kind. People feel your gentleness and imagination.',
      my: 'နူးညံ့၊ အိပ်မက်မက်ပြီး ကြင်နာသူအဖြစ် မြင်ပါတယ်။ ကိုယ့်ရဲ့ နူးညံ့မှုနဲ့ စိတ်ကူးစိတ်သန်းကို လူတွေ ခံစားမိပါတယ်။' }
  ];

  return {
    sun: SUN, moon: MOON, rising: RISING,
    // What each of the three means, as a small heading
    headings: {
      sun: { en: 'Sun', my: 'ကိုယ့်ရဲ့ အနှစ်သာရ', note: 'Your core self' },
      moon: { en: 'Moon', my: 'ကိုယ့်ရဲ့ စိတ်ခံစားမှု', note: 'Your feelings and needs' },
      rising: { en: 'Rising', my: 'လူတွေ မြင်တဲ့ ကိုယ့်ပုံစံ', note: 'How you meet the world' }
    }
  };
}());
