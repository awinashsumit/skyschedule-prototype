/* skySchedule - BFMs
   People, positions, availability, and profile history.
   Staff names/avatar colors match schedule.html so a person reads the same
   everywhere in the app. */
(function () {
  'use strict';

  // ---- Positions, grouped the same way in every picker on this page ----
  var POSITION_GROUPS = [
    { group: 'Care', positions: ['Certified Caregiver', 'Health & Wellness Coordinator', 'Area Health And Wellness Coordinator'] },
    { group: 'Dining', positions: ['Dishwasher', 'Server'] },
    { group: 'Dietary', positions: ['Cook', 'Prep Cook', 'Bread Basket Coordinator', 'Breadbasket Manager'] },
    { group: 'General', positions: ['Daily Labour', 'Administrative Assistant'] }
  ];
  var ALL_POSITIONS = POSITION_GROUPS.reduce(function (acc, g) { return acc.concat(g.positions); }, []);

  var DEFAULT_AVAIL = [
    { day: 'Sunday', on: false, from: '09:00 AM', to: '05:00 PM' },
    { day: 'Monday', on: true, from: '07:00 AM', to: '03:00 PM' },
    { day: 'Tuesday', on: true, from: '07:00 AM', to: '03:00 PM' },
    { day: 'Wednesday', on: true, from: '07:00 AM', to: '03:00 PM' },
    { day: 'Thursday', on: true, from: '07:00 AM', to: '03:00 PM' },
    { day: 'Friday', on: true, from: '07:00 AM', to: '03:00 PM' },
    { day: 'Saturday', on: false, from: '09:00 AM', to: '05:00 PM' }
  ];

  function cloneAvail() { return DEFAULT_AVAIL.map(function (d) { return Object.assign({}, d); }); }

  // ---- Roster ----
  var BFMS = [
    { id: 1, first: 'Anush', last: 'Kulal', email: 'anush.kulal@skypoint.ai', phone: '+1 503 555 0141', empId: 'QA-HRIS-141', avatar: 'c5', initials: 'AK',
      primary: 'Daily Labour', secondary: ['Health & Wellness Coordinator'], employment: 'Full-time', account: 'active', joined: 'Mar 4, 2025',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [] },
    { id: 2, first: 'Harsh', last: 'Kumar', email: 'harsh.kumar@skypoint.ai', phone: '+1 503 555 0129', empId: 'QA-HRIS-129', avatar: 'c7', initials: 'HK',
      primary: 'Daily Labour', secondary: ['Area Health And Wellness Coordinator'], employment: 'Full-time', account: 'suspended', joined: 'Jan 18, 2025',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [], accountNote: 'Suspended Jul 14, 2026 pending an HR review.' },
    { id: 3, first: 'Jordan', last: 'Lee', email: 'jordan.lee@skypoint.ai', phone: '+1 503 555 0166', empId: '', avatar: 'c6', initials: 'JL',
      primary: 'Prep Cook', secondary: [], employment: 'Part-time', account: 'active', joined: 'Jun 2, 2026',
      minHrs: 12, maxHrs: 24, avail: cloneAvail(), timeOff: [] },
    { id: 4, first: 'Keerthana', last: 'M', email: 'keerthana.manjunath@skypoint.ai', phone: '+1 503 555 0133', empId: 'QA-HRIS-133', avatar: 'c1', initials: 'KM',
      primary: 'Bread Basket Coordinator', secondary: ['Breadbasket Manager'], employment: 'Full-time', account: 'active', joined: 'Sep 9, 2024',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [] },
    { id: 5, first: 'Meera', last: 'Nair', email: 'meera.nair@skypoint.ai', phone: '+1 503 555 0118', empId: 'QA-HRIS-118', avatar: 'c8', initials: 'MN',
      primary: 'Certified Caregiver', secondary: [], employment: 'Full-time', account: 'active', joined: 'Feb 20, 2025',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [],
      alert: 'CNA certification expires Aug 14, 2026' },
    { id: 6, first: 'Priya', last: 'Desai', email: 'priya.desai@skypoint.ai', phone: '+1 503 555 0126', empId: 'QA-HRIS-126', avatar: 'c4', initials: 'PD',
      primary: 'Cook', secondary: [], employment: 'Full-time', account: 'active', joined: 'Nov 11, 2024',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [{ from: 'Aug 3, 2026', to: 'Aug 5, 2026', reason: 'Vacation' }] },
    { id: 7, first: 'Ravi', last: 'Menon', email: 'ravi.menon@skypoint.ai', phone: '+1 503 555 0124', empId: 'QA-HRIS-124', avatar: 'c6', initials: 'RM',
      primary: 'Cook', secondary: ['Prep Cook'], employment: 'Part-time', account: 'active', joined: 'Apr 7, 2025',
      minHrs: 16, maxHrs: 28, avail: cloneAvail(), timeOff: [] },
    { id: 8, first: 'Sahu', last: 'Sahu', email: 'sahu.himanshu@skypoint.ai', phone: '+1 503 555 0120', empId: 'QA-HRIS-120', avatar: 'c3', initials: 'SS',
      primary: 'Dishwasher', secondary: [], employment: 'Part-time', account: 'active', joined: 'Jul 15, 2025',
      minHrs: 16, maxHrs: 28, avail: cloneAvail(), timeOff: [] },
    { id: 9, first: 'Saumaya', last: 'Surabhi', email: 'saumaya.surabhi@skypoint.ai', phone: '+1 503 555 0115', empId: 'QA-HRIS-115', avatar: 'c7', initials: 'SS',
      primary: 'Administrative Assistant', secondary: [], employment: 'Full-time', account: 'active', joined: 'Oct 1, 2024',
      minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [] },
    { id: 10, first: 'Vidya', last: 'P B', email: 'vidya.pb@skypoint.ai', phone: '+1 503 555 0131', empId: 'QA-HRIS-131', avatar: 'c2', initials: 'VP',
      primary: 'Bread Basket Coordinator', secondary: [], employment: 'Agency', account: 'active', joined: 'May 19, 2026',
      minHrs: 20, maxHrs: 36, avail: cloneAvail(), timeOff: [] },
    { id: 11, first: 'Daniel', last: 'Okafor', email: 'daniel.okafor@skypoint.ai', phone: '+1 503 555 0098', empId: 'QA-HRIS-098', avatar: 'c4', initials: 'DO',
      primary: 'Dishwasher', secondary: [], employment: 'Part-time', account: 'deactivated', joined: 'Feb 2, 2024',
      deactivatedOn: 'Jun 12, 2026', minHrs: 16, maxHrs: 28, avail: cloneAvail(), timeOff: [] },
    { id: 12, first: 'Lily', last: 'Chen', email: 'lily.chen@skypoint.ai', phone: '+1 503 555 0101', empId: 'QA-HRIS-101', avatar: 'c8', initials: 'LC',
      primary: 'Prep Cook', secondary: [], employment: 'Full-time', account: 'deactivated', joined: 'Aug 8, 2023',
      deactivatedOn: 'May 3, 2026', minHrs: 32, maxHrs: 60, avail: cloneAvail(), timeOff: [] }
  ];

  // Upcoming assignments, used to warn before deactivating someone who is
  // already on the schedule. Mirrors the shifts in schedule.html.
  var UPCOMING = [
    { bfmId: 1, when: 'Mon, Jul 27', time: '7:00 AM to 3:00 PM', position: 'Daily Labour' },
    { bfmId: 1, when: 'Fri, Jul 31', time: '7:00 AM to 3:00 PM', position: 'Daily Labour' },
    { bfmId: 8, when: 'Mon, Jul 27', time: '7:00 AM to 3:00 PM', position: 'Dishwasher' },
    { bfmId: 9, when: 'Sat, Aug 1', time: '7:00 AM to 3:00 PM', position: 'Administrative Assistant' },
    { bfmId: 4, when: 'Tue, Jul 28', time: '9:00 AM to 5:00 PM', position: 'Bread Basket Coordinator' },
    { bfmId: 6, when: 'Thu, Jul 30', time: '3:00 PM to 11:00 PM', position: 'Cook' },
    { bfmId: 7, when: 'Sun, Jul 26', time: '11:00 AM to 7:00 PM', position: 'Cook' },
    { bfmId: 5, when: 'Tue, Jul 28', time: '7:00 AM to 3:00 PM', position: 'Certified Caregiver' }
  ];

  // A realistic month is 10 to 14 shifts per person, so history is generated
  // deterministically (no randomness) rather than hand-listed.
  var JULY_2026_DOW = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue']; // Jul 1, 2026 is a Wednesday
  function dayLabel(dateNum) { return JULY_2026_DOW[(dateNum - 1) % 7] + ', Jul ' + dateNum; }

  var HISTORY = (function () {
    var out = [];
    // shiftsPerMonth reflects employment type: full time works more days.
    var plan = [
      { bfmId: 1, count: 13, time: '7:00 AM to 3:00 PM', position: 'Daily Labour' },
      { bfmId: 2, count: 9, time: '7:00 AM to 3:00 PM', position: 'Daily Labour' },
      { bfmId: 3, count: 6, time: '9:00 AM to 2:00 PM', position: 'Prep Cook' },
      { bfmId: 4, count: 12, time: '9:00 AM to 5:00 PM', position: 'Bread Basket Coordinator' },
      { bfmId: 5, count: 14, time: '7:00 AM to 3:00 PM', position: 'Certified Caregiver' },
      { bfmId: 6, count: 12, time: '3:00 PM to 11:00 PM', position: 'Cook' },
      { bfmId: 7, count: 7, time: '11:00 AM to 7:00 PM', position: 'Cook' },
      { bfmId: 8, count: 8, time: '7:00 AM to 3:00 PM', position: 'Dishwasher' },
      { bfmId: 9, count: 11, time: '7:00 AM to 6:00 PM', position: 'Administrative Assistant' },
      { bfmId: 10, count: 6, time: '9:00 AM to 3:00 PM', position: 'Bread Basket Coordinator' }
    ];
    var ratingCycle = [5, 4, 5, 5, 3, 4, 5, null, 4, 5, 4, 5, 3, 5];
    plan.forEach(function (p) {
      var date = 25; // most recent completed shift, walking backwards
      for (var i = 0; i < p.count; i++) {
        out.push({
          bfmId: p.bfmId,
          when: dayLabel(date),
          time: p.time,
          position: p.position,
          rating: ratingCycle[(p.bfmId + i) % ratingCycle.length]
        });
        date -= (i % 3 === 1) ? 3 : 2; // uneven spacing, skips rest days
        if (date < 1) break;
      }
    });
    return out;
  })();

  // ---- Shared helpers ----
  var state = { tab: 'active', search: '', position: '', employment: '', sort: 'name', dir: 1, selected: [] };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function fullName(b) { return b.first + ' ' + b.last; }
  function avatarHTML(b, size) {
    var s = size || 32;
    return '<span class="avatar ' + b.avatar + '" style="width:' + s + 'px;height:' + s + 'px;font-size:' + (s <= 28 ? 11 : 13) + 'px;flex:none;">' + b.initials + '</span>';
  }
  function accountBadge(b) {
    if (b.account === 'suspended') return '<span class="badge is-warning">Suspended</span>';
    if (b.account === 'deactivated') return '<span class="badge is-neutral">Deactivated</span>';
    return '<span class="badge is-success">Active</span>';
  }
  function icon(paths, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 16) + '" height="' + (size || 16) + '" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }
  var I = {
    dots: '<circle cx="12" cy="12" r="1" /> <circle cx="12" cy="5" r="1" /> <circle cx="12" cy="19" r="1" />',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /> <path d="M12 9v4" /> <path d="M12 17h.01" />',
    check: '<circle cx="12" cy="12" r="10" /> <path d="m9 12 2 2 4-4" />',
    x: '<path d="M18 6 6 18" /> <path d="m6 6 12 12" />',
    star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />',
    mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /> <rect x="2" y="4" width="20" height="16" rx="2" />',
    phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />',
    plus: '<path d="M5 12h14" /> <path d="M12 5v14" />',
    trash: '<path d="M10 11v6" /> <path d="M14 11v6" /> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /> <path d="M3 6h18" /> <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2" /> <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /> <path d="M21 3v5h-5" /> <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /> <path d="M8 16H3v5" />'
  };

  function showToast(title, body, actionLabel, onAction) {
    var host = document.getElementById('toastHost');
    var t = document.createElement('div');
    t.className = 'toast';
    var actionHTML = actionLabel ? '<button class="btn btn-soft is-sm" data-toast-action style="margin-top:var(--space-2);">' + esc(actionLabel) + '</button>' : '';
    t.innerHTML = '<span style="flex:none;color:var(--success-solid);">' + icon(I.check, 18) + '</span>' +
      '<div><div class="toast-title">' + title + '</div><div class="toast-body">' + body + '</div>' + actionHTML + '</div>';
    host.appendChild(t);
    var timer = setTimeout(dismiss, actionLabel ? 6000 : 3200);
    function dismiss() {
      clearTimeout(timer);
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(function () { t.remove(); }, 300);
    }
    if (actionLabel) {
      t.querySelector('[data-toast-action]').addEventListener('click', function () { onAction(); dismiss(); });
    }
  }

  // ---- Table ----
  function visibleRows() {
    var q = state.search.trim().toLowerCase();
    var rows = BFMS.filter(function (b) {
      var inTab = state.tab === 'active' ? b.account !== 'deactivated' : b.account === 'deactivated';
      if (!inTab) return false;
      if (state.position && b.primary !== state.position && b.secondary.indexOf(state.position) === -1) return false;
      if (state.employment && b.employment !== state.employment) return false;
      if (q) {
        var hay = (fullName(b) + ' ' + b.email + ' ' + b.empId).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      var av, bv;
      if (state.sort === 'position') { av = a.primary; bv = b.primary; }
      else if (state.sort === 'employment') { av = a.employment; bv = b.employment; }
      else { av = fullName(a); bv = fullName(b); }
      return av.localeCompare(bv) * state.dir;
    });
    return rows;
  }

  function renderTable() {
    var rows = visibleRows();
    var tbody = document.getElementById('bfmTbody');
    tbody.innerHTML = rows.map(function (b) {
      var alertHTML = b.alert
        ? '<span class="badge is-warning" title="' + esc(b.alert) + '">' + icon(I.warn, 12) + ' Cert expiring</span>'
        : '';
      var posHTML = '<div class="pos-wrap"><span class="pos-primary">' + esc(b.primary) + '</span>' +
        b.secondary.map(function (p) { return '<span class="pos-secondary">' + esc(p) + '</span>'; }).join('') + '</div>';
      var checked = state.selected.indexOf(b.id) > -1;
      return '<tr class="bfm-row' + (checked ? ' is-selected' : '') + '" data-id="' + b.id + '" tabindex="0">' +
        '<td class="col-check"><label class="checkbox"><input type="checkbox" data-select="' + b.id + '"' + (checked ? ' checked' : '') + ' aria-label="Select ' + esc(fullName(b)) + '"></label></td>' +
        '<td><div class="name-cell">' + avatarHTML(b) +
          '<span class="name-main"><span class="name-line"><span class="name-text">' + esc(fullName(b)) + '</span>' + alertHTML + '</span>' +
          '<span class="name-sub">' + esc(b.email) + (b.empId ? ' &middot; ' + esc(b.empId) : '') + '</span></span></div></td>' +
        '<td>' + posHTML + '</td>' +
        '<td><span class="badge is-neutral">' + esc(b.employment) + '</span></td>' +
        '<td>' + accountBadge(b) + '</td>' +
        '<td style="text-align:right;"><span class="row-actions"><button class="btn btn-ghost is-sm is-icon" data-menu="' + b.id + '" aria-label="Actions for ' + esc(fullName(b)) + '" aria-expanded="false">' + icon(I.dots) + '</button></span></td>' +
        '</tr>';
    }).join('');

    document.getElementById('bfmEmpty').hidden = rows.length > 0;
    document.querySelector('.table-wrap').hidden = rows.length === 0;
    var total = BFMS.filter(function (b) { return state.tab === 'active' ? b.account !== 'deactivated' : b.account === 'deactivated'; }).length;
    document.getElementById('bfmPageInfo').textContent = 'Showing ' + rows.length + ' of ' + total;
    document.getElementById('countActive').textContent = BFMS.filter(function (b) { return b.account !== 'deactivated'; }).length;
    document.getElementById('countDeactivated').textContent = BFMS.filter(function (b) { return b.account === 'deactivated'; }).length;
    renderBulkBar();
  }

  function renderBulkBar() {
    var bar = document.getElementById('bulkBar');
    bar.hidden = state.selected.length === 0;
    document.getElementById('bulkCount').textContent = state.selected.length;
    var boxes = document.querySelectorAll('#bfmTbody [data-select]');
    var all = boxes.length > 0 && Array.prototype.every.call(boxes, function (cb) { return cb.checked; });
    document.getElementById('selectAll').checked = all;
  }

  function byId(id) { return BFMS.filter(function (b) { return b.id === Number(id); })[0]; }

  // Expose the pieces the other modules on this page need.
  window.BFMApp = {
    BFMS: BFMS, UPCOMING: UPCOMING, HISTORY: HISTORY,
    POSITION_GROUPS: POSITION_GROUPS, ALL_POSITIONS: ALL_POSITIONS,
    state: state, esc: esc, fullName: fullName, avatarHTML: avatarHTML,
    accountBadge: accountBadge, icon: icon, I: I, showToast: showToast,
    renderTable: renderTable, byId: byId, cloneAvail: cloneAvail
  };

  // ---- Wiring ----
  document.addEventListener('DOMContentLoaded', function () {
    // Position filter options
    var pf = document.getElementById('positionFilter');
    ALL_POSITIONS.forEach(function (p) {
      var o = document.createElement('option');
      o.textContent = p;
      pf.appendChild(o);
    });

    document.querySelectorAll('.tab[data-roster-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab[data-roster-tab]').forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
        state.tab = tab.getAttribute('data-roster-tab');
        state.selected = [];
        renderTable();
      });
    });

    document.getElementById('bfmSearch').addEventListener('input', function (e) { state.search = e.target.value; renderTable(); });
    pf.addEventListener('change', function (e) { state.position = e.target.value; renderTable(); });
    document.getElementById('statusFilter').addEventListener('change', function (e) { state.employment = e.target.value; renderTable(); });
    document.getElementById('clearFiltersBtn').addEventListener('click', function () {
      state.search = ''; state.position = ''; state.employment = '';
      document.getElementById('bfmSearch').value = '';
      pf.value = ''; document.getElementById('statusFilter').value = '';
      renderTable();
    });

    document.querySelectorAll('th[data-sort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var key = th.getAttribute('data-sort');
        if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = 1; }
        renderTable();
      });
    });

    document.getElementById('selectAll').addEventListener('change', function (e) {
      state.selected = e.target.checked ? visibleRows().map(function (b) { return b.id; }) : [];
      renderTable();
    });
    document.getElementById('bulkClearBtn').addEventListener('click', function () { state.selected = []; renderTable(); });

    // Row interactions: checkbox toggles selection, overflow opens the menu,
    // anything else opens the profile drawer.
    document.getElementById('bfmTbody').addEventListener('click', function (e) {
      var cb = e.target.closest('[data-select]');
      if (cb) {
        var id = Number(cb.getAttribute('data-select'));
        var i = state.selected.indexOf(id);
        if (i > -1) state.selected.splice(i, 1); else state.selected.push(id);
        renderTable();
        return;
      }
      if (e.target.closest('label.checkbox')) return;
      var menuBtn = e.target.closest('[data-menu]');
      if (menuBtn) { e.stopPropagation(); window.BFMActions.openRowMenu(menuBtn); return; }
      var row = e.target.closest('.bfm-row');
      if (row) window.BFMProfile.open(Number(row.getAttribute('data-id')));
    });
    document.getElementById('bfmTbody').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var row = e.target.closest('.bfm-row');
      if (row) { e.preventDefault(); window.BFMProfile.open(Number(row.getAttribute('data-id'))); }
    });

    // Header location switcher
    var lt = document.querySelector('[data-loc-toggle]'), lm = document.getElementById('locMenu');
    if (lt && lm) {
      lt.addEventListener('click', function (e) { e.stopPropagation(); lm.hidden = !lm.hidden; lt.setAttribute('aria-expanded', String(!lm.hidden)); });
      document.addEventListener('click', function () { lm.hidden = true; lt.setAttribute('aria-expanded', 'false'); });
    }
    var ls = document.getElementById('locSearch'), ll = document.getElementById('locList');
    if (ls && ll) {
      ls.addEventListener('input', function () {
        var q = ls.value.trim().toLowerCase();
        ll.querySelectorAll('.list-item').forEach(function (it) { it.hidden = q !== '' && it.textContent.toLowerCase().indexOf(q) === -1; });
      });
    }
    var themeBtn = document.querySelector('[data-theme-toggle]');
    if (themeBtn) themeBtn.addEventListener('click', function () {
      var h = document.documentElement;
      h.setAttribute('data-theme', h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    renderTable();
  });
})();
