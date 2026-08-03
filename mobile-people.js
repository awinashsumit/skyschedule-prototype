/* ============================================================
   skySchedule mobile - BFMs
   The desktop roster is a table with a slide-over profile. On the
   phone the table becomes a grouped list and the slide-over
   becomes a full-screen record, but the rules are unchanged:
   deactivating names the shifts it affects, and restoring is
   undoable.
   ============================================================ */
(function (w, d) {
  'use strict';
  var S = w.SS, A = w.APP;
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var acct = 'active';
  var sort = 'name';
  var q = '';

  var ACCOUNT_BADGE = { active: ['is-success', 'Active'], suspended: ['is-warning', 'Suspended'], deactivated: ['is-neutral', 'Deactivated'] };

  function matches(b) {
    if (acct !== 'all' && b.account !== acct) return false;
    if (!q) return true;
    var hay = (S.fullName(b) + ' ' + b.primary + ' ' + b.secondary.join(' ') + ' ' + b.empId + ' ' + b.email).toLowerCase();
    return hay.indexOf(q.toLowerCase()) > -1;
  }

  function shiftsFor(id) { return S.SHIFTS.filter(function (s) { return s.bfmId === id; }); }
  function hoursFor(id) {
    return shiftsFor(id).reduce(function (t, s) { return t + S.hoursOf(s); }, 0);
  }

  A.register('bfms', function () {
    $$('#bfmChips .m-chip').forEach(function (c) {
      c.classList.toggle('is-selected', c.getAttribute('data-acct') === acct);
    });

    var list = S.BFMS.filter(matches);
    if (sort === 'name') list.sort(function (a, b) { return S.fullName(a).localeCompare(S.fullName(b)); });
    else if (sort === 'position') list.sort(function (a, b) { return a.primary.localeCompare(b.primary) || S.fullName(a).localeCompare(S.fullName(b)); });
    else if (sort === 'hours') list.sort(function (a, b) { return hoursFor(b.id) - hoursFor(a.id); });

    var body = $('#bfmBody');
    if (!list.length) {
      body.innerHTML = '<div class="m-empty"><span class="m-empty-art">' + icon('users', 28) + '</span>' +
        '<h2>No one matches</h2><p>' + (q ? 'Nothing matches "' + esc(q) + '" in this list.' : 'There is nobody with this account status.') + '</p></div>';
      return;
    }

    /* Group headers change with the sort, so the label always explains why
       the rows underneath it belong together. */
    /* Grouped into .m-group blocks so each sticky header unsticks when its
       own group ends, rather than every header piling up at the top. */
    /* Alphabetical letter headers only earn their space once the list is
       long enough to scan by letter. At ten people they add a header per
       person and make the roster look longer than it is. */
    var LETTERS_FROM = 15;
    var h = [], flat = [], lastKey = null;
    list.forEach(function (b) {
      var key = sort === 'position' ? b.primary
        : sort === 'hours' ? (hoursFor(b.id) > 0 ? 'Scheduled this week' : 'Not scheduled')
        : (list.length >= LETTERS_FROM ? S.fullName(b).charAt(0).toUpperCase() : null);
      if (key === null) { flat.push(row(b)); return; }
      if (key !== lastKey) {
        if (lastKey !== null) h.push('</div></div></div>');
        h.push('<div class="m-group"><div class="m-list-header m-sticky">' + esc(key) + '</div>' +
          '<div class="m-stack"><div class="m-card is-rows">');
        lastKey = key;
      }
      h.push(row(b));
    });
    if (lastKey !== null) h.push('</div></div></div>');
    if (flat.length) h.unshift('<div class="m-stack" style="padding-top:var(--space-2);"><div class="m-card is-rows">' + flat.join('') + '</div></div>');
    h.push('<div class="m-note is-center">' +
      list.length + (list.length === 1 ? ' person' : ' people') + '</div>');

    body.innerHTML = h.join('');
    $$('[data-bfm]', body).forEach(function (el) {
      el.addEventListener('click', function () { openProfile(+el.getAttribute('data-bfm')); });
    });
  });

  function row(b) {
    var n = shiftsFor(b.id).length;
    var ab = ACCOUNT_BADGE[b.account];
    /* Two facts on the sub line, not three. The shift count moves to the
       trailing edge where it is a number to compare down the column rather
       than the tail of a sentence that pushes the row to two lines. */
    var sub = sort === 'hours' ? hoursFor(b.id) + 'h this week' : b.primary + ' · ' + b.employment;
    return '<button class="m-list-item state-layer m-row-btn" data-bfm="' + b.id + '" >' +
      '<span class="m-li-lead">' + A.avatar(b) + '</span>' +
      '<span class="m-li-text"><span class="m-li-title">' + esc(S.fullName(b)) + '</span>' +
      '<span class="m-li-sub">' + esc(sub) + '</span></span>' +
      '<span class="m-li-trail">' +
      (b.account !== 'active' ? '<span class="m-badge ' + ab[0] + '">' + ab[1] + '</span>' : '') +
      (b.alert ? icon('warn', 18, 'warning') : '') +
      (n && sort !== 'hours' ? '<span class="u-nowrap">' + n + '</span>' : '') +
      icon('chevron', 20) + '</span></button>';
  }

  /* ---- Profile ---------------------------------------------------------
     Upcoming is capped at 3 and history at 5, matching the desktop rule,
     with expand-in-place rather than a second screen. On a phone an
     uncapped list would bury the actions under 40 rows. */
  var UPCOMING_CAP = 3, HISTORY_CAP = 5;

  function openProfile(id) {
    var b = S.byId(id);
    if (!b) return;
    var upcoming = shiftsFor(id).filter(function (s) { return s.day >= S.TODAY; })
      .sort(function (x, y) { return x.day - y.day || S.toMin(x.start) - S.toMin(y.start); });
    var past = history(b);
    var expanded = { up: false, hist: false };

    function bodyHtml() {
      var h = [];
      h.push('<div class="m-profile">' + A.avatar(b) +
        '<div class="m-profile-name">' + esc(S.fullName(b)) + '</div>' +
        '<div class="m-profile-role">' + esc(b.primary + ' · ' + b.employment) + '</div>' +
        '<div class="m-profile-actions">' +
          '<button class="m-btn m-btn-tonal state-layer" data-do="message">' + icon('message', 18) + ' Message</button>' +
          (b.phone ? '<button class="m-btn m-btn-outlined state-layer" data-do="call">' + icon('phone', 18) + ' Call</button>' : '') +
        '</div></div>');

      if (b.account === 'suspended' && b.accountNote)
        h.push('<div class="m-alert is-warning">' + icon('warn', 18) + '<span>' + esc(b.accountNote) + '</span></div>');
      if (b.account === 'deactivated')
        h.push('<div class="m-alert is-info">' + icon('circle', 18) + '<span>Deactivated ' + esc(b.deactivatedOn) + '. They cannot be scheduled until restored.</span></div>');
      if (b.alert)
        h.push('<div class="m-alert is-warning">' + icon('warn', 18) + '<span>' + esc(b.alert) + '</span></div>');

      /* Three numbers that answer the questions a scheduler actually has
         before assigning: are they under their hours, are they reliable. */
      h.push('<div class="m-kpis" style="margin-bottom:var(--space-2);">' +
        tile(hoursFor(b.id) + 'h', 'This week') +
        tile(b.minHrs + '–' + b.maxHrs + 'h', 'Contracted') +
        tile(past.length, 'Shifts in July') +
        tile('98%', 'Attendance') + '</div>');

      h.push('<div class="m-sec-head"><h2>Upcoming</h2><span class="m-sec-sub">' + upcoming.length + '</span></div>');
      if (!upcoming.length) h.push(note('Nothing scheduled for the rest of this week.'));
      else {
        var showUp = expanded.up ? upcoming : upcoming.slice(0, UPCOMING_CAP);
        h.push('<div class="m-stack"><div class="m-card is-rows">' + showUp.map(function (s) {
          var day = S.DAYS[s.day];
          return '<div class="m-shift is-' + s.status + ' state-layer" data-shift="' + s.id + '">' +
            '<span class="m-shift-rail"></span><span class="m-shift-body">' +
            '<span class="m-shift-time">' + esc(day.short + ', ' + day.label) + '</span>' +
            '<span class="m-shift-meta">' + esc(s.start + ' to ' + s.end + ' · ' + s.position) + '</span></span>' +
            '<span class="m-shift-trail">' + A.badge(s.status) + '</span></div>';
        }).join('') + '</div></div>');
        if (upcoming.length > UPCOMING_CAP)
          h.push(more('up', expanded.up ? 'Show less' : 'Show all ' + upcoming.length));
      }

      h.push('<div class="m-sec-head"><h2>Shift history</h2><span class="m-sec-sub">July</span></div>');
      var showH = expanded.hist ? past : past.slice(0, HISTORY_CAP);
      h.push('<div class="m-stack"><div class="m-card is-rows">' + showH.map(function (p) {
        return '<div class="m-shift is-confirmed"><span class="m-shift-rail"></span>' +
          '<span class="m-shift-body"><span class="m-shift-time">' + esc(p.when) + '</span>' +
          '<span class="m-shift-meta">' + esc(p.time + ' · ' + p.position) + '</span></span>' +
          '<span class="m-shift-trail"><span style="font-size:var(--m-fs-meta);color:var(--fg-subtle);">' + p.hours + 'h</span></span></div>';
      }).join('') + '</div></div>');
      if (past.length > HISTORY_CAP) h.push(more('hist', expanded.hist ? 'Show less' : 'Show all ' + past.length));

      h.push('<div class="m-sec-head"><h2>Availability</h2>' +
        '<button class="m-sec-link" data-do="avail">Edit</button></div>');
      h.push('<div class="m-stack">' + A.card(b.avail.map(function (a, i) {
        return '<div class="m-kv"><span class="m-kv-k">' + S.DAYS[i].dow + '</span>' +
          '<span class="m-kv-v' + (a.on ? '' : ' is-empty') + '">' + (a.on ? esc(a.from + ' to ' + a.to) : 'Unavailable') + '</span></div>';
      }).join('')) + '</div>');

      if (b.timeOff.length) {
        h.push('<div class="m-sec-head"><h2>Time off</h2></div>');
        h.push('<div class="m-stack">' + A.card(b.timeOff.map(function (t) {
          return A.kv(t.from + ' to ' + t.to, t.reason);
        }).join('')) + '</div>');
      }

      h.push('<div class="m-sec-head"><h2>Details</h2></div>');
      h.push('<div class="m-stack">' + A.card(A.kv('Email', b.email) + A.kv('Mobile', b.phone) + A.kv('Employee ID', b.empId) +
        A.kv('Primary position', b.primary) +
        A.kv('Also works as', b.secondary.length ? b.secondary.join(', ') : '') +
        A.kv('Employment', b.employment) + A.kv('Joined', b.joined)) + '</div>');

      h.push('<div class="m-sec-head"><h2>Notifications</h2></div>');
      h.push('<div class="m-stack">' + A.card(A.kv('SMS', b.phone ? (b.sms ? 'On · ' + b.phone : 'Opted out') : 'No mobile number on file') +
        A.kv('Email', 'On · ' + b.email) +
        A.kv('Push', b.push ? 'On' : 'Not using the app')) + '</div>');

      h.push('<div class="m-footer-action">' +
        (b.account === 'deactivated'
          ? '<button class="m-btn m-btn-filled state-layer u-full" data-do="restore" >Restore ' + esc(b.first) + '</button>'
          : '<button class="m-btn m-btn-danger state-layer u-full" data-do="deactivate" >Deactivate ' + esc(b.first) + '</button>') +
        '</div>');
      return h.join('');
    }

    function tile(v, l) {
      return '<div class="m-kpi"><span class="m-kpi-val u-title">' + esc(v) + '</span>' +
        '<span class="m-kpi-label">' + esc(l) + '</span></div>';
    }
    function note(t) { return '<div class="u-body-low u-inset">' + esc(t) + '</div>'; }
    function more(key, label) {
      return '<div style="padding:var(--space-2) var(--m-inset);"><button class="m-btn m-btn-text state-layer u-full" data-more="' + key + '" >' + esc(label) + '</button></div>';
    }

    A.fullscreen({
      title: S.fullName(b), back: true, onBack: function () {}, flush: true,
      trail: '<button class="m-icon-btn state-layer" data-do="edit" aria-label="Edit">' + icon('edit', 22) + '</button>',
      body: bodyHtml(),
      wire: function bind(node) {
        function refresh() { $('#fsBody', node).innerHTML = bodyHtml(); attach(); }
        function attach() {
          $$('[data-more]', node).forEach(function (bn) {
            bn.addEventListener('click', function () {
              var k = bn.getAttribute('data-more');
              expanded[k === 'up' ? 'up' : 'hist'] = !expanded[k === 'up' ? 'up' : 'hist'];
              refresh();
            });
          });
          $$('[data-shift]', node).forEach(function (el) {
            el.addEventListener('click', function () { A.openShift(+el.getAttribute('data-shift')); });
          });
          $$('[data-do]', node).forEach(function (bn) {
            bn.addEventListener('click', function () { act(bn.getAttribute('data-do'), b, refresh); });
          });
        }
        attach();
      }
    });
  }

  /* July history, generated deterministically from employment type so the
     record looks like a real month without a hand-written list per person. */
  function history(b) {
    var DOWJ = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];  // Jul 1 2026 is a Wednesday
    var count = b.employment === 'Full-time' ? 13 : b.employment === 'Agency' ? 9 : 7;
    var out = [];
    for (var i = 0, dnum = 25; out.length < count && dnum > 0; dnum--) {
      var dow = DOWJ[(dnum - 1) % 7];
      if (dow === 'Sun' || dow === 'Sat') continue;
      out.push({ when: dow + ', Jul ' + dnum, time: '7:00 AM to 3:00 PM', position: b.primary, hours: 8 });
      i++;
    }
    return out;
  }

  function act(kind, b, refresh) {
    if (kind === 'message') { A.popAll(); A.composeFor && A.composeFor({ scope: 'person', bfm: b }); return; }
    if (kind === 'call') { A.snack('Calling ' + b.phone); return; }
    if (kind === 'avail') return editAvailability(b, refresh);
    if (kind === 'edit') return editDetails(b, refresh);
    if (kind === 'deactivate') return deactivate(b, refresh);
    if (kind === 'restore') return restore(b, refresh);
  }

  /* ---- Deactivate ------------------------------------------------------
     The dialog names the shifts because "2 upcoming shifts" is not enough
     to decide with - the scheduler needs to know which days break. */
  function deactivate(b, refresh) {
    var affected = S.SHIFTS.filter(function (s) { return s.bfmId === b.id && s.day >= S.TODAY; });
    var listHtml = affected.length
      ? '<div class="u-mt-3">' + affected.map(function (s) {
          var day = S.DAYS[s.day];
          return '<div style="display:flex;gap:var(--space-2);font-size:var(--m-fs-meta);padding:4px 0;">' +
            '<span class="u-danger">&bull;</span><span>' +
            esc(day.short + ', ' + day.label + ' · ' + s.start + ' to ' + s.end + ' · ' + s.position) + '</span></div>';
        }).join('') + '</div>' +
        '<label class="m-check u-mt-3"><input type="checkbox" id="releaseChk" checked /> ' +
        '<span>Release these back to Open</span></label>'
      : '';

    A.dialog({
      title: 'Deactivate ' + S.fullName(b) + '?',
      html: '<span>They will not appear in the scheduler until restored.</span>' +
        (affected.length ? '<span style="display:block;margin-top:var(--space-2);font-weight:var(--weight-medium);color:var(--fg-high);">' +
          affected.length + ' upcoming shift' + (affected.length === 1 ? ' is' : 's are') + ' assigned to them:</span>' : '') +
        listHtml,
      confirm: 'Deactivate', danger: true,
      onConfirm: function () { /* replaced below */ }
    });

    /* The checkbox lives inside the dialog, so its value has to be read at
       confirm time rather than captured when the dialog was built. */
    var node = $('#overlayHost').lastChild;
    var confirmBtn = $('[data-confirm]', node);
    var fresh = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(fresh, confirmBtn);
    fresh.addEventListener('click', function () {
      var release = affected.length ? $('#releaseChk', node).checked : false;
      var snapshot = affected.map(function (s) { return { s: s, bfmId: s.bfmId, status: s.status }; });
      b.account = 'deactivated';
      b.deactivatedOn = 'Aug 3, 2026';
      if (release) affected.forEach(function (s) { s.bfmId = null; s.status = 'open'; });
      A.pop();
      refresh(); A.render();
      A.snack(S.fullName(b) + ' deactivated', 'Undo', function () {
        b.account = 'active'; delete b.deactivatedOn;
        snapshot.forEach(function (x) { x.s.bfmId = x.bfmId; x.s.status = x.status; });
        refresh(); A.render();
      });
    });
  }

  function restore(b, refresh) {
    A.dialog({
      title: 'Restore ' + S.fullName(b) + '?',
      body: 'They become schedulable again. Shifts released when they were deactivated are not reassigned automatically.',
      confirm: 'Restore',
      onConfirm: function () {
        var was = b.deactivatedOn;
        b.account = 'active'; delete b.deactivatedOn;
        refresh(); A.render();
        A.snack(S.fullName(b) + ' restored', 'Undo', function () {
          b.account = 'deactivated'; b.deactivatedOn = was; refresh(); A.render();
        });
      }
    });
  }

  /* ---- Availability ----------------------------------------------------
     Seven rows with a toggle and two times. Long, but this is exactly the
     desktop form - collapsing it would make the phone the odd one out. */
  function editAvailability(b, refresh) {
    var draft = b.avail.map(function (a) { return { on: a.on, from: a.from, to: a.to }; });
    var TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'];

    function rowsHtml() {
      return draft.map(function (a, i) {
        return '<div class="m-card" style="padding:var(--space-4) var(--m-card-pad);">' +
          '<label class="m-switch is-row">' +
            '<span style="flex:1;font-size:var(--m-fs-body);font-weight:var(--weight-medium);">' + S.DAYS[i].dow + '</span>' +
            '<input type="checkbox" data-day="' + i + '"' + (a.on ? ' checked' : '') + ' /></label>' +
          (a.on
            ? '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);">' +
              timeSel(i, 'from', a.from, TIMES) + timeSel(i, 'to', a.to, TIMES) + '</div>'
            : '') +
          '</div>';
      }).join('');
    }
    function timeSel(i, key, val, times) {
      return '<select class="m-select u-grow" data-t="' + i + '" data-k="' + key + '" >' +
        times.map(function (t) { return '<option' + (t === val ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>';
    }

    A.fullscreen({
      title: 'Availability', flush: true,
      body: '<div class="m-alert is-info" style="margin:var(--space-4);">' + icon('circle', 18) +
        '<span>Availability affects who shows as available when you assign a shift. It does not block an override.</span></div>' +
        '<div class="m-stack" id="availRows">' + rowsHtml() + '</div>',
      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-close >Cancel</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-save >Save</button>',
      wire: function (node) {
        function attach() {
          $$('[data-day]', node).forEach(function (c) {
            c.addEventListener('change', function () {
              draft[+c.getAttribute('data-day')].on = c.checked;
              $('#availRows', node).innerHTML = rowsHtml();
              attach();
            });
          });
          $$('[data-t]', node).forEach(function (s) {
            s.addEventListener('change', function () {
              draft[+s.getAttribute('data-t')][s.getAttribute('data-k')] = s.value;
            });
          });
        }
        attach();
        $('[data-save]', node).addEventListener('click', function () {
          var bad = draft.some(function (a) { return a.on && S.toMin(a.to) <= S.toMin(a.from); });
          if (bad) { A.snack('Each day must end after it starts'); return; }
          b.avail = draft;
          A.pop(); refresh(); A.snack('Availability saved');
        });
      }
    });
  }

  /* ---- Edit details / add someone -------------------------------------- */
  function editDetails(b, refresh) {
    form(b, function () { refresh && refresh(); A.render(); });
  }

  function addBfm() {
    form(null, function () { A.render('bfms'); });
  }

  function form(existing, done) {
    var v = existing
      ? { first: existing.first, last: existing.last, email: existing.email, phone: existing.phone,
          empId: existing.empId, primary: existing.primary, employment: existing.employment,
          minHrs: existing.minHrs, maxHrs: existing.maxHrs }
      : { first: '', last: '', email: '', phone: '', empId: '', primary: S.POSITIONS[0],
          employment: 'Full-time', minHrs: 32, maxHrs: 60 };

    function field(key, label, type, hint) {
      return '<label class="m-field"><span class="m-field-label">' + esc(label) + '</span>' +
        '<input class="m-input" data-f="' + key + '" type="' + (type || 'text') + '" value="' + esc(v[key]) + '" />' +
        (hint ? '<span class="m-field-hint">' + esc(hint) + '</span>' : '') +
        '<span class="m-field-hint is-error" data-err="' + key + '" hidden></span></label>';
    }

    A.fullscreen({
      title: existing ? 'Edit ' + existing.first : 'Add a BFM',
      body: '<div style="display:flex;flex-direction:column;gap:var(--space-4);">' +
        field('first', 'First name') + field('last', 'Last name') +
        field('email', 'Email', 'email') +
        field('phone', 'Mobile number', 'tel', 'Without a mobile number they cannot be reached by SMS') +
        field('empId', 'Employee ID', 'text', 'Optional. Matched against HRIS on the next sync') +
        '<label class="m-field"><span class="m-field-label">Primary position</span>' +
          '<select class="m-select" data-f="primary">' + S.POSITIONS.map(function (p) {
            return '<option' + (p === v.primary ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') + '</select></label>' +
        '<label class="m-field"><span class="m-field-label">Employment</span>' +
          '<select class="m-select" data-f="employment">' + ['Full-time', 'Part-time', 'Agency'].map(function (p) {
            return '<option' + (p === v.employment ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></label>' +
        '<div style="display:flex;gap:var(--space-3);">' +
          '<label class="m-field u-grow"><span class="m-field-label">Min hours</span>' +
            '<input class="m-input" data-f="minHrs" type="number" value="' + v.minHrs + '" /></label>' +
          '<label class="m-field u-grow"><span class="m-field-label">Max hours</span>' +
            '<input class="m-input" data-f="maxHrs" type="number" value="' + v.maxHrs + '" /></label>' +
        '</div></div>',
      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-close >Cancel</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-save >' + (existing ? 'Save' : 'Add') + '</button>',
      wire: function (node) {
        $$('[data-f]', node).forEach(function (i) {
          i.addEventListener('input', function () { v[i.getAttribute('data-f')] = i.value; });
          i.addEventListener('change', function () { v[i.getAttribute('data-f')] = i.value; });
        });
        $('[data-save]', node).addEventListener('click', function () {
          $$('[data-err]', node).forEach(function (e) { e.hidden = true; });
          var errs = [];
          if (!v.first.trim()) errs.push(['first', 'Add a first name']);
          if (!v.last.trim()) errs.push(['last', 'Add a last name']);
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) errs.push(['email', 'Add a valid email address']);
          if (+v.maxHrs < +v.minHrs) errs.push(['maxHrs', 'Max hours must be at least the minimum']);
          if (errs.length) {
            errs.forEach(function (e) {
              var el = $('[data-err="' + e[0] + '"]', node);
              if (el) { el.textContent = e[1]; el.hidden = false; }
            });
            var firstErr = $('[data-f="' + errs[0][0] + '"]', node);
            if (firstErr) firstErr.focus();
            A.snack(errs.length + (errs.length === 1 ? ' field needs attention' : ' fields need attention'));
            return;
          }
          if (existing) {
            ['first', 'last', 'email', 'phone', 'empId', 'primary', 'employment'].forEach(function (k) { existing[k] = v[k]; });
            existing.minHrs = +v.minHrs; existing.maxHrs = +v.maxHrs;
            existing.initials = (v.first[0] + v.last[0]).toUpperCase();
            A.pop(); done(); A.snack('Changes saved');
          } else {
            var nb = {
              id: S.BFMS.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1,
              first: v.first.trim(), last: v.last.trim(), email: v.email.trim(), phone: v.phone.trim(),
              empId: v.empId.trim(), avatar: 'c' + (1 + (S.BFMS.length % 8)),
              initials: (v.first[0] + v.last[0]).toUpperCase(),
              primary: v.primary, secondary: [], employment: v.employment, account: 'active',
              joined: 'Aug 3, 2026', minHrs: +v.minHrs, maxHrs: +v.maxHrs,
              sms: !!v.phone.trim(), push: false, timeOff: [],
              avail: [0, 1, 2, 3, 4, 5, 6].map(function (i) {
                return { on: i > 0 && i < 6, from: '7:00 AM', to: '3:00 PM' };
              })
            };
            S.BFMS.push(nb);
            A.pop(); acct = 'active'; done();
            A.snack(S.fullName(nb) + ' added', 'View', function () { openProfile(nb.id); });
          }
        });
      }
    });
  }

  /* ---- Wiring ----------------------------------------------------------- */
  $$('#bfmChips .m-chip').forEach(function (c) {
    c.addEventListener('click', function () { acct = c.getAttribute('data-acct'); A.render('bfms'); });
  });
  $('#bfmSearch').addEventListener('input', function () { q = this.value.trim(); A.render('bfms'); });
  $('#fabBfm').addEventListener('click', addBfm);
  $('[data-sheet="bfmSort"]').addEventListener('click', function () {
    A.sheet({ title: 'Sort by', rows: [
      { value: 'name', title: 'Name', sub: 'A to Z', selected: sort === 'name' },
      { value: 'position', title: 'Position', sub: 'Grouped by primary role', selected: sort === 'position' },
      { value: 'hours', title: 'Hours this week', sub: 'Most scheduled first', selected: sort === 'hours' }
    ], onPick: function (v) { sort = v; A.render('bfms'); } });
  });

  A.openProfile = openProfile;
})(window, document);
