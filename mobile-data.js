/* ============================================================
   skySchedule mobile - shared data
   Mirrors the desktop prototype so the same person, shift and
   message reads identically on both. One source for every view.
   ============================================================ */
(function (w) {
  'use strict';

  /* The prototype week. Today is Monday Jul 27, matching the desktop
     build, so screenshots from the two line up. */
  var DAYS = [
    { i: 0, num: 26, dow: 'Sunday',    short: 'Sun', label: 'Jul 26', month: 'Jul' },
    { i: 1, num: 27, dow: 'Monday',    short: 'Mon', label: 'Jul 27', month: 'Jul', today: true },
    { i: 2, num: 28, dow: 'Tuesday',   short: 'Tue', label: 'Jul 28', month: 'Jul' },
    { i: 3, num: 29, dow: 'Wednesday', short: 'Wed', label: 'Jul 29', month: 'Jul' },
    { i: 4, num: 30, dow: 'Thursday',  short: 'Thu', label: 'Jul 30', month: 'Jul' },
    { i: 5, num: 31, dow: 'Friday',    short: 'Fri', label: 'Jul 31', month: 'Jul' },
    { i: 6, num: 1,  dow: 'Saturday',  short: 'Sat', label: 'Aug 1',  month: 'Aug' }
  ];
  var TODAY = 1;

  var POSITIONS = [
    'Daily Labour', 'Dishwasher', 'Cook', 'Prep Cook',
    'Bread Basket Coordinator', 'Certified Caregiver',
    'Administrative Assistant', 'Health & Wellness Coordinator'
  ];

  var LOCATIONS = ['Skypoint Main Campus', 'Riverside Annexe', 'Bread Basket Kitchen'];

  /* People. `account` drives the roster filter and the deactivate flow.
     Avatar keys map to --chart-N so a person keeps one colour everywhere. */
  var BFMS = [
    { id: 1, first: 'Anush', last: 'Kulal', email: 'anush.kulal@skypoint.ai', phone: '+1 503 555 0141',
      empId: 'QA-HRIS-141', avatar: 'c5', initials: 'AK', primary: 'Daily Labour',
      secondary: ['Health & Wellness Coordinator'], employment: 'Full-time', account: 'active',
      joined: 'Mar 4, 2025', minHrs: 32, maxHrs: 60, sms: true, push: true },
    { id: 2, first: 'Harsh', last: 'Kumar', email: 'harsh.kumar@skypoint.ai', phone: '+1 503 555 0129',
      empId: 'QA-HRIS-129', avatar: 'c7', initials: 'HK', primary: 'Daily Labour',
      secondary: ['Area Health And Wellness Coordinator'], employment: 'Full-time', account: 'suspended',
      joined: 'Jan 18, 2025', minHrs: 32, maxHrs: 60, sms: true, push: false,
      accountNote: 'Suspended Jul 14, 2026 pending an HR review.' },
    { id: 3, first: 'Jordan', last: 'Lee', email: 'jordan.lee@skypoint.ai', phone: '',
      empId: '', avatar: 'c6', initials: 'JL', primary: 'Prep Cook',
      secondary: [], employment: 'Part-time', account: 'active',
      joined: 'Jun 2, 2026', minHrs: 12, maxHrs: 24, sms: false, push: false },
    { id: 4, first: 'Keerthana', last: 'M', email: 'keerthana.manjunath@skypoint.ai', phone: '+1 503 555 0133',
      empId: 'QA-HRIS-133', avatar: 'c1', initials: 'KM', primary: 'Bread Basket Coordinator',
      secondary: ['Breadbasket Manager'], employment: 'Full-time', account: 'active',
      joined: 'Sep 9, 2024', minHrs: 32, maxHrs: 60, sms: true, push: true },
    { id: 5, first: 'Meera', last: 'Nair', email: 'meera.nair@skypoint.ai', phone: '+1 503 555 0118',
      empId: 'QA-HRIS-118', avatar: 'c8', initials: 'MN', primary: 'Certified Caregiver',
      secondary: [], employment: 'Full-time', account: 'active',
      joined: 'Feb 20, 2025', minHrs: 32, maxHrs: 60, sms: true, push: true,
      alert: 'CNA certification expires Aug 14, 2026' },
    { id: 6, first: 'Priya', last: 'Desai', email: 'priya.desai@skypoint.ai', phone: '+1 503 555 0126',
      empId: 'QA-HRIS-126', avatar: 'c4', initials: 'PD', primary: 'Cook',
      secondary: [], employment: 'Full-time', account: 'active',
      joined: 'Nov 11, 2024', minHrs: 32, maxHrs: 60, sms: true, push: true,
      timeOff: [{ from: 'Aug 3, 2026', to: 'Aug 5, 2026', reason: 'Vacation' }] },
    { id: 7, first: 'Ravi', last: 'Menon', email: 'ravi.menon@skypoint.ai', phone: '+1 503 555 0124',
      empId: 'QA-HRIS-124', avatar: 'c6', initials: 'RM', primary: 'Cook',
      secondary: ['Prep Cook'], employment: 'Part-time', account: 'active',
      joined: 'Apr 7, 2025', minHrs: 16, maxHrs: 28, sms: true, push: true },
    { id: 8, first: 'Sahu', last: 'Sahu', email: 'sahu.himanshu@skypoint.ai', phone: '+1 503 555 0120',
      empId: 'QA-HRIS-120', avatar: 'c3', initials: 'SS', primary: 'Dishwasher',
      secondary: [], employment: 'Part-time', account: 'active',
      joined: 'Jul 15, 2025', minHrs: 16, maxHrs: 28, sms: true, push: true },
    { id: 9, first: 'Saumaya', last: 'Surabhi', email: 'saumaya.surabhi@skypoint.ai', phone: '+1 503 555 0115',
      empId: 'QA-HRIS-115', avatar: 'c7', initials: 'SS', primary: 'Administrative Assistant',
      secondary: [], employment: 'Full-time', account: 'active',
      joined: 'Oct 1, 2024', minHrs: 32, maxHrs: 60, sms: true, push: true },
    { id: 10, first: 'Vidya', last: 'P B', email: 'vidya.pb@skypoint.ai', phone: '+1 503 555 0131',
      empId: 'QA-HRIS-131', avatar: 'c2', initials: 'VP', primary: 'Bread Basket Coordinator',
      secondary: [], employment: 'Agency', account: 'active',
      joined: 'May 19, 2026', minHrs: 20, maxHrs: 36, sms: true, push: false },
    { id: 11, first: 'Daniel', last: 'Okafor', email: 'daniel.okafor@skypoint.ai', phone: '+1 503 555 0098',
      empId: 'QA-HRIS-098', avatar: 'c4', initials: 'DO', primary: 'Dishwasher',
      secondary: [], employment: 'Part-time', account: 'deactivated',
      joined: 'Feb 2, 2024', deactivatedOn: 'Jun 12, 2026', minHrs: 16, maxHrs: 28, sms: true, push: false },
    { id: 12, first: 'Lily', last: 'Chen', email: 'lily.chen@skypoint.ai', phone: '+1 503 555 0101',
      empId: 'QA-HRIS-101', avatar: 'c8', initials: 'LC', primary: 'Prep Cook',
      secondary: [], employment: 'Full-time', account: 'deactivated',
      joined: 'Aug 8, 2023', deactivatedOn: 'May 3, 2026', minHrs: 32, maxHrs: 60, sms: true, push: true }
  ];

  /* Weekly availability. 7 slots, index 0 = Sunday, matching DAYS. */
  function avail(on, from, to) { return { on: on, from: from || '7:00 AM', to: to || '3:00 PM' }; }
  BFMS.forEach(function (b) {
    b.avail = [
      avail(false), avail(true), avail(true), avail(true),
      avail(true), avail(true), avail(false)
    ];
    b.timeOff = b.timeOff || [];
  });

  /* Shifts for the prototype week. `day` indexes DAYS.
     status: confirmed | draft | open | unfulfilled
     A shift with no bfmId is unassigned. */
  var SHIFTS = [
    { id: 1701, bfmId: 7,  day: 0, start: '11:00 AM', end: '7:00 PM',  position: 'Cook', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1702, bfmId: 5,  day: 0, start: '7:00 AM',  end: '3:00 PM',  position: 'Certified Caregiver', status: 'confirmed', location: 'Riverside Annexe' },
    { id: 1703, bfmId: 1,  day: 1, start: '7:00 AM',  end: '3:00 PM',  position: 'Daily Labour', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1704, bfmId: 8,  day: 1, start: '7:00 AM',  end: '3:00 PM',  position: 'Dishwasher', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1705, bfmId: 4,  day: 1, start: '9:00 AM',  end: '5:00 PM',  position: 'Bread Basket Coordinator', status: 'confirmed', location: 'Bread Basket Kitchen' },
    { id: 1706, bfmId: 6,  day: 1, start: '3:00 PM',  end: '11:00 PM', position: 'Cook', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1707, bfmId: null, day: 1, start: '4:00 PM', end: '10:00 PM', position: 'Prep Cook', status: 'open', location: 'Skypoint Main Campus' },
    { id: 1708, bfmId: 5,  day: 2, start: '7:00 AM',  end: '3:00 PM',  position: 'Certified Caregiver', status: 'confirmed', location: 'Riverside Annexe' },
    { id: 1709, bfmId: 4,  day: 2, start: '9:00 AM',  end: '5:00 PM',  position: 'Bread Basket Coordinator', status: 'draft', location: 'Bread Basket Kitchen' },
    { id: 1710, bfmId: null, day: 2, start: '4:00 PM', end: '10:00 PM', position: 'Cook', status: 'open', location: 'Skypoint Main Campus' },
    { id: 1711, bfmId: 9,  day: 2, start: '8:00 AM',  end: '4:00 PM',  position: 'Administrative Assistant', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1712, bfmId: null, day: 3, start: '7:00 AM', end: '3:00 PM',  position: 'Dishwasher', status: 'unfulfilled', location: 'Skypoint Main Campus' },
    { id: 1713, bfmId: 10, day: 3, start: '9:00 AM',  end: '5:00 PM',  position: 'Bread Basket Coordinator', status: 'confirmed', location: 'Bread Basket Kitchen' },
    { id: 1714, bfmId: 7,  day: 3, start: '11:00 AM', end: '7:00 PM',  position: 'Cook', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1715, bfmId: 6,  day: 4, start: '3:00 PM',  end: '11:00 PM', position: 'Cook', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1716, bfmId: 8,  day: 4, start: '7:00 AM',  end: '3:00 PM',  position: 'Dishwasher', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1717, bfmId: null, day: 4, start: '7:00 AM', end: '3:00 PM',  position: 'Dishwasher', status: 'open', location: 'Riverside Annexe' },
    { id: 1718, bfmId: 3,  day: 4, start: '9:00 AM',  end: '2:00 PM',  position: 'Prep Cook', status: 'draft', location: 'Bread Basket Kitchen' },
    { id: 1719, bfmId: 1,  day: 5, start: '7:00 AM',  end: '3:00 PM',  position: 'Daily Labour', status: 'draft', location: 'Skypoint Main Campus' },
    { id: 1720, bfmId: 5,  day: 5, start: '7:00 AM',  end: '3:00 PM',  position: 'Certified Caregiver', status: 'confirmed', location: 'Riverside Annexe' },
    { id: 1721, bfmId: null, day: 5, start: '3:00 PM', end: '11:00 PM', position: 'Cook', status: 'unfulfilled', location: 'Skypoint Main Campus' },
    { id: 1722, bfmId: 9,  day: 6, start: '7:00 AM',  end: '3:00 PM',  position: 'Administrative Assistant', status: 'confirmed', location: 'Skypoint Main Campus' },
    { id: 1723, bfmId: 10, day: 6, start: '9:00 AM',  end: '5:00 PM',  position: 'Bread Basket Coordinator', status: 'confirmed', location: 'Bread Basket Kitchen' }
  ];

  /* Requests waiting on the scheduler. Drives Home's review queue. */
  var REVIEWS = [
    { id: 'r1', type: 'swap', bfmId: 8, with: 11, when: 'Thu, Jul 30', time: '7:00 AM to 3:00 PM',
      position: 'Dishwasher', note: 'Family commitment that morning.', age: '2h ago' },
    { id: 'r2', type: 'timeoff', bfmId: 6, from: 'Aug 3, 2026', to: 'Aug 5, 2026',
      reason: 'Vacation', note: 'Booked before the roster went out.', age: '5h ago', conflicts: 2 },
    { id: 'r3', type: 'claim', bfmId: 7, shiftId: 1710, when: 'Tue, Jul 28', time: '4:00 PM to 10:00 PM',
      position: 'Cook', note: '', age: '1d ago' }
  ];

  /* Message templates, shared with the desktop build. */
  var TEMPLATES = [
    { id: 1, name: 'In-service training', shared: true, usedCount: 12, lastUsed: 'Jul 22',
      sms: 'Hi {firstName}, reminder: in-service training at {location} on {date}. Please plan to attend during your shift.',
      emailSubject: 'In-service training on {date}',
      emailBody: 'Hi {firstName},\n\nThis is a reminder that in-service training is scheduled at {location} on {date}.\n\nPlease plan to attend during your shift. Details: {link}\n\nThanks,\n{org}' },
    { id: 2, name: 'Fire drill notice', shared: true, usedCount: 4, lastUsed: 'Jun 30',
      sms: 'Hi {firstName}, fire drill at {location} on {date}. Follow evacuation procedures during your shift.',
      emailSubject: 'Fire drill at {location} on {date}',
      emailBody: 'Hi {firstName},\n\nA fire drill is scheduled at {location} on {date}.\n\nPlease follow standard evacuation procedures during your shift.\n\nThanks,\n{org}' },
    { id: 3, name: 'Shift confirmation', shared: false, usedCount: 31, lastUsed: 'Jul 26',
      sms: 'Hi {firstName}, you are assigned to {shiftWindow} on {shiftDate} at {location}. Confirm here: {link}',
      emailSubject: 'Your shift on {shiftDate}',
      emailBody: 'Hi {firstName},\n\nYou are assigned to {shiftWindow} on {shiftDate} at {location}.\n\nConfirm your shift: {link}\n\nThanks,\n{org}' },
    { id: 4, name: 'Open shift available', shared: true, usedCount: 8, lastUsed: 'Jul 24',
      sms: 'Hi {firstName}, an open {position} shift is available {shiftWindow} on {shiftDate}. Claim it: {link}',
      emailSubject: 'Open {position} shift on {shiftDate}',
      emailBody: 'Hi {firstName},\n\nAn open {position} shift is available {shiftWindow} on {shiftDate} at {location}.\n\nClaim it here: {link}\n\nThanks,\n{org}' }
  ];

  /* Sent messages hold the RENDERED text plus per-channel outcomes, so the
     log is an audit trail rather than a second copy of the template. */
  var MESSAGES = [
    { id: 1, status: 'sent', sentAt: 'Wed, Jul 22 at 2:20 PM', sender: 'Sahu Sahu', senderAvatar: 'c3', senderInitials: 'SS',
      audience: "The week's schedule, Jul 19 to Jul 25", templateName: 'In-service training', recipients: 5,
      rendered: 'Hi Anush, reminder: in-service training at Skypoint Main Campus on Jul 24. Please plan to attend during your shift.',
      channels: { sms: { sent: 4, delivered: 4, failed: 0 }, email: { sent: 5, delivered: 5, failed: 0 }, push: { sent: 3, delivered: 3, failed: 0 } } },
    { id: 2, status: 'sent', sentAt: 'Mon, Jul 20 at 11:01 AM', sender: 'Harshitha Suresha', senderAvatar: 'c2', senderInitials: 'HS',
      audience: 'Monday shift, Jul 20', templateName: null, recipients: 4,
      rendered: 'Team, the delivery is arriving at 2 PM today. Please keep the loading bay clear.',
      channels: { sms: { sent: 3, delivered: 2, failed: 1 }, email: { sent: 4, delivered: 4, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } } },
    { id: 3, status: 'sent', sentAt: 'Thu, Jul 16 at 7:49 PM', sender: 'Yaswanth Ponnada', senderAvatar: 'c6', senderInitials: 'YP',
      audience: 'Evening shift, Jul 16', templateName: null, recipients: 6,
      rendered: 'Hi team, please assemble near the exit gate at the end of your shift for a short briefing.',
      channels: { sms: { sent: 5, delivered: 5, failed: 0 }, email: { sent: 6, delivered: 6, failed: 0 }, push: { sent: 4, delivered: 4, failed: 0 } } },
    { id: 4, status: 'scheduled', sentAt: 'Tue, Jul 28 at 6:00 AM', sender: 'Sumit Awinash', senderAvatar: 'c5', senderInitials: 'SA',
      audience: 'Tuesday shift, Jul 28', templateName: 'Shift confirmation', recipients: 4,
      rendered: 'Hi Meera, you are assigned to 7:00 AM to 3:00 PM on Jul 28 at Riverside Annexe. Confirm here: sky.pt/c/8813',
      channels: { sms: { sent: 0, delivered: 0, failed: 0 }, email: { sent: 0, delivered: 0, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } } },
    { id: 5, status: 'draft', sentAt: 'Edited Jul 26 at 4:12 PM', sender: 'Sumit Awinash', senderAvatar: 'c5', senderInitials: 'SA',
      audience: 'Not set', templateName: 'Open shift available', recipients: 0,
      rendered: 'Hi {firstName}, an open Cook shift is available 4:00 PM to 10:00 PM on Jul 28. Claim it: {link}',
      channels: { sms: { sent: 0, delivered: 0, failed: 0 }, email: { sent: 0, delivered: 0, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } } }
  ];

  /* Community feed. */
  var POSTS = [
    { id: 1, bfmId: 4, when: '2h ago', pinned: true,
      body: 'The new bread rotation starts Monday. Sourdough moves to the early bake so it is out of the oven before the 9 AM delivery.',
      likes: 12, comments: 3 },
    { id: 2, bfmId: 9, when: '6h ago',
      body: 'Reminder that the staff room fridge gets cleared every Friday at 5. Please label anything you want to keep.',
      likes: 5, comments: 1 },
    { id: 3, bfmId: 7, when: 'Yesterday',
      body: 'Thanks to everyone who covered the extra covers on Saturday. We served 210 without a single ticket going long.',
      likes: 24, comments: 7 },
    { id: 4, bfmId: 5, when: '2d ago',
      body: 'CPR recertification sessions are open for booking. Two slots left on the Aug 12 morning session.',
      likes: 9, comments: 2 }
  ];

  /* ---- Derived helpers ------------------------------------------- */

  function byId(id) {
    for (var i = 0; i < BFMS.length; i++) if (BFMS[i].id === id) return BFMS[i];
    return null;
  }
  function fullName(b) { return b ? b.first + ' ' + b.last : 'Unassigned'; }
  function shiftsOn(day) {
    return SHIFTS.filter(function (s) { return s.day === day; })
      .sort(function (a, b) { return toMin(a.start) - toMin(b.start); });
  }
  function toMin(t) {
    var m = /^(\d+):(\d+)\s*(AM|PM)$/.exec(t);
    if (!m) return 0;
    var h = +m[1] % 12; if (m[3] === 'PM') h += 12;
    return h * 60 + (+m[2]);
  }
  function hoursOf(s) { return Math.max(0, (toMin(s.end) - toMin(s.start))) / 60; }
  function shiftById(id) {
    for (var i = 0; i < SHIFTS.length; i++) if (SHIFTS[i].id === id) return SHIFTS[i];
    return null;
  }

  /* The Home KPIs are computed, never hard coded, so assigning a shift in
     Schedule moves the numbers on Home without a second edit. */
  function stats() {
    var open = 0, unfulfilled = 0, assigned = 0, hours = 0;
    SHIFTS.forEach(function (s) {
      if (s.status === 'open') open++;
      else if (s.status === 'unfulfilled') unfulfilled++;
      else { assigned++; hours += hoursOf(s); }
    });
    var total = SHIFTS.length;
    return {
      open: open,
      unfulfilled: unfulfilled,
      assigned: assigned,
      hours: Math.round(hours),
      total: total,
      fulfillment: total ? Math.round((assigned / total) * 100) : 0
    };
  }

  /* Exceptions are anything the scheduler must act on: a shift nobody took
     or a shift that went unstaffed. Ordered worst first. */
  function exceptions() {
    return SHIFTS.filter(function (s) {
      return s.status === 'unfulfilled' || s.status === 'open';
    }).sort(function (a, b) {
      if (a.status !== b.status) return a.status === 'unfulfilled' ? -1 : 1;
      return a.day - b.day;
    });
  }

  /* Who could take a given shift. Only active people whose primary or
     secondary position matches and who are available that weekday, minus
     anyone already booked at an overlapping time. */
  function candidatesFor(shift) {
    var booked = {};
    SHIFTS.forEach(function (s) {
      if (s.day === shift.day && s.bfmId && s.id !== shift.id) {
        if (toMin(s.start) < toMin(shift.end) && toMin(shift.start) < toMin(s.end)) booked[s.bfmId] = true;
      }
    });
    return BFMS.filter(function (b) {
      if (b.account !== 'active') return false;
      var qualified = b.primary === shift.position || b.secondary.indexOf(shift.position) > -1;
      if (!qualified) return false;
      return true;
    }).map(function (b) {
      var a = b.avail[shift.day];
      return {
        bfm: b,
        available: a.on && !booked[b.id],
        why: booked[b.id] ? 'Already on a shift' : (!a.on ? 'Not available ' + DAYS[shift.day].dow + 's' : '')
      };
    }).sort(function (x, y) { return (y.available ? 1 : 0) - (x.available ? 1 : 0); });
  }

  /* Channel reach for a set of people, same rules as desktop: SMS needs a
     mobile number, push needs the app, email is assumed for everyone. */
  function reachOf(list) {
    var r = { total: list.length, sms: 0, email: 0, push: 0, smsWhy: [], pushWhy: [] };
    var noPhone = 0, optedOut = 0, noApp = 0;
    list.forEach(function (b) {
      r.email++;
      if (b.phone && b.sms) r.sms++; else if (!b.phone) noPhone++; else optedOut++;
      if (b.push) r.push++; else noApp++;
    });
    if (noPhone) r.smsWhy.push(noPhone + ' no mobile number');
    if (optedOut) r.smsWhy.push(optedOut + ' opted out');
    if (noApp) r.pushWhy.push(noApp + ' do not use the app');
    return r;
  }

  /* SMS billing. GSM-7 is 160 for a single part and 153 once concatenated;
     any non-GSM character forces UCS-2 at 70 / 67. */
  var GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
  var GSM_EXT = "^{}\\[~]|€";
  function smsInfo(text) {
    var unicode = false, len = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (GSM_EXT.indexOf(c) > -1) len += 2;
      else if (GSM.indexOf(c) > -1) len += 1;
      else { unicode = true; break; }
    }
    if (unicode) { len = text.length; }
    var single = unicode ? 70 : 160, multi = unicode ? 67 : 153;
    var parts = len <= single ? (len === 0 ? 0 : 1) : Math.ceil(len / multi);
    return { chars: len, parts: parts, encoding: unicode ? 'Unicode' : 'GSM-7', limit: parts <= 1 ? single : multi };
  }

  /* Merge fields resolved against a sample recipient, so the review step
     shows the message a real person receives rather than the raw tokens. */
  function renderTokens(text, bfm, ctx) {
    ctx = ctx || {};
    var map = {
      firstName: bfm ? bfm.first : 'there',
      lastName: bfm ? bfm.last : '',
      fullName: bfm ? fullName(bfm) : '',
      position: ctx.position || (bfm ? bfm.primary : 'Cook'),
      location: ctx.location || 'Skypoint Main Campus',
      date: ctx.date || 'Jul 28',
      shiftDate: ctx.shiftDate || 'Jul 28',
      shiftWindow: ctx.shiftWindow || '7:00 AM to 3:00 PM',
      org: 'Skypoint',
      link: 'sky.pt/c/8813'
    };
    return String(text).replace(/\{(\w+)\}/g, function (all, key) {
      return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : all;
    });
  }
  function unknownTokens(text) {
    var known = ['firstName', 'lastName', 'fullName', 'position', 'location', 'date',
      'shiftDate', 'shiftWindow', 'org', 'link'];
    var out = [], m, re = /\{(\w+)\}/g;
    while ((m = re.exec(String(text)))) if (known.indexOf(m[1]) === -1 && out.indexOf(m[1]) === -1) out.push(m[1]);
    return out;
  }

  w.SS = {
    DAYS: DAYS, TODAY: TODAY, POSITIONS: POSITIONS, LOCATIONS: LOCATIONS,
    BFMS: BFMS, SHIFTS: SHIFTS, REVIEWS: REVIEWS,
    TEMPLATES: TEMPLATES, MESSAGES: MESSAGES, POSTS: POSTS,
    byId: byId, fullName: fullName, shiftsOn: shiftsOn, shiftById: shiftById,
    toMin: toMin, hoursOf: hoursOf, stats: stats, exceptions: exceptions,
    candidatesFor: candidatesFor, reachOf: reachOf, smsInfo: smsInfo,
    renderTokens: renderTokens, unknownTokens: unknownTokens
  };
})(window);
