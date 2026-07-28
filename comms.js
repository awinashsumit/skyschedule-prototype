/* skySchedule - Communications: shared data, token resolution, reach and cost.
   People and shifts mirror bfms.js / schedule.html so a person reads the same
   everywhere. Reachability is derived from the same attributes the BFM form
   captures (mobile number, SMS opt-in, app user), which is why a channel can be
   globally enabled but unavailable for a given person. */
(function () {
  'use strict';

  var ORG = 'Skypoint';
  var LOCATION = 'skypoint';

  // reachability inputs: phone + smsOptIn drive SMS, appUser drives push.
  // Reasons deliberately differ so the UI has to explain each one.
  var PEOPLE = [
    { id: 1, name: 'Anush Kulal', first: 'Anush', email: 'anush.kulal@skypoint.ai', phone: '+1 503 555 0141', smsOptIn: true, appUser: true,
      avatar: 'c5', initials: 'AK', position: 'Daily Labour', shiftDate: 'Mon, Jul 27', shiftWindow: '7:00 AM to 3:00 PM' },
    { id: 2, name: 'Harsh Kumar', first: 'Harsh', email: 'harsh.kumar@skypoint.ai', phone: '', smsOptIn: true, appUser: true,
      avatar: 'c7', initials: 'HK', position: 'Daily Labour', shiftDate: 'Tue, Jul 28', shiftWindow: '7:00 AM to 3:00 PM' },
    { id: 4, name: 'Keerthana M', first: 'Keerthana', email: 'keerthana.manjunath@skypoint.ai', phone: '+1 503 555 0133', smsOptIn: true, appUser: false,
      avatar: 'c1', initials: 'KM', position: 'Bread Basket Coordinator', shiftDate: 'Tue, Jul 28', shiftWindow: '9:00 AM to 5:00 PM' },
    { id: 5, name: 'Meera Nair', first: 'Meera', email: 'meera.nair@skypoint.ai', phone: '+1 503 555 0118', smsOptIn: true, appUser: true,
      avatar: 'c8', initials: 'MN', position: 'Certified Caregiver', shiftDate: 'Tue, Jul 28', shiftWindow: '7:00 AM to 3:00 PM' },
    { id: 6, name: 'Priya Desai', first: 'Priya', email: 'priya.desai@skypoint.ai', phone: '+1 503 555 0126', smsOptIn: false, appUser: true,
      avatar: 'c4', initials: 'PD', position: 'Cook', shiftDate: 'Thu, Jul 30', shiftWindow: '3:00 PM to 11:00 PM' },
    { id: 7, name: 'Ravi Menon', first: 'Ravi', email: 'ravi.menon@skypoint.ai', phone: '+1 503 555 0124', smsOptIn: true, appUser: true,
      avatar: 'c6', initials: 'RM', position: 'Cook', shiftDate: 'Sun, Jul 26', shiftWindow: '11:00 AM to 7:00 PM' },
    { id: 8, name: 'Sahu Sahu', first: 'Sahu', email: 'sahu.himanshu@skypoint.ai', phone: '+1 503 555 0120', smsOptIn: true, appUser: true,
      avatar: 'c3', initials: 'SS', position: 'Dishwasher', shiftDate: 'Mon, Jul 27', shiftWindow: '7:00 AM to 3:00 PM' },
    { id: 9, name: 'Saumaya Surabhi', first: 'Saumaya', email: 'saumaya.surabhi@skypoint.ai', phone: '+1 503 555 0115', smsOptIn: true, appUser: false,
      avatar: 'c7', initials: 'SS', position: 'Administrative Assistant', shiftDate: 'Sat, Aug 1', shiftWindow: '7:00 AM to 3:00 PM' }
  ];

  var TOKENS = ['firstName', 'location', 'org', 'date', 'shiftWindow', 'shiftDate', 'link'];

  var TEMPLATES = [
    { id: 1, name: 'In-service training', shared: true,
      sms: 'Hi {firstName}, reminder: in-service training at {location} on {date}. Please plan to attend during your shift.',
      emailSubject: 'In-service training on {date}',
      emailBody: 'Hi {firstName},\n\nThis is a reminder that in-service training is scheduled at {location} on {date}.\n\nPlease plan to attend during your shift. Details: {link}\n\nThanks,\n{org}' },
    { id: 2, name: 'Fire drill notice', shared: true,
      sms: 'Hi {firstName}, fire drill at {location} on {date}. Follow evacuation procedures during your shift.',
      emailSubject: 'Fire drill at {location} on {date}',
      emailBody: 'Hi {firstName},\n\nA fire drill is scheduled at {location} on {date}.\n\nPlease follow standard evacuation procedures during your shift.\n\nThanks,\n{org}' },
    { id: 3, name: 'Shift confirmation', shared: false,
      sms: 'Hi {firstName}, you are assigned to {shiftWindow} on {shiftDate} at {location}. Confirm here: {link}',
      emailSubject: 'Your shift on {shiftDate}',
      emailBody: 'Hi {firstName},\n\nYou are assigned to {shiftWindow} on {shiftDate} at {location}.\n\nConfirm your shift: {link}\n\nThanks,\n{org}' }
  ];

  // Sent messages store the RENDERED text plus per-channel delivery outcomes,
  // so History is an audit trail rather than a copy of the template.
  var MESSAGES = [
    { id: 1, status: 'sent', title: null, sentAt: 'Wed, Jul 22 at 2:20 PM', sender: 'Sahu Sahu', senderAvatar: 'c3', senderInitials: 'SS',
      audience: "The week's schedule, Jul 19 to Jul 25", templateName: 'In-service training',
      renderedSample: 'Hi Anush, reminder: in-service training at skypoint on Jul 24. Please plan to attend during your shift.',
      recipients: 5,
      channels: { sms: { sent: 4, delivered: 4, failed: 0 }, email: { sent: 5, delivered: 5, failed: 0 }, push: { sent: 3, delivered: 3, failed: 0 } } },
    { id: 2, status: 'sent', title: null, sentAt: 'Mon, Jul 20 at 11:01 AM', sender: 'Harshitha Suresha', senderAvatar: 'c2', senderInitials: 'HS',
      audience: 'Monday shift, Jul 20', templateName: null,
      renderedSample: 'Team, the delivery is arriving at 2 PM today. Please keep the loading bay clear.',
      recipients: 4,
      channels: { sms: { sent: 3, delivered: 2, failed: 1 }, email: { sent: 4, delivered: 4, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } } },
    { id: 3, status: 'sent', title: null, sentAt: 'Thu, Jul 16 at 7:49 PM', sender: 'Yaswanth Ponnada', senderAvatar: 'c6', senderInitials: 'YP',
      audience: 'Evening shift, Jul 16', templateName: null,
      renderedSample: 'Hi team, please assemble near the exit gate at the end of your shift for a short briefing.',
      recipients: 2,
      channels: { sms: { sent: 2, delivered: 2, failed: 0 }, email: { sent: 2, delivered: 2, failed: 0 }, push: { sent: 2, delivered: 2, failed: 0 } } },
    { id: 4, status: 'sent', title: null, sentAt: 'Mon, Jul 13 at 2:24 PM', sender: 'Harshitha Suresha', senderAvatar: 'c2', senderInitials: 'HS',
      audience: "The week's schedule, Jul 12 to Jul 18", templateName: 'Shift confirmation',
      renderedSample: 'Hi Meera, you are assigned to 7:00 AM to 3:00 PM on Tue, Jul 14 at skypoint. Confirm here: sky.link/s/8842',
      recipients: 3,
      channels: { sms: { sent: 3, delivered: 3, failed: 0 }, email: { sent: 3, delivered: 2, failed: 1 }, push: { sent: 2, delivered: 2, failed: 0 } } },
    { id: 5, status: 'sent', title: null, sentAt: 'Wed, Jul 8 at 2:55 PM', sender: 'Harshitha Suresha', senderAvatar: 'c2', senderInitials: 'HS',
      audience: "The week's schedule, Jul 5 to Jul 11", templateName: 'Fire drill notice',
      renderedSample: 'Hi Ravi, fire drill at skypoint on Jul 9. Follow evacuation procedures during your shift.',
      recipients: 3,
      channels: { sms: { sent: 3, delivered: 3, failed: 0 }, email: { sent: 3, delivered: 3, failed: 0 }, push: { sent: 1, delivered: 1, failed: 0 } } }
  ];

  // ---- Token resolution ----
  function tokenValues(person) {
    return {
      firstName: person ? person.first : 'there',
      location: LOCATION,
      org: ORG,
      date: 'Jul 30',
      shiftWindow: person ? person.shiftWindow : '7:00 AM to 3:00 PM',
      shiftDate: person ? person.shiftDate : 'Mon, Jul 27',
      link: 'sky.link/s/8842'
    };
  }
  function render(text, person) {
    var vals = tokenValues(person);
    return String(text || '').replace(/\{(\w+)\}/g, function (whole, key) {
      return Object.prototype.hasOwnProperty.call(vals, key) ? vals[key] : whole;
    });
  }
  // Any {token} that is not a known field. These ship as literal text, so they
  // are treated as an error rather than left for the recipient to discover.
  function unknownTokens(text) {
    var found = [], m, re = /\{(\w+)\}/g;
    while ((m = re.exec(String(text || '')))) {
      if (TOKENS.indexOf(m[1]) === -1 && found.indexOf(m[1]) === -1) found.push(m[1]);
    }
    return found;
  }

  // ---- SMS segments ----
  // GSM-7: 160 for one segment, 153 each when concatenated. Unicode: 70 / 67.
  function segmentsFor(text) {
    var s = String(text || '');
    if (!s.length) return 0;
    var unicode = /[^\x00-\x7F]/.test(s);
    var single = unicode ? 70 : 160, multi = unicode ? 67 : 153;
    return s.length <= single ? 1 : Math.ceil(s.length / multi);
  }
  // Tokens expand at send time, so the editor length is not the billed length.
  // Report the real spread across the selected audience.
  function segmentRange(text, people) {
    if (!people.length) return { min: 0, max: 0, unicode: /[^\x00-\x7F]/.test(text || '') };
    var lens = people.map(function (p) { return segmentsFor(render(text, p)); });
    return {
      min: Math.min.apply(null, lens),
      max: Math.max.apply(null, lens),
      unicode: /[^\x00-\x7F]/.test(render(text, people[0]))
    };
  }

  // ---- Reachability ----
  function reachFor(person, channel) {
    if (channel === 'email') return { ok: !!person.email, reason: person.email ? '' : 'No email address on file' };
    if (channel === 'sms') {
      if (!person.phone) return { ok: false, reason: 'No mobile number on file' };
      if (!person.smsOptIn) return { ok: false, reason: 'Opted out of SMS' };
      return { ok: true, reason: '' };
    }
    if (channel === 'push') {
      return person.appUser ? { ok: true, reason: '' } : { ok: false, reason: 'Does not use the mobile app' };
    }
    return { ok: false, reason: '' };
  }
  function reachSummary(people, channel) {
    var ok = people.filter(function (p) { return reachFor(p, channel).ok; });
    var blocked = people.filter(function (p) { return !reachFor(p, channel).ok; });
    var reasons = {};
    blocked.forEach(function (p) {
      var r = reachFor(p, channel).reason;
      reasons[r] = (reasons[r] || 0) + 1;
    });
    return { reached: ok.length, total: people.length, blocked: blocked.length, reasons: reasons };
  }

  // ---- Shared UI helpers ----
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function avatarHTML(p, size) {
    var s = size || 28;
    return '<span class="avatar ' + p.avatar + '" style="width:' + s + 'px;height:' + s + 'px;font-size:' + (s <= 28 ? 11 : 13) + 'px;flex:none;">' + p.initials + '</span>';
  }
  function icon(paths, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  var I = {
    x: '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" /> <path d="m21.854 2.147-10.94 10.939" />',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
    check: '<circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" />',
    clock: '<circle cx="12" cy="12" r="10" /> <path d="M12 6v6l4 2" />',
    trash: '<path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /> <path d="m15 5 4 4" />',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    search: '<path d="m21 21-4.34-4.34" /> <circle cx="11" cy="11" r="8" />',
    plus: '<path d="M5 12h14" /> <path d="M12 5v14" />'
  };

  function showToast(title, body) {
    var host = document.getElementById('toastHost');
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<span style="flex:none;color:var(--success-solid);">' + icon(I.check, 18) + '</span>' +
      '<div><div class="toast-title">' + title + '</div><div class="toast-body">' + body + '</div></div>';
    host.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0'; t.style.transition = 'opacity .3s';
      setTimeout(function () { t.remove(); }, 300);
    }, 3600);
  }

  function overlay() { return document.getElementById('modalOverlay'); }
  function closeModal() { var o = overlay(); o.hidden = true; o.innerHTML = ''; }

  window.Comms = {
    ORG: ORG, LOCATION: LOCATION, PEOPLE: PEOPLE, TOKENS: TOKENS,
    TEMPLATES: TEMPLATES, MESSAGES: MESSAGES,
    render: render, unknownTokens: unknownTokens,
    segmentsFor: segmentsFor, segmentRange: segmentRange,
    reachFor: reachFor, reachSummary: reachSummary,
    esc: esc, avatarHTML: avatarHTML, icon: icon, I: I,
    showToast: showToast, overlay: overlay, closeModal: closeModal
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('historyCount').textContent = MESSAGES.length;
    document.getElementById('templateCount').textContent = TEMPLATES.length;

    document.querySelectorAll('.tab[data-comm-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-comm-tab]').forEach(function (t) {
          t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
        var name = tab.getAttribute('data-comm-tab');
        ['history', 'templates'].forEach(function (p) {
          document.getElementById('panel-' + p).hidden = (p !== name);
        });
      });
    });

    var lt = document.querySelector('[data-loc-toggle]'), lm = document.getElementById('locMenu');
    if (lt && lm) {
      lt.addEventListener('click', function (e) { e.stopPropagation(); lm.hidden = !lm.hidden; lt.setAttribute('aria-expanded', String(!lm.hidden)); });
      document.addEventListener('click', function () { lm.hidden = true; lt.setAttribute('aria-expanded', 'false'); });
    }
    var themeBtn = document.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var h = document.documentElement;
      h.setAttribute('data-theme', h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    overlay().addEventListener('click', function (e) { if (e.target === overlay()) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || overlay().hidden) return;
      closeModal();
      // One Escape should dismiss one layer. Without this, the compose modal's
      // own handler runs in the same event, sees the overlay already closed,
      // and closes compose too.
      e.stopImmediatePropagation();
    });
  });
})();
