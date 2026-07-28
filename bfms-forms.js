/* Add/Edit BFM and Availability.
   The availability dialog does exactly one job: this person (or, when opened
   from a bulk selection, that explicit set). Copying one person's hours onto
   others is a separate, named action rather than a mode toggle. */
(function () {
  'use strict';
  var A = window.BFMApp;
  var LOCATIONS = ['skypoint', 'community reflect', 'Sky Test', 'Demo Senior Living QA', 'QA Onboarding Test'];

  function overlay() { return document.getElementById('modalOverlay'); }
  function closeModal() { var o = overlay(); o.hidden = true; o.innerHTML = ''; }

  function positionOptions(selected) {
    return '<option value="">Pick a position</option>' + A.POSITION_GROUPS.map(function (g) {
      return '<optgroup label="' + A.esc(g.group) + '">' + g.positions.map(function (p) {
        return '<option' + (p === selected ? ' selected' : '') + '>' + A.esc(p) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }

  function secondaryCheckboxes(selected, primary) {
    return A.POSITION_GROUPS.map(function (g) {
      return '<div class="t-1" style="color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.04em;margin:var(--space-2) 0 var(--space-1);">' + A.esc(g.group) + '</div>' +
        g.positions.map(function (p) {
          var dis = p === primary;
          return '<label class="checkbox" style="display:flex;padding:2px 0;' + (dis ? 'opacity:.45;' : '') + '">' +
            '<input type="checkbox" class="sec-pos" value="' + A.esc(p) + '"' +
            (selected.indexOf(p) > -1 ? ' checked' : '') + (dis ? ' disabled' : '') + '> ' + A.esc(p) +
            (dis ? ' <span class="t-1" style="color:var(--fg-subtle);">(primary)</span>' : '') + '</label>';
        }).join('');
    }).join('');
  }

  // ---- Add / Edit BFM ----
  function openForm(bfm) {
    var isEdit = !!bfm;
    var b = bfm || { first: '', last: '', email: '', phone: '', empId: '', primary: '', secondary: [], employment: '', location: 'skypoint', sms: false, nonApp: false };

    overlay().innerHTML =
      '<div class="modal" style="padding:var(--space-5);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">' +
          '<span class="t-5 fw-bold">' + (isEdit ? 'Edit ' + A.esc(A.fullName(b)) : 'Add BFM') + '</span>' +
          '<button class="btn btn-ghost is-sm is-icon" data-close aria-label="Close">' + A.icon(A.I.x) + '</button>' +
        '</div>' +

        '<div class="t-1" style="color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-2);">Identity</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">' +
          '<label class="field"><span class="field-label">First name <span class="req">*</span></span><input class="input" id="fFirst" value="' + A.esc(b.first) + '"><span class="field-hint is-error" id="eFirst" hidden>Enter a first name</span></label>' +
          '<label class="field"><span class="field-label">Last name <span class="req">*</span></span><input class="input" id="fLast" value="' + A.esc(b.last) + '"><span class="field-hint is-error" id="eLast" hidden>Enter a last name</span></label>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">' +
          '<label class="field"><span class="field-label">Email <span class="req">*</span></span><input class="input" id="fEmail" placeholder="name@example.com" value="' + A.esc(b.email) + '"><span class="field-hint is-error" id="eEmail" hidden>Enter a valid email address</span></label>' +
          '<label class="field"><span class="field-label">Employee ID</span><input class="input" id="fEmpId" placeholder="Payroll or ADP ID" value="' + A.esc(b.empId) + '"><span class="field-hint">Optional. Used to match payroll records.</span></label>' +
        '</div>' +

        '<div class="t-1" style="color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-2);">Contact</div>' +
        '<label class="field" style="margin-bottom:var(--space-2);"><span class="field-label">Mobile phone</span><input class="input" id="fPhone" placeholder="+1 555 000 0000" value="' + A.esc(b.phone) + '"></label>' +
        '<label class="checkbox" style="margin-bottom:var(--space-1);"><input type="checkbox" id="fSms"' + (b.sms ? ' checked' : '') + '> Send shift notifications by SMS</label>' +
        '<p class="field-hint" id="smsHint" style="margin-bottom:var(--space-4);">Texts this person when shifts are assigned or changed. Needs a mobile number.</p>' +

        '<div class="t-1" style="color:var(--fg-subtle);text-transform:uppercase;letter-spacing:.04em;margin-bottom:var(--space-2);">Scheduling</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-4);">' +
          '<label class="field"><span class="field-label">Primary location <span class="req">*</span></span><select class="select" id="fLocation">' +
            LOCATIONS.map(function (l) { return '<option' + (l === (b.location || 'skypoint') ? ' selected' : '') + '>' + A.esc(l) + '</option>'; }).join('') +
          '</select></label>' +
          '<label class="field"><span class="field-label">Employment status <span class="req">*</span></span><select class="select" id="fEmployment">' +
            '<option value="">Pick a status</option>' +
            ['Full-time', 'Part-time', 'Agency'].map(function (s) { return '<option' + (s === b.employment ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
          '</select><span class="field-hint is-error" id="eEmployment" hidden>Pick an employment status</span></label>' +
        '</div>' +
        '<label class="field" style="margin-bottom:var(--space-4);"><span class="field-label">Primary position <span class="req">*</span></span>' +
          '<select class="select" id="fPrimary">' + positionOptions(b.primary) + '</select>' +
          '<span class="field-hint is-error" id="ePrimary" hidden>Pick a primary position</span></label>' +

        '<div class="field-label" style="margin-bottom:2px;">Secondary positions <span class="t-1" style="color:var(--fg-low);font-weight:400;" id="secCount"></span></div>' +
        '<p class="field-hint" style="margin-bottom:var(--space-2);">Other positions this person can be scheduled for.</p>' +
        '<div id="secBox" style="box-shadow:inset 0 0 0 1px var(--border-ui);border-radius:var(--radius-3);padding:var(--space-2) var(--space-3);margin-bottom:var(--space-4);">' +
          secondaryCheckboxes(b.secondary, b.primary) +
        '</div>' +

        '<label class="checkbox" style="margin-bottom:var(--space-1);"><input type="checkbox" id="fNonApp"' + (b.nonApp ? ' checked' : '') + '> This person does not use the mobile app</label>' +
        '<p class="field-hint">Schedulers will contact them directly instead of sending in-app shift offers.</p>' +

        '<div class="dialog-footer">' +
          '<button class="btn btn-soft" data-close>Cancel</button>' +
          '<button class="btn btn-solid" id="fSubmit">' + (isEdit ? 'Save changes' : 'Add BFM') + '</button>' +
        '</div>' +
      '</div>';
    overlay().hidden = false;

    function updateSecCount() {
      var n = overlay().querySelectorAll('.sec-pos:checked').length;
      document.getElementById('secCount').textContent = n ? '(' + n + ' selected)' : '';
    }
    updateSecCount();
    overlay().addEventListener('change', function (e) { if (e.target.classList.contains('sec-pos')) updateSecCount(); });

    // Primary position is never also a secondary one.
    document.getElementById('fPrimary').addEventListener('change', function (e) {
      var selected = Array.prototype.map.call(overlay().querySelectorAll('.sec-pos:checked'), function (c) { return c.value; });
      document.getElementById('secBox').innerHTML = secondaryCheckboxes(selected, e.target.value);
      updateSecCount();
      document.getElementById('ePrimary').hidden = true;
    });

    // SMS depends on a phone number being present.
    var sms = document.getElementById('fSms'), phone = document.getElementById('fPhone'), smsHint = document.getElementById('smsHint');
    function syncSms() {
      var hasPhone = phone.value.trim() !== '';
      sms.disabled = !hasPhone;
      if (!hasPhone) sms.checked = false;
      smsHint.textContent = hasPhone
        ? 'Texts this person when shifts are assigned or changed.'
        : 'Add a mobile number to enable SMS notifications.';
      smsHint.classList.toggle('is-error', false);
    }
    phone.addEventListener('input', syncSms);
    syncSms();

    overlay().querySelectorAll('[data-close]').forEach(function (btn) { btn.addEventListener('click', closeModal); });

    document.getElementById('fSubmit').addEventListener('click', function () {
      var first = document.getElementById('fFirst').value.trim();
      var last = document.getElementById('fLast').value.trim();
      var email = document.getElementById('fEmail').value.trim();
      var primary = document.getElementById('fPrimary').value;
      var employment = document.getElementById('fEmployment').value;
      var ok = true;
      function flag(id, bad) { document.getElementById(id).hidden = !bad; if (bad) ok = false; }
      flag('eFirst', !first);
      flag('eLast', !last);
      flag('eEmail', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
      flag('ePrimary', !primary);
      flag('eEmployment', !employment);

      // Duplicate email guard
      var dupe = A.BFMS.filter(function (x) { return x.email.toLowerCase() === email.toLowerCase() && (!isEdit || x.id !== b.id); })[0];
      if (dupe && ok) {
        var ee = document.getElementById('eEmail');
        ee.textContent = A.fullName(dupe) + ' already uses this email address';
        ee.hidden = false;
        ok = false;
      }
      if (!ok) return;

      var secondary = Array.prototype.map.call(overlay().querySelectorAll('.sec-pos:checked'), function (c) { return c.value; });
      if (isEdit) {
        Object.assign(b, {
          first: first, last: last, email: email, empId: document.getElementById('fEmpId').value.trim(),
          phone: phone.value.trim(), primary: primary, secondary: secondary, employment: employment,
          initials: (first[0] || '') + (last[0] || '')
        });
        A.showToast('Changes saved', A.fullName(b) + ' updated.');
      } else {
        var id = Math.max.apply(null, A.BFMS.map(function (x) { return x.id; })) + 1;
        A.BFMS.push({
          id: id, first: first, last: last, email: email, phone: phone.value.trim(),
          empId: document.getElementById('fEmpId').value.trim(),
          avatar: 'c' + ((id % 8) + 1), initials: (first[0] || '').toUpperCase() + (last[0] || '').toUpperCase(),
          primary: primary, secondary: secondary, employment: employment, account: 'active',
          joined: 'Jul 27, 2026', minHrs: 16, maxHrs: 40, avail: A.cloneAvail(), timeOff: []
        });
        A.showToast('BFM added', first + ' ' + last + ' can now be scheduled at skypoint.');
      }
      closeModal();
      A.renderTable();
    });
  }

  // ---- Availability ----
  function availRowsHTML(avail) {
    return avail.map(function (d, i) {
      return '<div class="avail-row' + (d.on ? '' : ' is-off') + '" data-day="' + i + '">' +
        '<span class="t-2 fw-medium" style="color:var(--fg-high);">' + d.day + '</span>' +
        '<label class="switch"><input type="checkbox" class="av-on"' + (d.on ? ' checked' : '') + ' aria-label="' + d.day + ' available"></label>' +
        '<span class="avail-times"><input class="input av-from" style="width:110px;" value="' + d.from + '"> ' +
          '<span class="t-1" style="color:var(--fg-low);">to</span> ' +
          '<input class="input av-to" style="width:110px;" value="' + d.to + '"></span>' +
        '<button class="btn btn-ghost is-sm" data-copy-day="' + i + '">Copy to all</button>' +
        '</div>';
    }).join('');
  }

  function openAvailability(bfmId, bulkIds) {
    var isBulk = Array.isArray(bulkIds) && bulkIds.length > 0;
    var people = isBulk ? bulkIds.map(A.byId).filter(Boolean) : [A.byId(bfmId)];
    var b = people[0];
    if (!b) return;
    // Bulk edits start from a neutral default, never from whichever row was clicked.
    var working = isBulk ? A.cloneAvail() : b.avail.map(function (d) { return Object.assign({}, d); });
    var workingTimeOff = isBulk ? [] : b.timeOff.slice();
    var minH = isBulk ? 32 : b.minHrs, maxH = isBulk ? 60 : b.maxHrs;

    var title = isBulk ? 'Set availability for ' + people.length + ' people' : 'Availability and time off';
    var scopeLine = isBulk
      ? '<div class="callout is-warning" style="margin-bottom:var(--space-4);"><span class="co-icon">' + A.icon(A.I.warn, 18) + '</span><div>This replaces the current availability at skypoint for: ' +
        A.esc(people.map(A.fullName).join(', ')) + '</div></div>'
      : '<p class="t-2" style="color:var(--fg-low);margin-bottom:var(--space-4);">Applies at skypoint. The scheduler keeps ' + A.esc(b.first) + '’s shifts inside these hours.</p>';

    overlay().innerHTML =
      '<div class="modal" style="padding:var(--space-5);">' +
        '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--space-3);margin-bottom:var(--space-3);">' +
          '<div><div class="t-5 fw-bold">' + A.esc(title) + '</div>' +
            (isBulk ? '' : '<div class="t-2" style="color:var(--fg-low);">' + A.esc(A.fullName(b)) + '</div>') + '</div>' +
          '<button class="btn btn-ghost is-sm is-icon" data-close aria-label="Close">' + A.icon(A.I.x) + '</button>' +
        '</div>' +
        scopeLine +

        '<div class="t-4 fw-bold" style="margin-bottom:var(--space-1);">Hours per week</div>' +
        '<p class="field-hint" style="margin-bottom:var(--space-3);">The range the scheduler will try to keep each week within.</p>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);margin-bottom:var(--space-5);">' +
          '<label class="field"><span class="field-label">Minimum</span><input class="input" id="avMin" value="' + minH + '"></label>' +
          '<label class="field"><span class="field-label">Maximum</span><input class="input" id="avMax" value="' + maxH + '"></label>' +
        '</div>' +
        '<p class="field-hint is-error" id="avHoursError" hidden style="margin-top:calc(-1 * var(--space-4));margin-bottom:var(--space-4);">Minimum cannot be higher than maximum.</p>' +

        '<div class="t-4 fw-bold" style="margin-bottom:var(--space-1);">Weekly availability</div>' +
        '<p class="field-hint" style="margin-bottom:var(--space-2);">Turn a day off to make it unavailable. For overnight windows, set an end time earlier than the start.</p>' +
        '<div id="availRows" style="margin-bottom:var(--space-5);">' + availRowsHTML(working) + '</div>' +

        (isBulk ? '' :
          '<div class="t-4 fw-bold" style="margin-bottom:var(--space-1);">Time off</div>' +
          '<p class="field-hint" style="margin-bottom:var(--space-2);">Dates this person cannot work. The scheduler will not offer overlapping shifts.</p>' +
          '<div id="timeOffList" style="margin-bottom:var(--space-3);"></div>' +
          // The hint lives under the whole row, not inside one field, so both
          // date columns stay the same height and their labels line up.
          '<div style="display:grid;grid-template-columns:1fr 1fr auto;gap:var(--space-3);align-items:end;">' +
            '<label class="field"><span class="field-label">Start date</span><input class="input" id="toStart" placeholder="DD/MM/YYYY"></label>' +
            '<label class="field"><span class="field-label">End date</span><input class="input" id="toEnd" placeholder="DD/MM/YYYY"></label>' +
            '<button class="btn btn-surface" id="toAdd">Add</button>' +
          '</div>' +
          '<p class="field-hint" style="margin-top:var(--space-1);">Leave the end date blank for a single day.</p>' +
          '<label class="field" style="margin-top:var(--space-3);"><span class="field-label">Reason</span><select class="select" id="toReason">' +
            '<option value="">Not specified</option><option>Vacation</option><option>Sick leave</option><option>Personal</option><option>Training</option>' +
          '</select></label>' +
          '<div id="toConflict"></div>') +

        '<div class="dialog-footer" style="justify-content:space-between;align-items:center;">' +
          (isBulk ? '<span></span>' : '<button class="btn btn-ghost is-sm" id="copyToOthers">' + A.icon(A.I.copy) + ' Copy availability to others</button>') +
          '<span style="display:flex;gap:var(--space-2);">' +
            '<button class="btn btn-soft" data-close>Cancel</button>' +
            '<button class="btn btn-solid" id="avSave">' + (isBulk ? 'Apply to ' + people.length + ' people' : 'Save availability') + '</button>' +
          '</span>' +
        '</div>' +
      '</div>';
    overlay().hidden = false;

    var rowsEl = document.getElementById('availRows');
    function syncFromDom() {
      rowsEl.querySelectorAll('.avail-row').forEach(function (row, i) {
        working[i].on = row.querySelector('.av-on').checked;
        working[i].from = row.querySelector('.av-from').value;
        working[i].to = row.querySelector('.av-to').value;
      });
    }
    rowsEl.addEventListener('change', function (e) {
      if (e.target.classList.contains('av-on')) {
        e.target.closest('.avail-row').classList.toggle('is-off', !e.target.checked);
        syncFromDom();
      }
    });
    rowsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy-day]');
      if (!btn) return;
      syncFromDom();
      var src = working[Number(btn.getAttribute('data-copy-day'))];
      working = working.map(function (d) { return { day: d.day, on: src.on, from: src.from, to: src.to }; });
      rowsEl.innerHTML = availRowsHTML(working);
      A.showToast('Copied to all days', src.from + ' to ' + src.to + ' applied to every day.');
    });

    // Time off (staged locally; nothing commits until Save)
    function renderTimeOff() {
      var el = document.getElementById('timeOffList');
      if (!el) return;
      el.innerHTML = workingTimeOff.length
        ? workingTimeOff.map(function (t, i) {
            return '<div class="hist-row"><div style="flex:1;"><div class="t-2" style="color:var(--fg-high);">' + A.esc(t.from) + ' to ' + A.esc(t.to) + '</div>' +
              (t.reason ? '<div class="t-1" style="color:var(--fg-low);">' + A.esc(t.reason) + '</div>' : '') + '</div>' +
              '<button class="btn btn-ghost is-sm is-icon" data-rm-to="' + i + '" aria-label="Remove time off">' + A.icon(A.I.trash) + '</button></div>';
          }).join('')
        : '<div class="t-2" style="color:var(--fg-subtle);">No time off scheduled.</div>';
      el.querySelectorAll('[data-rm-to]').forEach(function (btn) {
        btn.addEventListener('click', function () { workingTimeOff.splice(Number(btn.getAttribute('data-rm-to')), 1); renderTimeOff(); });
      });
    }
    renderTimeOff();

    var toAdd = document.getElementById('toAdd');
    if (toAdd) toAdd.addEventListener('click', function () {
      var s = document.getElementById('toStart').value.trim();
      var e2 = document.getElementById('toEnd').value.trim() || s;
      if (!s) { document.getElementById('toStart').focus(); return; }
      workingTimeOff.push({ from: s, to: e2, reason: document.getElementById('toReason').value });
      // Warn if this person already has shifts assigned in that window.
      var mine = A.UPCOMING.filter(function (u) { return u.bfmId === b.id; });
      var conflictEl = document.getElementById('toConflict');
      conflictEl.innerHTML = mine.length
        ? '<div class="callout is-warning" style="margin-top:var(--space-3);"><span class="co-icon">' + A.icon(A.I.warn, 18) + '</span>' +
          '<div><strong>' + mine.length + ' upcoming shift' + (mine.length === 1 ? '' : 's') + ' may overlap this time off.</strong> Review them on the schedule before saving.</div></div>'
        : '';
      document.getElementById('toStart').value = '';
      document.getElementById('toEnd').value = '';
      renderTimeOff();
    });

    var copyBtn = document.getElementById('copyToOthers');
    if (copyBtn) copyBtn.addEventListener('click', function () { syncFromDom(); openCopyTo(b, working); });

    overlay().querySelectorAll('[data-close]').forEach(function (btn) { btn.addEventListener('click', closeModal); });

    document.getElementById('avSave').addEventListener('click', function () {
      syncFromDom();
      var mn = parseInt(document.getElementById('avMin').value, 10) || 0;
      var mx = parseInt(document.getElementById('avMax').value, 10) || 0;
      if (mn > mx) { document.getElementById('avHoursError').hidden = false; return; }
      document.getElementById('avHoursError').hidden = true;
      people.forEach(function (p) {
        p.avail = working.map(function (d) { return Object.assign({}, d); });
        p.minHrs = mn; p.maxHrs = mx;
        if (!isBulk) p.timeOff = workingTimeOff.slice();
      });
      closeModal();
      A.state.selected = [];
      A.renderTable();
      A.showToast(isBulk ? 'Availability applied' : 'Availability saved',
        isBulk ? 'Updated for ' + people.length + ' people at skypoint.' : A.fullName(b) + ' updated at skypoint.');
    });
  }

  // ---- Copy one person's availability onto others (explicit, named action) ----
  function openCopyTo(source, availability) {
    var candidates = A.BFMS.filter(function (x) { return x.account !== 'deactivated' && x.id !== source.id; });
    overlay().innerHTML =
      '<div class="modal" style="padding:var(--space-5);max-width:560px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2);">' +
          '<span class="t-5 fw-bold">Copy availability to others</span>' +
          '<button class="btn btn-ghost is-sm is-icon" data-close aria-label="Close">' + A.icon(A.I.x) + '</button>' +
        '</div>' +
        '<p class="t-2" style="color:var(--fg-low);margin-bottom:var(--space-4);">Applies ' + A.esc(A.fullName(source)) + '’s weekly hours to the people you pick. It replaces their current availability at skypoint.</p>' +
        '<div class="scroll-area" style="max-height:300px;overflow:auto;box-shadow:inset 0 0 0 1px var(--border-ui);border-radius:var(--radius-3);padding:var(--space-2) var(--space-3);margin-bottom:var(--space-4);">' +
          candidates.map(function (c) {
            return '<label class="checkbox" style="display:flex;padding:4px 0;"><input type="checkbox" class="copy-target" value="' + c.id + '"> ' +
              A.avatarHTML(c, 24) + ' <span style="margin-left:6px;">' + A.esc(A.fullName(c)) + '</span> ' +
              '<span class="t-1" style="color:var(--fg-subtle);margin-left:6px;">' + A.esc(c.primary) + '</span></label>';
          }).join('') +
        '</div>' +
        '<div class="dialog-footer">' +
          '<button class="btn btn-soft" data-close>Cancel</button>' +
          '<button class="btn btn-solid" id="copyApply" disabled>Copy to 0 people</button>' +
        '</div>' +
      '</div>';
    overlay().hidden = false;

    var applyBtn = document.getElementById('copyApply');
    overlay().addEventListener('change', function () {
      var n = overlay().querySelectorAll('.copy-target:checked').length;
      applyBtn.textContent = 'Copy to ' + n + ' ' + (n === 1 ? 'person' : 'people');
      applyBtn.disabled = n === 0;
    });
    overlay().querySelectorAll('[data-close]').forEach(function (btn) { btn.addEventListener('click', closeModal); });
    applyBtn.addEventListener('click', function () {
      var ids = Array.prototype.map.call(overlay().querySelectorAll('.copy-target:checked'), function (c) { return Number(c.value); });
      ids.forEach(function (id) {
        var t = A.byId(id);
        t.avail = availability.map(function (d) { return Object.assign({}, d); });
      });
      closeModal();
      A.renderTable();
      A.showToast('Availability copied', 'Applied to ' + ids.length + ' ' + (ids.length === 1 ? 'person' : 'people') + ' at skypoint.');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay().hidden) closeModal();
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('addBfmBtn').addEventListener('click', function () { openForm(null); });
    document.getElementById('bulkAvailabilityBtn').addEventListener('click', function () {
      openAvailability(null, A.state.selected.slice());
    });
    overlay().addEventListener('click', function (e) { if (e.target === overlay()) closeModal(); });
  });

  window.BFMForms = {
    openAdd: function () { openForm(null); },
    openEdit: function (id) { openForm(A.byId(id)); },
    openAvailability: function (id) { openAvailability(id, null); }
  };
})();
