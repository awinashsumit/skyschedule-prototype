/* Profile drawer, row overflow menu, deactivate/restore.
   Deactivate is an alert dialog because it stops someone being schedulable and
   may strand assigned shifts. Restore is immediate with an undo toast, since
   it is reversible and low risk. */
(function () {
  'use strict';
  var A = window.BFMApp;

  function closeDrawer() {
    var d = document.getElementById('profileDrawer');
    d.hidden = true;
    d.innerHTML = '';
  }
  function closeAlert() {
    var o = document.getElementById('alertOverlay');
    o.hidden = true;
    o.innerHTML = '';
  }

  function stars(n) {
    if (!n) return '<span class="t-1" style="color:var(--fg-subtle);">Not rated</span>';
    var out = '';
    for (var i = 0; i < 5; i++) {
      var filled = i < n;
      // Earned stars are filled; the remainder stay as outlines.
      out += '<svg viewBox="0 0 24 24" width="13" height="13" fill="' + (filled ? 'var(--accent-9)' : 'none') +
        '" stroke="' + (filled ? 'var(--accent-9)' : 'var(--gray-7)') + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + A.I.star + '</svg>';
    }
    return '<span style="display:inline-flex;gap:1px;align-items:center;" title="' + n + ' out of 5">' + out +
      '<span class="t-1" style="color:var(--fg-low);margin-left:6px;">' + n + '.0</span></span>';
  }

  // A month of shifts is 10 to 14 rows, which turns the drawer into an endless
  // scroll. Show the most recent few and let the user expand in place. Expanding
  // in place (rather than a nested scroll region) keeps one scroll axis in the
  // drawer, and the header carries the true total so the cap is never misleading.
  var UPCOMING_CAP = 3;
  var HISTORY_CAP = 5;

  function shiftRowHTML(s, kind) {
    var trailing = kind === 'upcoming' ? '<span class="badge is-info">Assigned</span>' : stars(s.rating);
    return '<div class="hist-row"><div style="flex:1;min-width:0;">' +
      '<div class="t-2 fw-medium" style="color:var(--fg-high);">' + A.esc(s.when) + '</div>' +
      '<div class="t-1" style="color:var(--fg-low);">' + A.esc(s.time) + ' &middot; ' + A.esc(s.position) + '</div></div>' +
      trailing + '</div>';
  }

  function sectionHTML(title, list, cap, kind, emptyCopy) {
    var head = '<div style="display:flex;align-items:baseline;gap:var(--space-2);margin-bottom:var(--space-2);">' +
      '<span class="t-4 fw-bold">' + title + '</span>' +
      (list.length ? '<span class="t-1" style="color:var(--fg-low);">' + list.length + '</span>' : '') + '</div>';
    if (!list.length) {
      return head + '<div class="t-2" style="color:var(--fg-subtle);margin-bottom:var(--space-5);">' + emptyCopy + '</div>';
    }
    var shown = list.slice(0, cap).map(function (s) { return shiftRowHTML(s, kind); }).join('');
    var rest = list.slice(cap).map(function (s) { return shiftRowHTML(s, kind); }).join('');
    var more = list.length > cap
      ? '<div data-more="' + kind + '" hidden>' + rest + '</div>' +
        '<button class="btn btn-ghost is-sm" data-toggle-more="' + kind + '" style="margin-top:var(--space-2);" aria-expanded="false">' +
        'Show all ' + list.length + '</button>'
      : '';
    return head + '<div style="margin-bottom:var(--space-5);">' + shown + more + '</div>';
  }

  function openProfile(id) {
    var b = A.byId(id);
    if (!b) return;
    var upcoming = A.UPCOMING.filter(function (s) { return s.bfmId === b.id; });
    var history = A.HISTORY.filter(function (s) { return s.bfmId === b.id; });
    var rated = history.filter(function (h) { return h.rating; });
    var avgRating = rated.length ? (rated.reduce(function (s, h) { return s + h.rating; }, 0) / rated.length).toFixed(1) : '--';
    var hoursThisMonth = (history.length * 8);
    var workDays = b.avail.filter(function (d) { return d.on; });

    var alertHTML = b.alert
      ? '<div class="callout is-warning" style="margin-bottom:var(--space-4);"><span class="co-icon">' + A.icon(A.I.warn, 18) + '</span><div><strong>Certification expiring.</strong> ' + A.esc(b.alert) + '</div></div>'
      : '';
    var suspendedHTML = b.account === 'suspended'
      ? '<div class="callout is-warning" style="margin-bottom:var(--space-4);"><span class="co-icon">' + A.icon(A.I.warn, 18) + '</span><div><strong>Account suspended.</strong> ' + A.esc(b.accountNote || 'This person cannot be scheduled while suspended.') + '</div></div>'
      : '';
    var deactivatedHTML = b.account === 'deactivated'
      ? '<div class="callout" style="margin-bottom:var(--space-4);"><div>Deactivated on ' + A.esc(b.deactivatedOn) + '. Restore this person to schedule them again.</div></div>'
      : '';

    var d = document.getElementById('profileDrawer');
    d.innerHTML =
      '<div class="drawer-head">' +
        A.avatarHTML(b, 48) +
        '<div style="flex:1;min-width:0;">' +
          '<div class="t-5 fw-bold" style="color:var(--fg-high);">' + A.esc(A.fullName(b)) + '</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-top:var(--space-1);">' +
            '<span class="pos-primary">' + A.esc(b.primary) + '</span>' +
            b.secondary.map(function (p) { return '<span class="pos-secondary">' + A.esc(p) + '</span>'; }).join('') +
          '</div>' +
          '<div style="display:flex;gap:var(--space-2);margin-top:var(--space-2);">' +
            '<span class="badge is-neutral">' + A.esc(b.employment) + '</span>' + A.accountBadge(b) +
          '</div>' +
        '</div>' +
        '<button class="btn btn-ghost is-sm is-icon" data-close-drawer aria-label="Close profile">' + A.icon(A.I.x) + '</button>' +
      '</div>' +

      '<div style="padding-top:var(--space-4);">' +
        alertHTML + suspendedHTML + deactivatedHTML +

        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-5);">' +
          '<div class="stat-tile"><div class="st-val">' + history.length + '</div><div class="st-lab">Shifts this month</div></div>' +
          '<div class="stat-tile"><div class="st-val">' + hoursThisMonth + '</div><div class="st-lab">Hours this month</div></div>' +
          '<div class="stat-tile"><div class="st-val">' + avgRating + '</div><div class="st-lab">Average rating</div></div>' +
        '</div>' +

        '<div class="t-4 fw-bold" style="margin-bottom:var(--space-3);">Contact and details</div>' +
        '<div class="data-list" style="margin-bottom:var(--space-5);">' +
          '<span class="dl-label">Email</span><span class="dl-value">' + A.esc(b.email) + '</span>' +
          '<span class="dl-label">Mobile</span><span class="dl-value">' + A.esc(b.phone) + '</span>' +
          '<span class="dl-label">Employee ID</span><span class="dl-value">' + (b.empId ? A.esc(b.empId) : '<span style="color:var(--fg-subtle);">Not set</span>') + '</span>' +
          '<span class="dl-label">Primary location</span><span class="dl-value">skypoint</span>' +
          '<span class="dl-label">Joined</span><span class="dl-value">' + A.esc(b.joined) + '</span>' +
        '</div>' +

        '<div class="t-4 fw-bold" style="margin-bottom:var(--space-2);">Availability</div>' +
        '<div class="t-2" style="color:var(--fg-low);margin-bottom:var(--space-3);">' +
          b.minHrs + ' to ' + b.maxHrs + ' hours per week &middot; ' +
          (workDays.length ? workDays.map(function (dd) { return dd.day.slice(0, 3); }).join(', ') : 'No days set') +
        '</div>' +
        (b.timeOff.length
          ? '<div class="t-2" style="color:var(--fg-low);margin-bottom:var(--space-5);">Time off: ' +
            b.timeOff.map(function (t) { return A.esc(t.from) + ' to ' + A.esc(t.to) + (t.reason ? ' (' + A.esc(t.reason) + ')' : ''); }).join('; ') + '</div>'
          : '<div class="t-2" style="color:var(--fg-subtle);margin-bottom:var(--space-5);">No time off scheduled.</div>') +

        sectionHTML('Upcoming shifts', upcoming, UPCOMING_CAP, 'upcoming', 'No upcoming shifts.') +
        sectionHTML('Recent shifts', history, HISTORY_CAP, 'history', 'No shift history yet.') +

        '<div style="display:flex;gap:var(--space-2);padding-top:var(--space-4);border-top:1px solid var(--border-subtle);">' +
          '<button class="btn btn-surface" data-profile-edit="' + b.id + '">Edit details</button>' +
          '<button class="btn btn-surface" data-profile-avail="' + b.id + '">Availability</button>' +
          '<span style="flex:1;"></span>' +
          (b.account === 'deactivated'
            ? '<button class="btn btn-soft" data-profile-restore="' + b.id + '">Restore</button>'
            : '<button class="btn btn-soft is-danger" data-profile-deactivate="' + b.id + '">Deactivate</button>') +
        '</div>' +
      '</div>';

    d.hidden = false;
    d.querySelector('[data-close-drawer]').addEventListener('click', closeDrawer);

    d.querySelectorAll('[data-toggle-more]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var kind = btn.getAttribute('data-toggle-more');
        var box = d.querySelector('[data-more="' + kind + '"]');
        var opening = box.hidden;
        box.hidden = !opening;
        btn.setAttribute('aria-expanded', String(opening));
        var total = kind === 'upcoming' ? upcoming.length : history.length;
        btn.textContent = opening ? 'Show fewer' : 'Show all ' + total;
      });
    });
    var editBtn = d.querySelector('[data-profile-edit]');
    if (editBtn) editBtn.addEventListener('click', function () { closeDrawer(); window.BFMForms.openEdit(b.id); });
    var availBtn = d.querySelector('[data-profile-avail]');
    if (availBtn) availBtn.addEventListener('click', function () { closeDrawer(); window.BFMForms.openAvailability(b.id); });
    var deacBtn = d.querySelector('[data-profile-deactivate]');
    if (deacBtn) deacBtn.addEventListener('click', function () { closeDrawer(); confirmDeactivate([b.id]); });
    var restBtn = d.querySelector('[data-profile-restore]');
    if (restBtn) restBtn.addEventListener('click', function () { closeDrawer(); restore(b.id); });
  }

  // ---- Row overflow menu ----
  function openRowMenu(btn) {
    closeRowMenu();
    var id = Number(btn.getAttribute('data-menu'));
    var b = A.byId(id);
    var pop = document.createElement('div');
    pop.className = 'popover';
    pop.id = 'rowMenu';
    pop.style.minWidth = '200px';
    pop.innerHTML =
      '<button class="list-item" data-act="view">View profile</button>' +
      '<button class="list-item" data-act="edit">Edit details</button>' +
      '<button class="list-item" data-act="avail">Availability</button>' +
      '<div class="divider" style="margin:var(--space-1) 0;"></div>' +
      (b.account === 'deactivated'
        ? '<button class="list-item" data-act="restore">Restore</button>'
        : '<button class="list-item" data-act="deactivate" style="color:var(--danger-text);">Deactivate</button>');
    document.body.appendChild(pop);
    var r = btn.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.zIndex = 1200;
    var top = r.bottom + 6;
    if (top + pop.offsetHeight > window.innerHeight) top = r.top - 6 - pop.offsetHeight;
    pop.style.top = top + 'px';
    pop.style.left = Math.max(8, r.right - pop.offsetWidth) + 'px';
    btn.setAttribute('aria-expanded', 'true');

    pop.addEventListener('click', function (e) {
      var act = e.target.closest('[data-act]');
      if (!act) return;
      e.stopPropagation();
      var a = act.getAttribute('data-act');
      closeRowMenu();
      if (a === 'view') openProfile(id);
      if (a === 'edit') window.BFMForms.openEdit(id);
      if (a === 'avail') window.BFMForms.openAvailability(id);
      if (a === 'deactivate') confirmDeactivate([id]);
      if (a === 'restore') restore(id);
    });
    setTimeout(function () { document.addEventListener('click', closeRowMenu, { once: true }); }, 0);
  }
  function closeRowMenu() {
    var m = document.getElementById('rowMenu');
    if (m) m.remove();
    document.querySelectorAll('[data-menu]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }

  // ---- Deactivate (alert dialog, names the shifts it will strand) ----
  function confirmDeactivate(ids) {
    var people = ids.map(A.byId).filter(Boolean);
    if (!people.length) return;
    var affected = A.UPCOMING.filter(function (s) { return ids.indexOf(s.bfmId) > -1; });
    var who = people.length === 1 ? A.fullName(people[0]) : people.length + ' people';

    var shiftsHTML = affected.length
      ? '<div class="callout is-warning" style="margin-top:var(--space-3);"><span class="co-icon">' + A.icon(A.I.warn, 18) + '</span>' +
        '<div><strong>' + affected.length + ' upcoming shift' + (affected.length === 1 ? '' : 's') + ' assigned.</strong>' +
        '<div style="margin-top:var(--space-2);">' + affected.slice(0, 4).map(function (s) {
          return '<div class="t-1">' + A.esc(s.when) + ', ' + A.esc(s.time) + ' &middot; ' + A.esc(s.position) + '</div>';
        }).join('') + (affected.length > 4 ? '<div class="t-1">and ' + (affected.length - 4) + ' more</div>' : '') + '</div></div></div>' +
        '<label class="checkbox" style="margin-top:var(--space-3);"><input type="checkbox" id="releaseShifts" checked> Release these shifts back to Open</label>'
      : '<div class="t-2" style="color:var(--fg-low);margin-top:var(--space-3);">No upcoming shifts are assigned.</div>';

    var o = document.getElementById('alertOverlay');
    o.innerHTML =
      '<div class="alert-dialog" role="alertdialog" aria-labelledby="adTitle">' +
        '<div class="ad-title" id="adTitle">Deactivate ' + A.esc(who) + '?</div>' +
        '<div class="ad-body">They will not appear in the scheduler or be offered shifts until reactivated. Their shift history is kept.</div>' +
        shiftsHTML +
        '<div class="ad-footer">' +
          '<button class="btn btn-soft" data-alert-cancel>Cancel</button>' +
          '<button class="btn btn-solid is-danger" data-alert-confirm>Deactivate</button>' +
        '</div>' +
      '</div>';
    o.hidden = false;
    o.querySelector('[data-alert-cancel]').addEventListener('click', closeAlert);
    o.querySelector('[data-alert-confirm]').addEventListener('click', function () {
      var release = document.getElementById('releaseShifts');
      var releasing = release ? release.checked : false;
      people.forEach(function (p) { p.account = 'deactivated'; p.deactivatedOn = 'Jul 27, 2026'; });
      if (releasing) {
        for (var i = A.UPCOMING.length - 1; i >= 0; i--) {
          if (ids.indexOf(A.UPCOMING[i].bfmId) > -1) A.UPCOMING.splice(i, 1);
        }
      }
      A.state.selected = [];
      closeAlert();
      A.renderTable();
      A.showToast(who + ' deactivated',
        releasing && affected.length
          ? affected.length + ' shift' + (affected.length === 1 ? '' : 's') + ' released back to Open.'
          : 'They can be restored from the Deactivated tab.');
    });
    o.addEventListener('click', function (e) { if (e.target === o) closeAlert(); });
  }

  // ---- Restore (immediate, undoable) ----
  function restore(id) {
    var b = A.byId(id);
    if (!b) return;
    var prevOn = b.deactivatedOn;
    b.account = 'active';
    delete b.deactivatedOn;
    A.renderTable();
    A.showToast(A.fullName(b) + ' restored', 'They can be scheduled again at skypoint.', 'Undo', function () {
      b.account = 'deactivated';
      b.deactivatedOn = prevOn;
      A.renderTable();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    closeRowMenu();
    if (!document.getElementById('alertOverlay').hidden) { closeAlert(); return; }
    if (!document.getElementById('profileDrawer').hidden) closeDrawer();
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('bulkDeactivateBtn').addEventListener('click', function () {
      confirmDeactivate(A.state.selected.slice());
    });
  });

  window.BFMProfile = { open: openProfile, close: closeDrawer };
  window.BFMActions = { openRowMenu: openRowMenu, confirmDeactivate: confirmDeactivate, restore: restore };
})();
