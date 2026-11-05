/* The reading outline (sections, chart cues) and the "copy all notes" text.
   Pure functions with no page access, so they can be tested in Node. Browser: window.Soulprint.outline. */
(function (root, factory) {
  var outline = factory();
  if (typeof module === 'object' && module.exports) module.exports = outline;
  else { root.Soulprint = root.Soulprint || {}; root.Soulprint.outline = outline; }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* ---------- The outline. To change a section, edit it here. `id` is what notes are saved under: do not rename it. ---------- */
  var GROUPS = [
    { id: 'open', title: 'Opening' },
    { id: 'hd', title: 'Human Design' },
    { id: 'astro', title: 'Astrology' },
    { id: 'weave', title: 'Bringing it together' },
    { id: 'close', title: 'Closing' }
  ];
  var SECTIONS = [
    { id: 'intro', group: 'open', title: 'Welcome & intention', prompt: 'What brought them here? What do they hope to leave with? Any question to answer first?' },
    { id: 'type', group: 'hd', title: 'Type & Strategy', prompt: 'How they move through the day, how they decide to act, and what the not-self theme looks like for them.' },
    { id: 'authority', group: 'hd', title: 'Inner Authority', prompt: 'How their body gives them a reliable yes or no, and how they currently make big decisions.' },
    { id: 'profile', group: 'hd', title: 'Profile', prompt: 'Conscious and unconscious lines: the role they play and how they learn.' },
    { id: 'definition', group: 'hd', title: 'Definition', prompt: 'How their defined energy connects (or does not), and who helps bridge it.' },
    { id: 'cross', group: 'hd', title: 'Incarnation Cross', prompt: 'The theme running through their life, and where it already shows up.' },
    { id: 'centers', group: 'hd', title: 'Defined & open centers', prompt: 'Where they are steady and where they take in and amplify other people.' },
    { id: 'channels', group: 'hd', title: 'Channels & gates', prompt: 'Their defined channels, plus any hanging gates and what these bring in.' },
    { id: 'sun', group: 'astro', title: 'Sun', prompt: 'Core identity and vitality.' },
    { id: 'moon', group: 'astro', title: 'Moon', prompt: 'Emotional needs and what makes them feel safe.' },
    { id: 'rising', group: 'astro', title: 'Rising', prompt: 'How they meet the world and how others first read them.' },
    { id: 'weave', group: 'weave', title: 'Where Human Design and astrology meet', prompt: 'Themes that repeat across both systems.' },
    { id: 'guidance', group: 'weave', title: 'Guidance & experiments', prompt: 'One to three small things they can try this week.' },
    { id: 'questions', group: 'weave', title: 'Their questions', prompt: 'Questions they asked and the answers you gave.' },
    { id: 'followup', group: 'close', title: 'Closing & follow-up', prompt: 'Next steps, a recording or summary to send, any package to offer.' }
  ];

  /* ---------- Small formatters ---------- */

  function fmtDate(iso) { // '1990-05-14' -> '14 May 1990'
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    return parseInt(p[2], 10) + ' ' + MONTHS[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function fmtTime(hhmm) { // '18:05' -> '6:05 PM'
    var p = String(hhmm || '').split(':');
    var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
    if (isNaN(h) || isNaN(m)) return '';
    return ((h % 12) || 12) + ':' + (m < 10 ? '0' : '') + m + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  // "14 May 1990, 6:30 AM · Yangon, Myanmar (UTC+06:30)"
  function birthLine(inputs, offsetLabel) {
    var time = inputs.timeUnknown ? 'time unknown (12:00 PM used)' : fmtTime(inputs.time);
    var place = [inputs.place, inputs.countryName].filter(Boolean).join(', ');
    return fmtDate(inputs.date) + ', ' + time + ' · ' + place + (offsetLabel ? ' (' + offsetLabel + ')' : '');
  }

  /* ---------- Turn the chart into plain words ---------- */

  // chart: result of Soulprint.calc.calculateChart. astro: result of Soulprint.astro.astrologyAt.
  // T: Soulprint.content. D: Soulprint.data.
  function summarize(chart, astro, T, D, inputs) {
    var x = chart.cross, parts = chart.profile.split('/');
    var names = function (arr) { return arr.map(function (c) { return D.CENTER_NAMES[c]; }); };

    var inChannel = {};
    chart.channels.forEach(function (c) { inChannel[c.a] = true; inChannel[c.b] = true; });
    var hanging = Object.keys(chart.activeGates).map(Number).filter(function (g) { return !inChannel[g]; }).sort(function (a, b) { return a - b; });

    return {
      type: T.TYPES[chart.type].name,
      strategy: T.STRATEGIES[chart.strategy].name,
      authority: T.AUTHORITIES[chart.authority].name,
      notSelf: T.NOT_SELF[chart.type].name,
      signature: T.SIGNATURE[chart.type].name,
      profile: chart.profile,
      profileName: T.PROFILE_LINES[parts[0]] + ' / ' + T.PROFILE_LINES[parts[1]],
      definition: T.DEFINITIONS[chart.definition].name,
      definitionGroups: chart.groups.length > 1 ? chart.groups.map(function (g) { return names(g).join(', '); }).join('  |  ') : '',
      cross: T.crossTitle(x.angle, x.personalitySun),
      crossGates: '(' + x.personalitySun + '/' + x.personalityEarth + ' | ' + x.designSun + '/' + x.designEarth + ')',
      defined: names(chart.definedCenterList),
      open: names(chart.openCenterList),
      channels: chart.channels.map(function (c) { return c.a + '-' + c.b + ' ' + c.name; }),
      hangingGates: hanging,
      gateCount: Object.keys(chart.activeGates).length,
      sun: astro.sun.text,
      moon: astro.moon.text,
      rising: astro.rising.text,
      risingNote: astro.risingNote || '',
      birth: birthLine(inputs, chart.timeInfo && chart.timeInfo.offsetLabel)
    };
  }

  // The short line shown under each section title, so the chart facts are in front of you while you take notes.
  function cues(s) {
    return {
      intro: '',
      type: s.type + ' · ' + s.strategy + ' · Not-self: ' + s.notSelf + ' · Signature: ' + s.signature,
      authority: s.authority,
      profile: s.profile + ' · ' + s.profileName,
      definition: s.definition + (s.definitionGroups ? ' (' + s.definitionGroups + ')' : ''),
      cross: s.cross + ' ' + s.crossGates,
      centers: 'Defined: ' + (s.defined.join(', ') || 'none') + ' · Open: ' + (s.open.join(', ') || 'none'),
      channels: (s.channels.length ? s.channels.join(', ') : 'No defined channels') + ' · ' + s.gateCount + ' gates active' +
        (s.hangingGates.length ? ' · Hanging gates: ' + s.hangingGates.join(', ') : ''),
      sun: 'Sun in ' + s.sun,
      moon: 'Moon in ' + s.moon,
      rising: 'Rising ' + s.rising,
      weave: '', guidance: '', questions: '', followup: ''
    };
  }

  /* ---------- Copy all notes ---------- */

  // client: { inputs: { name, ... }, notes: { sectionId: 'text' } }. s: result of summarize.
  function copyText(client, s) {
    var notes = client.notes || {}, cue = cues(s), out = [];
    out.push('READING PREP: ' + client.inputs.name);
    out.push('Born: ' + s.birth);
    out.push('Human Design: ' + [s.type, s.strategy, s.authority, 'Profile ' + s.profile, s.definition].join(' · '));
    out.push('Cross: ' + s.cross + ' ' + s.crossGates);
    out.push('Astrology: Sun ' + s.sun + ' · Moon ' + s.moon + ' · Rising ' + s.rising);
    SECTIONS.forEach(function (sec, i) {
      var text = String(notes[sec.id] || '').trim();
      out.push('');
      out.push((i + 1) + '. ' + sec.title.toUpperCase());
      if (cue[sec.id]) out.push('(' + cue[sec.id] + ')');
      out.push(text || '–');
    });
    return out.join('\n') + '\n';
  }

  return {
    GROUPS: GROUPS, SECTIONS: SECTIONS, fmtDate: fmtDate, fmtTime: fmtTime, birthLine: birthLine,
    summarize: summarize, cues: cues, copyText: copyText
  };
}));
