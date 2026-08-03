/* ============================================================
   skySchedule mobile - Schedule
   The desktop week grid does not survive a 390px viewport: seven
   columns of roster leave 45px each. The same information is
   presented as a vertical agenda instead - one day after another,
   sticky day headers, shifts in time order. Filters carry the
   scoping that the grid's columns used to do.
   ============================================================ */
(function (w, d) {
  'use strict';
  var S = w.SS, A = w.APP;
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var filter = { status: 'all', position: 'all', location: 'all', person: 'all' };
  var weekOffset = 0;
  var query = '';

  /* Real date maths rather than hardcoded strings, so stepping weeks
     produces correct labels instead of only working for the seed week. */
  var BASE = new Date(2026, 6, 26);           // Sunday Jul 26, 2026
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function dayDate(i) {
    var t = new Date(BASE);
    t.setDate(t.getDate() + weekOffset * 7 + i);
    return t;
  }
  function fmt(t) { return MONTHS[t.getMonth()] + ' ' + t.getDate(); }

  function rangeLabel() {
    return fmt(dayDate(0)) + ' – ' + fmt(dayDate(6));
  }

  function activeFilterCount() {
    var n = 0;
    if (filter.status !== 'all') n++;
    if (filter.position !== 'all') n++;
    if (filter.location !== 'all') n++;
    if (filter.person !== 'all') n++;
    return n;
  }

  function visibleShifts(dayIndex) {
    /* Only the seed week holds data. Other weeks render the empty state
       rather than silently repeating the same seven days. */
    if (weekOffset !== 0) return [];
    return S.shiftsOn(dayIndex).filter(function (s) {
      if (filter.status !== 'all' && s.status !== filter.status) return false;
      if (filter.position !== 'all' && s.position !== filter.position) return false;
      if (filter.location !== 'all' && s.location !== filter.location) return false;
      if (filter.person !== 'all' && String(s.bfmId) !== filter.person) return false;
      if (query) {
        var b = S.byId(s.bfmId);
        var hay = (s.position + ' ' + (b ? S.fullName(b) : 'unassigned') + ' ' + s.location).toLowerCase();
        if (hay.indexOf(query.toLowerCase()) === -1) return false;
      }
      return true;
    });
  }

  A.register('schedule', function () {
    $('#rangeLabel').textContent = rangeLabel();

    var n = activeFilterCount();
    var fc = $('#schedFilterCount');
    fc.textContent = String(n); fc.hidden = n === 0;

    $$('#schedChips .m-chip').forEach(function (c) {
      c.classList.toggle('is-selected', c.getAttribute('data-status') === filter.status);
    });

    var h = [];
    var total = 0;
    /* With no filter, an empty day is information - it shows the gap in the
       week. Under a filter it is noise: "Open" showed five "No shifts" days
       framing two results. So empty days are dropped once a filter narrows
       the question being asked. */
    var narrowed = n > 0 || !!query;
    for (var i = 0; i < 7; i++) {
      var list = visibleShifts(i);
      total += list.length;
      if (narrowed && !list.length) continue;
      var t = dayDate(i);
      var isToday = weekOffset === 0 && i === S.TODAY;
      h.push('<div class="m-group">' +
        '<div class="m-day-header m-sticky' + (isToday ? ' is-today' : '') + '">' +
          '<span class="m-day-num">' + t.getDate() + '</span>' +
          '<span class="m-day-name">' + DOW[t.getDay()] + (isToday ? ' &middot; Today' : '') + '</span>' +
          '<span class="m-day-count">' + (list.length ? list.length + (list.length === 1 ? ' shift' : ' shifts') : 'No shifts') + '</span>' +
        '</div>' +
        /* A day is one card. Shifts divide inside it; days separate by space. */
        (list.length ? '<div class="m-stack"><div class="m-card is-rows">' +
          list.map(A.shiftRow).join('') + '</div></div>' : '') +
        '</div>');
    }

    if (total === 0) {
      h = ['<div class="m-empty"><span class="m-empty-art">' + icon('calendar', 28) + '</span>' +
        '<h2>' + (n || query ? 'Nothing matches' : 'No shifts this week') + '</h2>' +
        '<p>' + (n || query
          ? 'No shifts in ' + rangeLabel() + ' match the filters you have set.'
          : 'Nothing is scheduled for ' + rangeLabel() + '. Create a shift to start the week.') + '</p>' +
        (n || query
          ? '<button class="m-btn m-btn-tonal state-layer u-mt-2" id="clearFilters" >Clear filters</button>'
          : '<button class="m-btn m-btn-tonal state-layer u-mt-2" id="emptyCreate" >Create shift</button>') +
        '</div>'];
    }

    var body = $('#schedBody');
    body.innerHTML = h.join('');
    body.scrollTop = 0;

    var cf = $('#clearFilters', body);
    if (cf) cf.addEventListener('click', function () {
      filter = { status: 'all', position: 'all', location: 'all', person: 'all' };
      query = ''; A.render('schedule');
    });
    var ec = $('#emptyCreate', body);
    if (ec) ec.addEventListener('click', createShift);

    $$('[data-shift]', body).forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('[data-assign]')) return;
        openShift(+el.getAttribute('data-shift'));
      });
    });
    $$('[data-assign]', body).forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); assignFlow(+el.getAttribute('data-assign')); });
    });
  });

  /* ---- Shift detail -------------------------------------------------- */
  function openShift(id) {
    var s = S.shiftById(id);
    if (!s) return;
    var b = S.byId(s.bfmId);
    var day = S.DAYS[s.day];
    var hrs = S.hoursOf(s);

    A.fullscreen({
      title: 'Shift #' + s.id, back: true, onBack: function () {}, flush: true,
      trail: A.badge(s.status),
      body:
        '<div style="padding:var(--space-6) var(--m-inset) var(--space-5);">' +
          '<div style="font-size:var(--m-fs-hero);line-height:var(--m-lh-hero);font-weight:var(--weight-bold);">' + esc(s.start + ' to ' + s.end) + '</div>' +
          '<div style="font-size:var(--m-fs-body);color:var(--fg-low);margin-top:2px;">' + esc(day.dow + ', ' + day.label) + ' &middot; ' + hrs + 'h</div>' +
        '</div>' +
        (b
          ? '<div class="m-stack"><button class="m-card m-list-item state-layer m-card-row" data-profile="' + b.id + '" >' +
            '<span class="m-li-lead">' + A.avatar(b) + '</span>' +
            '<span class="m-li-text"><span class="m-li-title">' + esc(S.fullName(b)) + '</span>' +
            '<span class="m-li-sub">' + esc(b.primary + ' · ' + b.employment) + '</span></span>' +
            '<span class="m-li-trail">' + icon('chevron', 20) + '</span></button></div>'
          : '<div class="m-alert is-' + (s.status === 'unfulfilled' ? 'danger' : 'warning') + '" style="margin:0 var(--m-inset) var(--space-3);">' +
            icon('warn', 18) + '<span>' + (s.status === 'unfulfilled'
              ? 'This shift was never filled and the date has passed.'
              : 'Nobody is assigned yet.') + '</span></div>') +
        '<div class="m-stack">' + A.card(
          A.kv('Position', s.position) + A.kv('Location', s.location) +
          A.kv('Status', (A.badge(s.status).replace(/<[^>]+>/g, '')).trim()) +
          A.kv('Paid hours', hrs + 'h')) + '</div>' +
        '<div class="m-sec-head"><h2>Actions</h2></div>' +
        '<div class="m-stack">' + A.card(
          actionRow('message', 'Message the assignee', b ? '' : 'disabled') +
          actionRow('swap', 'Reassign to someone else') +
          actionRow('edit', 'Edit times and position') +
          actionRow('trash', 'Delete shift', '', true)) + '</div>',
      actions: (b
        ? '<button class="m-btn m-btn-outlined state-layer u-grow" data-unassign >Unassign</button>' +
          (s.status === 'draft' ? '<button class="m-btn m-btn-filled state-layer u-grow" data-publish >Publish</button>' : '')
        : '<button class="m-btn m-btn-filled state-layer u-grow" data-assign >Assign someone</button>'),
      wire: function (node) {
        var p = $('[data-profile]', node);
        if (p) p.addEventListener('click', function () {
          A.openProfile && A.openProfile(+p.getAttribute('data-profile'));
        });
        var as = $('[data-assign]', node);
        if (as) as.addEventListener('click', function () { A.pop(); assignFlow(s.id); });
        var un = $('[data-unassign]', node);
        if (un) un.addEventListener('click', function () {
          A.dialog({
            title: 'Unassign ' + S.fullName(b) + '?',
            body: 'The shift returns to Open and needs to be refilled before ' + day.short + '.',
            confirm: 'Unassign', danger: true,
            onConfirm: function () {
              var prev = { bfmId: s.bfmId, status: s.status };
              s.bfmId = null; s.status = 'open';
              A.pop(); A.render();
              A.snack('Shift returned to Open', 'Undo', function () {
                s.bfmId = prev.bfmId; s.status = prev.status; A.render();
              });
            }
          });
        });
        var pb = $('[data-publish]', node);
        if (pb) pb.addEventListener('click', function () {
          s.status = 'confirmed'; A.pop(); A.render(); A.snack('Shift published');
        });
        $$('[data-act]', node).forEach(function (r) {
          r.addEventListener('click', function () { shiftAction(r.getAttribute('data-act'), s); });
        });
      }
    });
  }

  function actionRow(ic, label, disabled, danger) {
    return '<button class="m-list-item state-layer" data-act="' + ic + '"' + (disabled ? ' disabled' : '') +
      ' style="width:100%;text-align:left;background:none;border:0;' +
      (danger ? 'color:var(--danger-text);' : '') + (disabled ? 'opacity:.45;' : '') + '">' +
      '<span class="m-li-lead" style="width:var(--m-lead);height:var(--m-lead);border-radius:var(--radius-full);display:grid;place-content:center;background:var(--' +
      (danger ? 'danger-bg' : 'gray-3') + ');' + (danger ? 'color:var(--danger-text);' : '') + '">' + icon(ic, 20) + '</span>' +
      '<span class="m-li-text"><span class="m-li-title"' + (danger ? ' class="u-danger"' : '') + '>' + esc(label) + '</span></span>' +
      '</button>';
  }

  function shiftAction(kind, s) {
    if (kind === 'swap') { A.pop(); assignFlow(s.id, true); return; }
    if (kind === 'edit') { A.pop(); createShift(s); return; }
    if (kind === 'message') {
      A.pop();
      A.composeFor && A.composeFor({ scope: 'shift', shift: s });
      return;
    }
    if (kind === 'trash') {
      A.dialog({
        title: 'Delete shift #' + s.id + '?',
        body: s.bfmId ? S.fullName(S.byId(s.bfmId)) + ' will be notified that it was removed.' : 'This cannot be undone from the mobile app.',
        confirm: 'Delete', danger: true,
        onConfirm: function () {
          var i = S.SHIFTS.indexOf(s);
          S.SHIFTS.splice(i, 1);
          A.pop(); A.render();
          A.snack('Shift deleted', 'Undo', function () { S.SHIFTS.splice(i, 0, s); A.render(); });
        }
      });
    }
  }

  /* ---- Assign ---------------------------------------------------------
     Candidates are ranked by whether they can actually work it. Everyone
     qualified is still listed, with the blocker spelled out, because the
     scheduler sometimes needs to override availability - hiding those
     people would just send them to the desktop. */
  function assignFlow(id, reassign) {
    var s = S.shiftById(id);
    if (!s) return;
    var cands = S.candidatesFor(s);
    var day = S.DAYS[s.day];

    if (!cands.length) {
      A.sheet({ title: 'No one is qualified',
        body: '<p class="u-body-low">Nobody active holds ' + esc(s.position) +
          ' as a primary or secondary position. Add it to someone in BFMs, then assign.</p>',
        actions: '<button class="m-btn m-btn-outlined state-layer" data-close>Close</button>' +
                 '<button class="m-btn m-btn-filled state-layer" data-bfms>Go to BFMs</button>',
        wire: function (n) { $('[data-bfms]', n).addEventListener('click', function () { A.popAll(); A.go('bfms'); }); } });
      return;
    }

    A.sheet({
      title: reassign ? 'Reassign shift' : 'Assign shift',
      sub: s.position + ' · ' + day.short + ', ' + day.label + ' · ' + s.start + ' to ' + s.end,
      rows: cands.map(function (c) {
        return {
          value: String(c.bfm.id),
          title: S.fullName(c.bfm),
          sub: c.available ? c.bfm.primary + ' · Available' : c.why,
          lead: A.avatar(c.bfm, true),
          selected: String(c.bfm.id) === String(s.bfmId)
        };
      }),
      onPick: function (v) {
        var c = cands.filter(function (x) { return String(x.bfm.id) === v; })[0];
        if (!c) return;
        if (!c.available) {
          /* Overriding is allowed but never silent. */
          A.dialog({
            title: 'Assign anyway?',
            body: S.fullName(c.bfm) + ': ' + c.why.toLowerCase() + '. Assigning creates a conflict they will see.',
            confirm: 'Assign anyway',
            onConfirm: function () { commit(s, c.bfm); }
          });
        } else commit(s, c.bfm);
      }
    });
  }

  function commit(s, bfm) {
    var prev = { bfmId: s.bfmId, status: s.status };
    s.bfmId = bfm.id;
    s.status = 'confirmed';
    A.render();
    A.snack(S.fullName(bfm) + ' assigned', 'Undo', function () {
      s.bfmId = prev.bfmId; s.status = prev.status; A.render();
    });
  }

  /* ---- Create / edit a shift ------------------------------------------
     Quantity is on the form so batch creation - a separate destination on
     the desktop - is just a number here rather than a second screen. */
  function createShift(existing) {
    var editing = !!existing;
    var draft = editing
      ? { position: existing.position, day: existing.day, start: existing.start, end: existing.end,
          location: existing.location, qty: 1, assignTo: existing.bfmId, publish: existing.status !== 'draft' }
      : { position: S.POSITIONS[0], day: weekOffset === 0 ? S.TODAY : 0, start: '7:00 AM', end: '3:00 PM',
          location: S.LOCATIONS[0], qty: 1, assignTo: null, publish: true };

    var TIMES = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
      '9:00 PM', '10:00 PM', '11:00 PM'];

    function bodyHtml() {
      var day = S.DAYS[draft.day];
      var who = draft.assignTo ? S.fullName(S.byId(draft.assignTo)) : 'Leave open';
      var dur = (S.toMin(draft.end) - S.toMin(draft.start)) / 60;
      return pickRow('position', 'Position', draft.position) +
        pickRow('day', 'Date', day.dow + ', ' + day.label) +
        pickRow('start', 'Starts', draft.start) +
        pickRow('end', 'Ends', draft.end) +
        (dur <= 0
          ? '<div class="m-alert is-danger" style="margin:var(--space-3) var(--space-4) 0;">' + icon('warn', 18) +
            '<span>The end time must be after the start time.</span></div>'
          : '<div class="m-note">' + dur + ' paid hours</div>') +
        pickRow('location', 'Location', draft.location) +
        pickRow('assign', 'Assign to', who) +
        (editing ? '' :
          '<div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--m-inset);">' +
            '<span class="u-grow u-body">How many</span>' +
            '<div class="m-stepper"><button data-qty="-1" class="state-layer" aria-label="Fewer">' + icon('minusOnly', 20) +
            '</button><span class="m-stepper-value" id="qtyVal">' + draft.qty + '</span>' +
            '<button data-qty="1" class="state-layer" aria-label="More">' + icon('plus', 20, 2) + '</button></div></div>') +
        '<label class="m-switch" style="gap:var(--space-3);justify-content:space-between;width:100%;padding:var(--m-inset);">' +
          '<span class="u-grow u-body">Publish immediately<span class="u-meta-low">Off saves it as a draft nobody sees yet</span></span>' +
          '<input type="checkbox" id="pubToggle"' + (draft.publish ? ' checked' : '') + ' /></label>';
    }

    function pickRow(key, label, val) {
      return '<button class="m-list-item state-layer m-row-btn" data-pick="' + key + '" >' +
        '<span class="m-li-text"><span class="m-li-sub u-eyebrow">' + esc(label) + '</span>' +
        '<span class="m-li-title u-body">' + esc(val) + '</span></span>' +
        '<span class="m-li-trail">' + icon('chevron', 20) + '</span></button>';
    }

    A.fullscreen({
      title: editing ? 'Edit shift' : 'Create shift', flush: true,
      body: bodyHtml(),
      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-close >Cancel</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-save >' +
               (editing ? 'Save changes' : 'Create') + '</button>',
      wire: function wireForm(node) {
        function refresh() {
          $('#fsBody', node).innerHTML = bodyHtml();
          bind();
        }
        function bind() {
          $$('[data-pick]', node).forEach(function (r) {
            r.addEventListener('click', function () { openPicker(r.getAttribute('data-pick')); });
          });
          $$('[data-qty]', node).forEach(function (bn) {
            bn.addEventListener('click', function () {
              draft.qty = Math.min(20, Math.max(1, draft.qty + (+bn.getAttribute('data-qty'))));
              $('#qtyVal', node).textContent = draft.qty;
            });
          });
          var pt = $('#pubToggle', node);
          if (pt) pt.addEventListener('change', function () { draft.publish = pt.checked; });
        }
        function openPicker(key) {
          if (key === 'position') return A.sheet({ title: 'Position', rows: S.POSITIONS.map(function (p) {
            return { value: p, title: p, selected: p === draft.position };
          }), onPick: function (v) { draft.position = v; refresh(); } });
          if (key === 'location') return A.sheet({ title: 'Location', rows: S.LOCATIONS.map(function (l) {
            return { value: l, title: l, selected: l === draft.location };
          }), onPick: function (v) { draft.location = v; refresh(); } });
          if (key === 'day') return A.sheet({ title: 'Date', rows: S.DAYS.map(function (dd) {
            return { value: String(dd.i), title: dd.dow + ', ' + dd.label,
              sub: S.shiftsOn(dd.i).length + ' shifts already', selected: dd.i === draft.day };
          }), onPick: function (v) { draft.day = +v; refresh(); } });
          if (key === 'start' || key === 'end') return A.sheet({ title: key === 'start' ? 'Start time' : 'End time',
            rows: TIMES.map(function (t) { return { value: t, title: t, selected: t === draft[key] }; }),
            onPick: function (v) { draft[key] = v; refresh(); } });
          if (key === 'assign') {
            var probe = { day: draft.day, start: draft.start, end: draft.end, position: draft.position, id: existing ? existing.id : -1 };
            var cands = S.candidatesFor(probe);
            return A.sheet({ title: 'Assign to',
              rows: [{ value: '', title: 'Leave open', sub: 'Anyone qualified can claim it', selected: !draft.assignTo }]
                .concat(cands.map(function (c) {
                  return { value: String(c.bfm.id), title: S.fullName(c.bfm), lead: A.avatar(c.bfm, true),
                    sub: c.available ? 'Available' : c.why, selected: c.bfm.id === draft.assignTo };
                })),
              onPick: function (v) { draft.assignTo = v ? +v : null; refresh(); } });
          }
        }
        bind();
        $('[data-save]', node).addEventListener('click', function () {
          if (S.toMin(draft.end) <= S.toMin(draft.start)) { A.snack('The end time must be after the start time'); return; }
          if (editing) {
            existing.position = draft.position; existing.day = draft.day;
            existing.start = draft.start; existing.end = draft.end;
            existing.location = draft.location;
            existing.bfmId = draft.assignTo;
            existing.status = draft.assignTo ? (draft.publish ? 'confirmed' : 'draft') : 'open';
            A.pop(); A.render(); A.snack('Shift updated');
            return;
          }
          var made = [];
          for (var i = 0; i < draft.qty; i++) {
            var s = { id: nextId(), bfmId: draft.assignTo, day: draft.day, start: draft.start,
              end: draft.end, position: draft.position, location: draft.location,
              status: draft.assignTo ? (draft.publish ? 'confirmed' : 'draft') : 'open' };
            S.SHIFTS.push(s); made.push(s);
          }
          A.pop(); A.render();
          A.snack(made.length + (made.length === 1 ? ' shift created' : ' shifts created'), 'Undo', function () {
            made.forEach(function (s) { var i = S.SHIFTS.indexOf(s); if (i > -1) S.SHIFTS.splice(i, 1); });
            A.render();
          });
        });
      }
    });
  }

  function nextId() {
    return S.SHIFTS.reduce(function (m, s) { return Math.max(m, s.id); }, 1700) + 1;
  }

  /* ---- Range and filter sheets ---------------------------------------- */
  function rangeSheet() {
    /* A month grid, not a horizontal date rail. The grid shows which days
       carry shifts and which carry problems before you commit to a tap. */
    var y = 2026, mo = 6 + (weekOffset >= 1 ? 1 : 0);
    var first = new Date(y, mo, 1);
    var pad = first.getDay();
    var len = new Date(y, mo + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < pad; i++) cells.push('<span></span>');
    for (var dnum = 1; dnum <= len; dnum++) {
      var inWeek = -1;
      for (var k = 0; k < 7; k++) {
        var t = dayDate(k);
        if (t.getDate() === dnum && t.getMonth() === mo) { inWeek = k; break; }
      }
      var list = inWeek > -1 ? S.shiftsOn(inWeek) : [];
      var bad = list.some(function (s) { return s.status === 'unfulfilled' || s.status === 'open'; });
      var isToday = mo === 6 && dnum === 27;
      cells.push('<button class="m-month-day' + (isToday ? ' is-today' : '') +
        (inWeek > -1 ? ' is-selected' : '') + '" data-day="' + dnum + '">' + dnum +
        (list.length ? '<span class="m-month-dot' + (bad ? ' is-danger' : '') + '"></span>' : '') + '</button>');
    }
    A.sheet({
      title: MONTHS[mo] + ' ' + y,
      body: '<div class="m-month">' +
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(function (x) { return '<span class="m-month-dow">' + x + '</span>'; }).join('') +
        cells.join('') + '</div>' +
        '<div style="display:flex;gap:var(--space-4);margin-top:var(--space-4);font-size:var(--m-fs-meta);color:var(--fg-low);">' +
          '<span class="u-count"><span class="m-month-dot" style="display:inline-block;"></span> Has shifts</span>' +
          '<span class="u-count"><span class="m-month-dot is-danger" style="display:inline-block;"></span> Needs attention</span>' +
        '</div>',
      actions: '<button class="m-btn m-btn-outlined state-layer" data-today>Jump to today</button>' +
               '<button class="m-btn m-btn-filled state-layer" data-close>Done</button>',
      wire: function (n) {
        $('[data-today]', n).addEventListener('click', function () {
          weekOffset = 0; A.pop(); A.render('schedule');
        });
      }
    });
  }
  A.rangeSheet = rangeSheet;

  function filterSheet() {
    A.sheet({
      title: 'Filter shifts',
      body:
        '<div style="font-size:var(--m-fs-meta);color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.05em;margin-bottom:var(--space-2);">Status</div>' +
        chipSet('status', ['all', 'confirmed', 'draft', 'open', 'unfulfilled'],
          ['Any status', 'Confirmed', 'Draft', 'Open', 'Unfulfilled']) +
        '<label class="m-field u-mt-4"><span class="m-field-label">Position</span>' +
          sel('position', ['all'].concat(S.POSITIONS), ['Any position'].concat(S.POSITIONS)) + '</label>' +
        '<label class="m-field u-mt-4"><span class="m-field-label">Location</span>' +
          sel('location', ['all'].concat(S.LOCATIONS), ['Any location'].concat(S.LOCATIONS)) + '</label>' +
        '<label class="m-field u-mt-4"><span class="m-field-label">Person</span>' +
          sel('person', ['all'].concat(S.BFMS.map(function (b) { return String(b.id); })),
              ['Anyone'].concat(S.BFMS.map(S.fullName))) + '</label>',
      actions: '<button class="m-btn m-btn-outlined state-layer" data-clear>Clear all</button>' +
               '<button class="m-btn m-btn-filled state-layer" data-apply>Show results</button>',
      wire: function (n) {
        var next = { status: filter.status, position: filter.position, location: filter.location, person: filter.person };
        $$('[data-chipset] .m-chip', n).forEach(function (c) {
          c.addEventListener('click', function () {
            var set = c.closest('[data-chipset]').getAttribute('data-chipset');
            next[set] = c.getAttribute('data-val');
            $$('.m-chip', c.parentNode).forEach(function (x) { x.classList.toggle('is-selected', x === c); });
          });
        });
        $$('select[data-sel]', n).forEach(function (sl) {
          sl.addEventListener('change', function () { next[sl.getAttribute('data-sel')] = sl.value; });
        });
        $('[data-apply]', n).addEventListener('click', function () {
          filter = next; A.pop(); A.render('schedule');
        });
        $('[data-clear]', n).addEventListener('click', function () {
          filter = { status: 'all', position: 'all', location: 'all', person: 'all' };
          query = ''; A.pop(); A.render('schedule');
        });
      }
    });
  }

  function chipSet(key, values, labels) {
    return '<div class="m-chip-row" data-chipset="' + key + '" >' +
      values.map(function (v, i) {
        return '<button class="m-chip' + (v === filter[key] ? ' is-selected' : '') + ' state-layer" data-val="' + esc(v) + '">' + esc(labels[i]) + '</button>';
      }).join('') + '</div>';
  }
  function sel(key, values, labels) {
    return '<select class="m-select" data-sel="' + key + '">' + values.map(function (v, i) {
      return '<option value="' + esc(v) + '"' + (v === filter[key] ? ' selected' : '') + '>' + esc(labels[i]) + '</option>';
    }).join('') + '</select>';
  }

  /* ---- Wiring ---------------------------------------------------------- */
  $('#weekPrev').addEventListener('click', function () { weekOffset--; A.render('schedule'); });
  $('#weekNext').addEventListener('click', function () { weekOffset++; A.render('schedule'); });
  $('#rangeBtn').addEventListener('click', rangeSheet);
  $('[data-sheet="schedFilter"]').addEventListener('click', filterSheet);
  $('#fabShift').addEventListener('click', function () { createShift(); });
  $$('#schedChips .m-chip').forEach(function (c) {
    c.addEventListener('click', function () {
      filter.status = c.getAttribute('data-status');
      A.render('schedule');
    });
  });
  $('#schedSearchBtn').addEventListener('click', function () {
    A.sheet({ title: 'Search shifts',
      body: '<div class="m-search"><input id="schedQ" placeholder="Name, position or location" value="' + esc(query) + '" /></div>',
      actions: '<button class="m-btn m-btn-outlined state-layer" data-clearq>Clear</button>' +
               '<button class="m-btn m-btn-filled state-layer" data-go>Search</button>',
      wire: function (n) {
        var inp = $('#schedQ', n);
        setTimeout(function () { inp.focus(); }, 60);
        $('[data-go]', n).addEventListener('click', function () { query = inp.value.trim(); A.pop(); A.render('schedule'); });
        $('[data-clearq]', n).addEventListener('click', function () { query = ''; A.pop(); A.render('schedule'); });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { query = inp.value.trim(); A.pop(); A.render('schedule'); }
        });
      } });
  });

  A.openShift = openShift;
  A.assignFlow = assignFlow;
  A.createShift = createShift;
  A.setScheduleFilter = function (status) { filter.status = status; };
})(window, document);
