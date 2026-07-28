/* Compose, structured as a readiness checklist.
   Adapted from the Mailchimp campaign setup screen: a progress meter over a
   list of requirements, each row carrying its own state, summary, and inline
   editor. The requirements are ours (audience, channels, per-channel content,
   recipients, timing) and content is plain text because these land on SMS and
   push, not in a designed email. */
(function () {
  'use strict';
  var C = window.Comms;

  var draft = null;   // set when resuming an existing draft
  var openRow = null; // only one row expands at a time
  var focusRef = null;

  var state = blankState();
  function blankState() {
    return {
      title: 'Untitled message',
      audience: 'week', from: '26/07/2026', to: '01/08/2026',
      channels: { sms: true, email: true, push: true },
      sms: '', emailSubject: '', emailBody: '',
      selected: C.PEOPLE.map(function (p) { return p.id; }),
      previewId: C.PEOPLE[0].id,
      search: '',
      sendMode: 'now', schedDate: '28/07/2026', schedTime: '06:00 AM',
      templateName: null,
      savedAt: null
    };
  }

  function selectedPeople() { return C.PEOPLE.filter(function (p) { return state.selected.indexOf(p.id) > -1; }); }
  function previewPerson() { return C.PEOPLE.filter(function (p) { return p.id === state.previewId; })[0] || C.PEOPLE[0]; }
  function activeChannels() { return ['sms', 'email', 'push'].filter(function (c) { return state.channels[c]; }); }

  // Text copied from a template and never edited. Mailchimp catches this for
  // placeholder copy; the equivalent risk here is blasting a template verbatim
  // when it was meant to be adjusted.
  function untouchedTemplate() {
    if (!state.templateName) return false;
    var t = C.TEMPLATES.filter(function (x) { return x.name === state.templateName; })[0];
    return !!t && t.sms === state.sms && t.emailSubject === state.emailSubject && t.emailBody === state.emailBody;
  }

  // ---- The checklist model ----
  // Each row: key, label, a state of 'done' | 'todo' | 'error', a one-line
  // summary shown when collapsed, and the problems blocking send.
  function checklist() {
    var rows = [];
    var people = selectedPeople();

    rows.push({
      key: 'audience', label: 'Audience',
      state: people.length ? 'done' : 'error',
      summary: people.length
        ? people.length + ' people on the schedule, ' + state.from + ' to ' + state.to
        : 'No one matches this date range',
      problems: people.length ? [] : ['No one is on the schedule for this range.']
    });

    var chList = activeChannels();
    var reachBits = chList.map(function (ch) {
      var s = C.reachSummary(people, ch);
      return (ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'Push') + ' ' + s.reached + '/' + s.total;
    }).join(', ');
    rows.push({
      key: 'channels', label: 'Channels',
      state: chList.length ? 'done' : 'error',
      summary: chList.length ? reachBits : 'No channels selected',
      problems: chList.length ? [] : ['Pick at least one channel.']
    });

    if (state.channels.sms || state.channels.push) {
      var smsBad = C.unknownTokens(state.sms);
      var smsProblems = [];
      if (!state.sms.trim()) smsProblems.push('Write the message that goes out by SMS and push.');
      if (smsBad.length) smsProblems.push('Unknown merge field: ' + smsBad.map(function (b) { return '{' + b + '}'; }).join(', ') + '. It will send as literal text.');
      if (untouchedTemplate()) smsProblems.push('This is still the "' + state.templateName + '" template word for word. Edit it or confirm it is right as is.');
      rows.push({
        key: 'sms', label: 'SMS and push message',
        state: smsProblems.length ? (state.sms.trim() ? 'error' : 'todo') : 'done',
        summary: state.sms.trim() ? truncate(C.render(state.sms, previewPerson()), 70) : 'Not written yet',
        problems: smsProblems
      });
    }

    if (state.channels.email) {
      var emProblems = [];
      if (!state.emailSubject.trim()) emProblems.push('Add a subject line.');
      if (!state.emailBody.trim()) emProblems.push('Add an email body.');
      var emBad = C.unknownTokens(state.emailSubject).concat(C.unknownTokens(state.emailBody));
      if (emBad.length) emProblems.push('Unknown merge field: ' + emBad.map(function (b) { return '{' + b + '}'; }).join(', ') + '.');
      rows.push({
        key: 'email', label: 'Email',
        state: emProblems.length ? ((state.emailSubject.trim() || state.emailBody.trim()) ? 'error' : 'todo') : 'done',
        summary: state.emailSubject.trim() ? truncate(C.render(state.emailSubject, previewPerson()), 70) : 'No subject yet',
        problems: emProblems
      });
    }

    rows.push({
      key: 'recipients', label: 'Recipients',
      state: state.selected.length ? 'done' : 'error',
      summary: state.selected.length ? state.selected.length + ' of ' + C.PEOPLE.length + ' selected' : 'No one selected',
      problems: state.selected.length ? [] : ['Select at least one person.']
    });

    rows.push({
      key: 'when', label: 'Send time',
      state: 'done',
      summary: state.sendMode === 'now' ? 'Send now' : 'Scheduled for ' + state.schedDate + ' at ' + state.schedTime,
      problems: []
    });

    return rows;
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  function readiness() {
    var rows = checklist();
    return {
      rows: rows,
      done: rows.filter(function (r) { return r.state === 'done'; }).length,
      total: rows.length,
      blocked: rows.some(function (r) { return r.problems.length; })
    };
  }

  // ---- Row editors ----
  function editorHTML(key) {
    if (key === 'audience') {
      return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-4);">' +
        '<label class="field"><span class="field-label">Send to</span><select class="select" id="audience">' +
          '<option value="week"' + (state.audience === 'week' ? ' selected' : '') + '>Everyone on the schedule</option>' +
          '<option value="day"' + (state.audience === 'day' ? ' selected' : '') + '>A single day</option>' +
          '<option value="open"' + (state.audience === 'open' ? ' selected' : '') + '>People qualified for open shifts</option>' +
        '</select></label>' +
        '<label class="field"><span class="field-label">From</span><input class="input" id="dateFrom" value="' + state.from + '"></label>' +
        '<label class="field"><span class="field-label">To</span><input class="input" id="dateTo" value="' + state.to + '"></label>' +
      '</div>';
    }
    if (key === 'channels') {
      var people = selectedPeople();
      var reach = activeChannels().map(function (ch) {
        var s = C.reachSummary(people, ch);
        var label = ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'In-app push';
        var reasons = Object.keys(s.reasons).map(function (r) {
          return s.reasons[r] + ' ' + r.charAt(0).toLowerCase() + r.slice(1);
        }).join(', ');
        var tone = s.blocked ? 'var(--warning-text)' : 'var(--success-text)';
        return '<div style="display:flex;align-items:baseline;gap:var(--space-2);padding:2px 0;">' +
          '<span class="t-2 fw-medium" style="color:' + tone + ';min-width:140px;">' + label + ': ' + s.reached + ' of ' + s.total + '</span>' +
          (reasons ? '<span class="t-1" style="color:var(--fg-low);">' + C.esc(reasons) + '</span>' : '') + '</div>';
      }).join('');
      return '<div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-3);">' +
          ['sms', 'email', 'push'].map(function (ch) {
            var label = ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'In-app push';
            return '<label class="checkbox"><input type="checkbox" data-channel="' + ch + '"' + (state.channels[ch] ? ' checked' : '') + '> ' + label + '</label>';
          }).join('') +
        '</div>' +
        '<div class="callout"><div style="display:flex;flex-direction:column;">' +
          '<div class="t-2 fw-medium" style="color:var(--fg-high);margin-bottom:var(--space-1);">Who this actually reaches</div>' + reach +
        '</div></div>';
    }
    if (key === 'sms') {
      var r = C.segmentRange(state.sms, selectedPeople());
      var lenNow = C.render(state.sms, previewPerson()).length;
      var seg = !state.sms ? '0 characters'
        : lenNow + ' characters after merge fields &middot; ' +
          (r.min === r.max ? r.min + ' segment' + (r.min === 1 ? '' : 's') : r.min + ' to ' + r.max + ' segments') +
          (r.max > 1 ? ' <span style="color:var(--warning-text);">billed per segment</span>' : '');
      return '<label class="field"><span class="field-label">Message</span>' +
        '<textarea class="textarea" id="smsBody" rows="4" placeholder="Keep it short. SMS is billed per 160 characters.">' + C.esc(state.sms) + '</textarea></label>' +
        '<div style="display:flex;align-items:flex-start;gap:var(--space-3);margin-top:var(--space-1);">' +
          '<div style="flex:1;">' + tokenRowHTML('smsBody') + '</div>' +
          '<span class="t-1" style="color:var(--fg-low);text-align:right;min-width:220px;">' + seg + '</span>' +
        '</div>';
    }
    if (key === 'email') {
      return '<label class="field" style="margin-bottom:var(--space-2);"><span class="field-label">Subject</span>' +
        '<input class="input" id="emailSubject" value="' + C.esc(state.emailSubject) + '"></label>' +
        tokenRowHTML('emailSubject') +
        '<label class="field" style="margin-top:var(--space-4);"><span class="field-label">Body</span>' +
        '<textarea class="textarea" id="emailBody" rows="7">' + C.esc(state.emailBody) + '</textarea></label>' +
        tokenRowHTML('emailBody');
    }
    if (key === 'recipients') {
      var q = state.search.trim().toLowerCase();
      var list = C.PEOPLE.filter(function (p) { return !q || (p.name + ' ' + p.position).toLowerCase().indexOf(q) > -1; });
      return '<div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);">' +
          '<div class="search" style="flex:1;"><span class="search-icon">' + C.icon(C.I.search) + '</span>' +
            '<input class="input" id="rcptSearch" placeholder="Search recipients" value="' + C.esc(state.search) + '"></div>' +
          '<button class="btn btn-ghost is-sm" id="selectAll">Select all</button>' +
          '<button class="btn btn-ghost is-sm" id="clearAll">Clear</button>' +
        '</div>' +
        '<div style="box-shadow:inset 0 0 0 1px var(--border-subtle);border-radius:var(--radius-3);max-height:320px;overflow:auto;">' +
        list.map(function (p) {
          var checked = state.selected.indexOf(p.id) > -1;
          var pills = activeChannels().map(function (ch) {
            var rr = C.reachFor(p, ch);
            var label = ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'Push';
            return '<span class="ch-pill ' + (rr.ok ? 'is-on' : 'is-blocked') + '"' + (rr.ok ? '' : ' title="' + C.esc(rr.reason) + '"') + '>' + label + '</span>';
          }).join(' ');
          return '<div class="rcpt' + (p.id === state.previewId ? ' is-previewing' : '') + '">' +
            '<label class="checkbox"><input type="checkbox" data-pick="' + p.id + '"' + (checked ? ' checked' : '') + ' aria-label="Include ' + C.esc(p.name) + '"></label>' +
            C.avatarHTML(p, 28) +
            '<div class="rcpt-main"><div class="t-2 fw-medium" style="color:var(--fg-high);">' + C.esc(p.name) +
              ' <span class="t-1" style="color:var(--fg-low);font-weight:400;">' + C.esc(p.position) + '</span></div>' +
              '<div class="t-1" style="color:var(--fg-subtle);">' + C.esc(p.shiftDate) + ', ' + C.esc(p.shiftWindow) + '</div></div>' +
            '<div style="display:flex;gap:4px;">' + pills + '</div>' +
            '<button class="btn btn-ghost is-sm" data-preview-as="' + p.id + '">Preview</button></div>';
        }).join('') + '</div>';
    }
    if (key === 'when') {
      return '<div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-3);">' +
          '<label class="radio"><input type="radio" name="sendMode" value="now"' + (state.sendMode === 'now' ? ' checked' : '') + '> Send now</label>' +
          '<label class="radio"><input type="radio" name="sendMode" value="later"' + (state.sendMode === 'later' ? ' checked' : '') + '> Schedule for later</label>' +
        '</div>' +
        (state.sendMode === 'later'
          ? '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);max-width:420px;">' +
              '<label class="field"><span class="field-label">Date</span><input class="input" id="schedDate" value="' + state.schedDate + '"></label>' +
              '<label class="field"><span class="field-label">Time</span><input class="input" id="schedTime" value="' + state.schedTime + '"></label>' +
            '</div>'
          : '');
    }
    return '';
  }

  function tokenRowHTML(target) {
    return '<div class="token-row">' + C.TOKENS.map(function (t) {
      return '<button type="button" class="token" data-token="' + t + '" data-target="' + target + '">{' + t + '}</button>';
    }).join('') + '</div>';
  }

  function stateIcon(s) {
    if (s === 'done') return '<span style="color:var(--success-solid);flex:none;">' + C.icon(C.I.check, 20) + '</span>';
    if (s === 'error') return '<span style="color:var(--danger-solid);flex:none;">' + C.icon(C.I.warn, 20) + '</span>';
    return '<span style="color:var(--gray-7);flex:none;">' + C.icon('<circle cx="12" cy="12" r="10" />', 20) + '</span>';
  }

  function previewHTML() {
    var p = previewPerson();
    var out = '<div class="card" style="padding:var(--space-4);">' +
      '<div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);">' +
        '<span class="t-4 fw-bold">Preview</span><span style="flex:1;"></span>' +
        '<select class="select" id="previewPicker" style="width:auto;max-width:170px;">' +
          selectedPeople().map(function (x) {
            return '<option value="' + x.id + '"' + (x.id === p.id ? ' selected' : '') + '>' + C.esc(x.name) + '</option>';
          }).join('') + '</select></div>' +
      '<p class="t-1" style="color:var(--fg-low);margin-bottom:var(--space-3);">What ' + C.esc(p.first) + ' receives, merge fields filled in.</p>';
    if (state.channels.sms || state.channels.push) {
      var t = C.render(state.sms, p);
      out += '<div class="t-1 fw-medium" style="color:var(--fg-low);margin-bottom:var(--space-1);">SMS' + (state.channels.push ? ' and push' : '') + '</div>' +
        '<div class="sms-bubble"' + (t.trim() ? '' : ' style="color:var(--fg-subtle);font-style:italic;"') + '>' +
        (t.trim() ? C.esc(t) : 'Nothing to preview yet.') + '</div><div style="height:var(--space-3);"></div>';
    }
    if (state.channels.email) {
      out += '<div class="t-1 fw-medium" style="color:var(--fg-low);margin-bottom:var(--space-1);">Email</div>' +
        '<div class="email-frame"><div class="email-subject">' +
          (state.emailSubject.trim() ? C.esc(C.render(state.emailSubject, p)) : '<span style="color:var(--fg-subtle);font-style:italic;">No subject</span>') + '</div>' +
        '<div class="email-body">' +
          (state.emailBody.trim() ? C.esc(C.render(state.emailBody, p)) : '<span style="color:var(--fg-subtle);font-style:italic;">No body</span>') + '</div></div>';
    }
    return out + '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-4);">' +
      '<button class="btn btn-surface is-sm" id="testBtn" style="flex:1;justify-content:center;">Send a test to myself</button></div></div>';
  }

  function render() {
    if (document.getElementById('composeScreen').hidden) return;
    var r = readiness();

    document.getElementById('composeScreen').innerHTML =
      '<div class="compose-modal" role="dialog" aria-modal="true" aria-label="Compose message">' +
      '<div class="compose-bar">' +
        '<input class="input" id="msgTitle" value="' + C.esc(state.title) + '" style="max-width:300px;font-weight:var(--weight-medium);">' +
        '<span class="badge is-neutral">Draft</span>' +
        (state.savedAt ? '<span class="t-1" style="color:var(--fg-subtle);">Saved ' + C.esc(state.savedAt) + '</span>' : '') +
        '<span style="flex:1;"></span>' +
        '<button class="btn btn-ghost is-sm is-icon" id="closeCompose" aria-label="Close">' + C.icon(C.I.x) + '</button>' +
      '</div>' +

      '<div class="compose-body">' +
      '<div style="display:grid;grid-template-columns:1fr 340px;gap:var(--space-5);align-items:start;">' +
      '<div>' +
        '<section class="card" style="padding:var(--space-4);margin-bottom:var(--space-4);">' +
          '<div style="display:flex;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-2);">' +
            '<span class="t-2 fw-medium" style="color:var(--fg-high);">' + r.done + ' of ' + r.total + ' ready</span>' +
            (r.blocked ? '<span class="t-1" style="color:var(--danger-text);">Fix the items marked below to send</span>'
                       : '<span class="t-1" style="color:var(--success-text);">Ready to review</span>') +
          '</div>' +
          '<div style="display:flex;gap:4px;">' +
            r.rows.map(function (row) {
              var bg = row.state === 'done' ? 'var(--success-solid)' : row.state === 'error' ? 'var(--danger-solid)' : 'var(--gray-5)';
              return '<div style="flex:1;height:6px;border-radius:var(--radius-full);background:' + bg + ';"></div>';
            }).join('') +
          '</div>' +
        '</section>' +

        '<section class="card" style="padding:0;">' +
          r.rows.map(function (row, i) {
            var isOpen = openRow === row.key;
            return '<div style="border-bottom:' + (i === r.rows.length - 1 ? '0' : '1px solid var(--border-subtle)') + ';">' +
              '<button class="check-row" data-row="' + row.key + '" aria-expanded="' + isOpen + '">' +
                stateIcon(row.state) +
                '<span style="flex:1;min-width:0;text-align:left;">' +
                  '<span class="t-2 fw-medium" style="color:var(--fg-high);display:block;">' + row.label + '</span>' +
                  '<span class="t-1" style="color:' + (row.state === 'error' ? 'var(--danger-text)' : 'var(--fg-low)') + ';">' + C.esc(row.summary) + '</span>' +
                '</span>' +
                '<span class="t-1" style="color:var(--fg-low);flex:none;">' + (isOpen ? 'Close' : 'Edit') + '</span>' +
              '</button>' +
              (row.problems.length
                ? '<div style="padding:0 var(--space-4) var(--space-3) ' + (isOpen ? 'var(--space-4)' : '52px') + ';">' +
                  row.problems.map(function (p) { return '<div class="t-1" style="color:var(--danger-text);">' + C.esc(p) + '</div>'; }).join('') + '</div>'
                : '') +
              (isOpen ? '<div style="padding:0 var(--space-4) var(--space-4);">' + editorHTML(row.key) + '</div>' : '') +
            '</div>';
          }).join('') +
        '</section>' +
      '</div>' +
      '<div>' + previewHTML() + '</div>' +
      '</div></div>' +

      '<div class="compose-foot">' +
        (r.blocked ? '<span class="t-1" style="color:var(--danger-text);">' + (r.total - r.done) + ' item' + ((r.total - r.done) === 1 ? '' : 's') + ' still need attention</span>' : '') +
        '<span style="flex:1;"></span>' +
        '<button class="btn btn-soft" id="finishLater">Finish later</button>' +
        '<button class="btn btn-solid" id="reviewBtn"' + (r.blocked ? ' disabled' : '') + '>' + C.icon(C.I.send) + ' Review and send</button>' +
      '</div>' +
      '</div>';

    wire();
  }

  function wire() {
    // Compose now lives in the full-screen container, not the old tab panel.
    var panel = document.getElementById('composeScreen');

    panel.querySelectorAll('[data-row]').forEach(function (b) {
      b.addEventListener('click', function () {
        openRow = openRow === b.getAttribute('data-row') ? null : b.getAttribute('data-row');
        render();
      });
    });

    function bindText(id, key) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', function () {
        state[key] = el.value;
        focusRef = { id: id, pos: el.selectionStart };
        render();
      });
    }
    bindText('smsBody', 'sms');
    bindText('emailSubject', 'emailSubject');
    bindText('emailBody', 'emailBody');
    bindText('msgTitle', 'title');

    if (focusRef) {
      var f = document.getElementById(focusRef.id);
      if (f) { f.focus(); try { f.setSelectionRange(focusRef.pos, focusRef.pos); } catch (e) {} }
      focusRef = null;
    }

    panel.querySelectorAll('[data-channel]').forEach(function (cb) {
      cb.addEventListener('change', function () { state.channels[cb.getAttribute('data-channel')] = cb.checked; render(); });
    });
    panel.querySelectorAll('[data-token]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-target');
        var el = document.getElementById(targetId);
        if (!el) return;
        var tok = '{' + btn.getAttribute('data-token') + '}';
        var s = el.selectionStart || el.value.length, e = el.selectionEnd || el.value.length;
        el.value = el.value.slice(0, s) + tok + el.value.slice(e);
        state[targetId === 'smsBody' ? 'sms' : targetId === 'emailSubject' ? 'emailSubject' : 'emailBody'] = el.value;
        focusRef = { id: targetId, pos: s + tok.length };
        render();
      });
    });
    ['audience', 'dateFrom', 'dateTo', 'schedDate', 'schedTime'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        if (id === 'audience') state.audience = el.value;
        if (id === 'dateFrom') state.from = el.value;
        if (id === 'dateTo') state.to = el.value;
        if (id === 'schedDate') state.schedDate = el.value;
        if (id === 'schedTime') state.schedTime = el.value;
        render();
      });
    });
    panel.querySelectorAll('[name="sendMode"]').forEach(function (rb) {
      rb.addEventListener('change', function () { if (rb.checked) { state.sendMode = rb.value; render(); } });
    });
    panel.querySelectorAll('[data-pick]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var id = Number(cb.getAttribute('data-pick'));
        var i = state.selected.indexOf(id);
        if (i > -1) state.selected.splice(i, 1); else state.selected.push(id);
        if (state.selected.indexOf(state.previewId) === -1 && state.selected.length) state.previewId = state.selected[0];
        render();
      });
    });
    panel.querySelectorAll('[data-preview-as]').forEach(function (b) {
      b.addEventListener('click', function () { state.previewId = Number(b.getAttribute('data-preview-as')); render(); });
    });
    var pp = document.getElementById('previewPicker');
    if (pp) pp.addEventListener('change', function () { state.previewId = Number(pp.value); render(); });
    var sa = document.getElementById('selectAll');
    if (sa) sa.addEventListener('click', function () { state.selected = C.PEOPLE.map(function (p) { return p.id; }); render(); });
    var ca = document.getElementById('clearAll');
    if (ca) ca.addEventListener('click', function () { state.selected = []; render(); });
    var rs = document.getElementById('rcptSearch');
    if (rs) rs.addEventListener('input', function () {
      state.search = rs.value; focusRef = { id: 'rcptSearch', pos: rs.selectionStart }; render();
    });

    document.getElementById('closeCompose').addEventListener('click', closeCompose);
    document.getElementById('finishLater').addEventListener('click', function () { saveDraft(); closeCompose(); });
    var rb2 = document.getElementById('reviewBtn');
    if (rb2) rb2.addEventListener('click', openReview);
    var tb = document.getElementById('testBtn');
    if (tb) tb.addEventListener('click', function () {
      C.showToast('Test sent to you', 'Check your inbox and phone before sending to the group.');
    });
  }

  // ---- Drafts ----
  function saveDraft() {
    state.savedAt = 'Jul 27 at 3:52 PM';
    var payload = {
      status: 'draft', title: state.title,
      sentAt: 'Edited ' + state.savedAt,
      sender: 'Sumit Awinash', senderAvatar: 'c2', senderInitials: 'SA',
      audience: 'Schedule, ' + state.from + ' to ' + state.to,
      templateName: state.templateName,
      renderedSample: state.sms.trim() ? C.render(state.sms, previewPerson()) : '(no message yet)',
      recipients: state.selected.length,
      channels: { sms: { sent: 0, delivered: 0, failed: 0 }, email: { sent: 0, delivered: 0, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } },
      snapshot: JSON.parse(JSON.stringify(state))
    };
    if (draft) { Object.assign(draft, payload); }
    else { payload.id = Date.now(); C.MESSAGES.unshift(payload); draft = payload; }
    document.getElementById('historyCount').textContent = C.MESSAGES.length;
    if (window.CommsLog) window.CommsLog.renderMessages();
    C.showToast('Draft saved', 'Pick it up from Messages whenever you are ready.');
    render();
  }

  function openCompose() {
    var screen = document.getElementById('composeScreen');
    if (!screen.dataset.scrimWired) {
      screen.addEventListener('click', function (e) {
        // Clicking the backdrop is too easy to do by accident with a form this
        // large, so it does not close. Use the X, Finish later, or Escape.
        if (e.target === screen) e.stopPropagation();
      });
      screen.dataset.scrimWired = '1';
    }
    screen.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
  }
  function closeCompose() {
    document.getElementById('composeScreen').hidden = true;
    document.body.style.overflow = '';
    // Land back on Messages, where the draft or sent item now lives.
    var t = document.querySelector('.tab[data-comm-tab="history"]');
    if (t) t.click();
  }
  function resumeDraft(entry) {
    draft = entry;
    state = Object.assign(blankState(), entry.snapshot || {});
    openRow = null;
    openCompose();
  }

  // ---- Review gate (unchanged in spirit: the last stop before sending) ----
  function openReview() {
    var people = selectedPeople();
    var p = previewPerson();
    var rows = activeChannels().map(function (ch) {
      var s = C.reachSummary(people, ch);
      var label = ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'In-app push';
      var extra = '';
      if (ch === 'sms') {
        var r = C.segmentRange(state.sms, people.filter(function (x) { return C.reachFor(x, 'sms').ok; }));
        var lo = r.min * s.reached, hi = r.max * s.reached;
        extra = lo === hi ? lo + ' segments billed' : lo + ' to ' + hi + ' segments billed';
      }
      return '<div style="display:flex;align-items:baseline;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--border-subtle);">' +
        '<span class="t-2 fw-medium" style="color:var(--fg-high);min-width:110px;">' + label + '</span>' +
        '<span class="t-2" style="color:var(--fg-high);">' + s.reached + ' of ' + s.total + '</span>' +
        '<span style="flex:1;"></span><span class="t-1" style="color:var(--fg-low);">' + extra + '</span></div>';
    }).join('');

    C.overlay().innerHTML =
      '<div class="modal" style="padding:var(--space-5);max-width:620px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">' +
          '<span class="t-5 fw-bold">Review before sending</span>' +
          '<button class="btn btn-ghost is-sm is-icon" data-close aria-label="Close">' + C.icon(C.I.x) + '</button></div>' +
        '<p class="t-2" style="color:var(--fg-low);margin-bottom:var(--space-4);">' +
          (state.sendMode === 'now' ? 'Messages cannot be recalled once sent. This is what goes out.'
                                     : 'This will be queued and sent automatically. You can cancel it from Messages until it goes.') + '</p>' +
        '<div class="t-1 fw-medium" style="color:var(--fg-low);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-2);">Delivery</div>' +
        '<div style="margin-bottom:var(--space-4);">' + rows + '</div>' +
        '<div class="t-1 fw-medium" style="color:var(--fg-low);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-2);">Sample, as ' + C.esc(p.name) + ' sees it</div>' +
        ((state.channels.sms || state.channels.push) ? '<div class="sms-bubble" style="margin-bottom:var(--space-3);">' + C.esc(C.render(state.sms, p)) + '</div>' : '') +
        (state.channels.email ? '<div class="email-frame" style="margin-bottom:var(--space-4);">' +
          '<div class="email-subject">' + C.esc(C.render(state.emailSubject, p)) + '</div>' +
          '<div class="email-body">' + C.esc(C.render(state.emailBody, p)) + '</div></div>' : '') +
        '<div class="t-1 fw-medium" style="color:var(--fg-low);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-1);">When</div>' +
        '<div class="t-2" style="color:var(--fg-high);margin-bottom:var(--space-2);">' +
          (state.sendMode === 'now' ? 'Immediately' : state.schedDate + ' at ' + state.schedTime) + '</div>' +
        '<div class="dialog-footer">' +
          '<button class="btn btn-soft" data-close>Back to editing</button>' +
          '<button class="btn btn-solid" id="confirmSend">' +
            (state.sendMode === 'now' ? 'Send to ' + people.length + ' people' : 'Schedule for ' + people.length + ' people') + '</button>' +
        '</div></div>';
    C.overlay().hidden = false;
    C.overlay().querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', C.closeModal); });

    document.getElementById('confirmSend').addEventListener('click', function () {
      var later = state.sendMode === 'later';
      var entry = draft || { id: Date.now() };
      Object.assign(entry, {
        status: later ? 'scheduled' : 'sent',
        title: state.title,
        sentAt: later ? 'Scheduled for ' + state.schedDate + ' at ' + state.schedTime : 'Mon, Jul 27 at 3:41 PM',
        sender: 'Sumit Awinash', senderAvatar: 'c2', senderInitials: 'SA',
        audience: 'Schedule, ' + state.from + ' to ' + state.to,
        templateName: state.templateName,
        renderedSample: C.render(state.sms || state.emailSubject, p),
        recipients: people.length,
        snapshot: JSON.parse(JSON.stringify(state)),
        channels: { sms: chanStat(people, 'sms'), email: chanStat(people, 'email'), push: chanStat(people, 'push') }
      });
      if (!draft) C.MESSAGES.unshift(entry);
      draft = null;
      document.getElementById('historyCount').textContent = C.MESSAGES.length;
      if (window.CommsLog) window.CommsLog.renderMessages();
      C.closeModal();
      C.showToast(later ? 'Message scheduled' : 'Message sent',
        later ? 'Queued for ' + people.length + ' people. Cancel it from Messages any time before it goes.'
              : 'Delivered to ' + people.length + ' people across ' + activeChannels().length + ' channels.');
      state = blankState();
      openRow = null;
      closeCompose();
    });
  }

  function chanStat(people, ch) {
    if (!state.channels[ch]) return { sent: 0, delivered: 0, failed: 0 };
    var n = people.filter(function (x) { return C.reachFor(x, ch).ok; }).length;
    return { sent: n, delivered: n, failed: 0 };
  }

  function loadTemplate(t) {
    state.sms = t.sms; state.emailSubject = t.emailSubject; state.emailBody = t.emailBody;
    state.templateName = t.name;
    state.title = t.name;
    openRow = 'sms';
    draft = null;
    openCompose();
  }

  window.CommsCompose = {
    open: function () { state = blankState(); draft = null; openRow = null; openCompose(); },
    resumeDraft: resumeDraft, loadTemplate: loadTemplate
  };
  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('openCompose').addEventListener('click', function () { window.CommsCompose.open(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !document.getElementById('composeScreen').hidden &&
          document.getElementById('modalOverlay').hidden) closeCompose();
    });
  });
})();
