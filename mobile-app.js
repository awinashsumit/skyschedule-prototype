/* ============================================================
   skySchedule mobile - core
   Helpers, the overlay stack, the tab router, and the two
   simplest screens (Home and More). Schedule, BFMs and Messages
   live in their own files and register themselves on APP.
   ============================================================ */
(function (w, d) {
  'use strict';
  var S = w.SS;

  /* ---- Small helpers --------------------------------------------- */
  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function avatar(b, sm) {
    if (!b) return '<span class="m-avatar' + (sm ? ' is-sm' : '') + '" style="background:var(--gray-8);">?</span>';
    return '<span class="m-avatar' + (sm ? ' is-sm' : '') + ' av-' + b.avatar + '">' + esc(b.initials) + '</span>';
  }

  /* Icon set. Kept as one map because the same glyph appears on three or
     four screens and duplicating the path data drifts over time. */
  var P = {
    chevron: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    close: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    minusOnly: '<path d="M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
    message: '<path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    swap: '<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    phone: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    mail: '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    bell: '<path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>',
    building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/>',
    briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12.18a1 1 0 0 0 .6.9l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 .58-.9"/>',
    logout: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    filter: '<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>'
  };
  function icon(name, size, stroke) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) +
      '" fill="none" stroke="currentColor" stroke-width="' + (stroke || 1.75) +
      '" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || '') + '</svg>';
  }
  function iconBtn(name, label, attrs) {
    return '<button class="m-icon-btn state-layer" aria-label="' + esc(label) + '" ' + (attrs || '') + '>' + icon(name) + '</button>';
  }

  var STATUS_BADGE = {
    confirmed: ['is-success', 'Confirmed'],
    assigned: ['is-info', 'Assigned'],
    draft: ['is-neutral', 'Draft'],
    open: ['is-warning', 'Open'],
    unfulfilled: ['is-danger', 'Unfulfilled']
  };
  function badge(status) {
    var m = STATUS_BADGE[status] || ['is-neutral', status];
    return '<span class="m-badge ' + m[0] + '">' + esc(m[1]) + '</span>';
  }

  /* ---- Overlay stack ---------------------------------------------- */
  /* Every modal surface is its own layer. Escape and the scrim pop only
     the top one, which is what makes a sheet-over-full-screen behave the
     way it does natively instead of dismissing the whole stack. */
  var host = $('#overlayHost');
  var stack = [];

  function layer(html, opts) {
    opts = opts || {};
    var node = d.createElement('div');
    node.className = 'm-layer';
    node.style.zIndex = String(100 + stack.length * 10);
    node.innerHTML = html;
    host.appendChild(node);
    stack.push({ node: node, onClose: opts.onClose });
    $$('[data-close]', node).forEach(function (b) {
      b.addEventListener('click', function () { pop(); });
    });
    if (opts.wire) opts.wire(node);
    return node;
  }
  function pop() {
    var top = stack.pop();
    if (!top) return;
    top.node.remove();
    if (top.onClose) top.onClose();
  }
  function popAll() { while (stack.length) pop(); }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && stack.length) pop(); });

  /* A sheet is the mobile stand-in for every desktop dropdown, popover and
     small dialog. `rows` is the common case: a list of tappable options. */
  function sheet(o) {
    var body = o.body != null ? o.body : (o.rows || []).map(function (r) {
      return '<button class="m-pick state-layer' + (r.selected ? ' is-selected' : '') + '" data-val="' + esc(r.value) + '">' +
        (r.lead || '') +
        '<span class="m-pick-text"><span class="m-pick-title">' + esc(r.title) + '</span>' +
        (r.sub ? '<span class="m-pick-sub">' + esc(r.sub) + '</span>' : '') + '</span>' +
        '<span class="m-pick-check">' + icon('check', 20, 2) + '</span></button>';
    }).join('');

    return layer(
      '<div class="m-scrim" data-close></div>' +
      '<div class="m-sheet" role="dialog" aria-modal="true" aria-label="' + esc(o.title || 'Options') + '">' +
        '<div class="m-sheet-handle"><span></span></div>' +
        (o.title ? '<div class="m-sheet-title">' + esc(o.title) + '</div>' : '') +
        (o.sub ? '<div style="padding:0 var(--space-4) var(--space-2);font-size:var(--fs-2);color:var(--fg-low);">' + esc(o.sub) + '</div>' : '') +
        '<div class="m-sheet-body"' + (o.rows ? ' style="padding-left:0;padding-right:0;"' : '') + '>' + body + '</div>' +
        (o.actions ? '<div class="m-sheet-actions">' + o.actions + '</div>' : '') +
      '</div>',
      { wire: function (node) {
          if (o.rows) {
            $$('.m-pick', node).forEach(function (b) {
              b.addEventListener('click', function () {
                if (o.keepOpen !== true) pop();
                o.onPick && o.onPick(b.getAttribute('data-val'), b);
              });
            });
          }
          o.wire && o.wire(node);
        } }
    );
  }

  function dialog(o) {
    return layer(
      '<div class="m-scrim" data-close></div>' +
      '<div class="m-dialog" role="alertdialog" aria-modal="true">' +
        '<div class="m-dialog-title">' + esc(o.title) + '</div>' +
        '<div class="m-dialog-body">' + (o.html || esc(o.body || '')) + '</div>' +
        '<div class="m-dialog-actions">' +
          '<button class="m-btn m-btn-text state-layer" data-close>' + esc(o.cancel || 'Cancel') + '</button>' +
          '<button class="m-btn ' + (o.danger ? 'm-btn-danger' : 'm-btn-filled') + ' state-layer" data-confirm>' + esc(o.confirm || 'Confirm') + '</button>' +
        '</div>' +
      '</div>',
      { wire: function (node) {
          $('[data-confirm]', node).addEventListener('click', function () { pop(); o.onConfirm && o.onConfirm(); });
        } }
    );
  }

  /* Full-screen surface: the mobile equivalent of a desktop modal that is
     too tall or too multi-step to sit in a sheet. Owns an app bar so the
     user always has a labelled way out. */
  function fullscreen(o) {
    return layer(
      '<div class="m-fullscreen" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
        '<header class="m-appbar">' +
          '<button class="m-icon-btn state-layer" ' + (o.onBack ? 'data-back' : 'data-close') + ' aria-label="' + esc(o.backLabel || 'Close') + '">' +
            icon(o.back ? 'back' : 'close') + '</button>' +
          '<span class="m-appbar-title">' + esc(o.title) + '</span>' +
          (o.trail || '') +
        '</header>' +
        '<div class="m-fs-body"' + (o.flush ? ' style="padding:0;"' : '') + ' id="fsBody">' + (o.body || '') + '</div>' +
        (o.actions ? '<div class="m-fs-actions">' + o.actions + '</div>' : '') +
      '</div>',
      { wire: function (node) {
          var b = $('[data-back]', node);
          if (b) b.addEventListener('click', function () { pop(); o.onBack(); });
          o.wire && o.wire(node);
        }, onClose: o.onClose }
    );
  }

  function snack(msg, actionLabel, onAction) {
    var s = d.createElement('div');
    s.className = 'm-snackbar';
    s.innerHTML = '<span style="flex:1;">' + esc(msg) + '</span>' +
      (actionLabel ? '<button class="m-snackbar-action">' + esc(actionLabel) + '</button>' : '');
    $('#snackHost').appendChild(s);
    var t = setTimeout(function () { s.remove(); }, 4000);
    if (actionLabel) {
      $('.m-snackbar-action', s).addEventListener('click', function () {
        clearTimeout(t); s.remove(); onAction && onAction();
      });
    }
    return s;
  }

  /* ---- Router ------------------------------------------------------ */
  var VIEWS = ['home', 'schedule', 'bfms', 'messages', 'more'];
  var current = 'home';

  function go(tab) {
    if (VIEWS.indexOf(tab) === -1) return;
    current = tab;
    VIEWS.forEach(function (v) { $('#v-' + v).hidden = (v !== tab); });
    $$('.m-tab').forEach(function (t) {
      var on = t.getAttribute('data-tab') === tab;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    APP.render(tab);
  }

  /* ---- Render dispatch --------------------------------------------- */
  var renderers = {};
  function register(tab, fn) { renderers[tab] = fn; }
  function render(tab) {
    if (tab) { renderers[tab] && renderers[tab](); return; }
    /* No argument: refresh whatever is on screen plus the tab badges, so a
       change made inside a flow shows up the moment the flow closes. */
    renderers[current] && renderers[current]();
    badges();
  }

  function badges() {
    var ex = S.exceptions().length;
    var hb = $('#tabHomeBadge');
    hb.textContent = String(ex); hb.hidden = ex === 0;
    var drafts = S.MESSAGES.filter(function (m) { return m.status === 'draft' || m.status === 'scheduled'; }).length;
    var mb = $('#tabMsgBadge');
    mb.textContent = String(drafts); mb.hidden = drafts === 0;
  }

  var APP = w.APP = {
    $: $, $$: $$, esc: esc, avatar: avatar, icon: icon, iconBtn: iconBtn, badge: badge,
    layer: layer, pop: pop, popAll: popAll, sheet: sheet, dialog: dialog,
    fullscreen: fullscreen, snack: snack, go: go, register: register, render: render,
    get current() { return current; }
  };

  /* ============================================================
     HOME
     A hub, not a report. Every block answers "what needs me" and
     links through to the tab that can act on it.
     ============================================================ */
  register('home', function () {
    var st = S.stats();
    var ex = S.exceptions();
    var today = S.shiftsOn(S.TODAY);
    var h = [];

    h.push('<div class="m-greet">' +
      '<div class="m-greet-hi">Monday, Jul 27</div>' +
      '<div class="m-greet-name">Good morning, Sumit</div>' +
      '<div class="m-greet-where">' + st.total + ' shifts this week &middot; ' + st.fulfillment + '% filled</div>' +
      '</div>');

    /* Needs attention leads, because an unfilled shift is the only thing
       on this screen with a deadline attached to it. */
    if (ex.length) {
      h.push('<div class="m-attn">' +
        '<div class="m-attn-head"><span class="m-attn-title">Needs attention</span>' +
        '<span class="m-badge is-danger">' + ex.length + '</span></div>' +
        ex.slice(0, 3).map(function (s) {
          var day = S.DAYS[s.day];
          return '<button class="m-attn-row state-layer" data-shift="' + s.id + '">' +
            '<span class="m-attn-dot is-' + (s.status === 'unfulfilled' ? 'danger' : 'warning') + '"></span>' +
            '<span class="m-attn-text">' +
              '<span class="m-attn-what">' + esc(s.position) + ' ' + (s.status === 'unfulfilled' ? 'went unstaffed' : 'is unfilled') + '</span>' +
              '<span class="m-attn-when">' + esc(day.short + ', ' + day.label) + ' &middot; ' + esc(s.start + ' to ' + s.end) + '</span>' +
            '</span>' + icon('chevron', 20) + '</button>';
        }).join('') +
        (ex.length > 3 ? '<div class="m-attn-foot"><button class="m-btn m-btn-text state-layer" data-goto="schedule" data-filter="open" style="width:100%;">View all ' + ex.length + '</button></div>' : '') +
        '</div>');
    } else {
      h.push('<div class="m-attn"><div class="m-attn-head"><span class="m-attn-title">Needs attention</span></div>' +
        '<div style="padding:var(--space-4);font-size:var(--fs-2);color:var(--fg-low);">Every shift this week is covered.</div></div>');
    }

    h.push('<div class="m-sec-head"><h2>This week</h2>' +
      '<button class="m-sec-link" data-sheet="range">Jul 26 &ndash; Aug 1</button></div>');
    h.push('<div class="m-kpis">' +
      kpi(st.assigned, 'Shifts assigned', '+3 vs last week', 'up') +
      kpi(st.open, 'Open shifts', null, null, st.open > 0) +
      kpi(st.hours + 'h', 'Hours scheduled', '+12h vs last week', 'up') +
      kpi(st.fulfillment + '%', 'Fulfilment', '-4% vs last week', 'down') +
      '</div>');

    /* Requests are separated from exceptions because they are someone
       else's ask, not a gap in the roster. Different verb, different queue. */
    h.push('<div class="m-sec-head"><h2>Needs review</h2><span class="m-sec-sub">' + S.REVIEWS.length + ' waiting</span></div>');
    h.push('<div class="m-list" style="border-top:1px solid var(--border-subtle);">' +
      S.REVIEWS.map(function (r) {
        var b = S.byId(r.bfmId);
        var line = r.type === 'swap' ? 'Wants to drop ' + r.when + ', ' + r.time
          : r.type === 'timeoff' ? 'Time off ' + r.from + ' to ' + r.to
          : 'Claiming the open ' + r.position + ' shift';
        return '<button class="m-list-item state-layer" data-review="' + r.id + '" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-top:0;">' +
          '<span class="m-li-lead">' + avatar(b, true) + '</span>' +
          '<span class="m-li-text"><span class="m-li-title">' + esc(S.fullName(b)) + '</span>' +
          '<span class="m-li-sub">' + esc(line) + '</span></span>' +
          '<span class="m-li-trail">' + esc(r.age) + icon('chevron', 20) + '</span></button>';
      }).join('') + '</div>');

    h.push('<div class="m-sec-head"><h2>Today</h2>' +
      '<button class="m-sec-link" data-goto="schedule">View schedule</button></div>');
    h.push(today.length ? today.map(shiftRow).join('')
      : '<div style="padding:var(--space-4);font-size:var(--fs-2);color:var(--fg-low);">Nothing scheduled today.</div>');

    h.push('<div class="m-sec-head"><h2>Community</h2>' +
      '<button class="m-sec-link" data-open="community">View all</button></div>');
    h.push(S.POSTS.slice(0, 2).map(postCard).join(''));

    $('#homeBody').innerHTML = h.join('');
    wireHome();
    badges();
  });

  function kpi(val, label, delta, dir, alert) {
    return '<div class="m-kpi' + (alert ? ' is-alert' : '') + '">' +
      '<span class="m-kpi-val">' + esc(val) + '</span>' +
      '<span class="m-kpi-label">' + esc(label) + '</span>' +
      (delta ? '<span class="m-kpi-delta is-' + dir + '">' + esc(delta) + '</span>' : '') +
      '</div>';
  }

  /* One shift row markup, shared by Home and Schedule so a shift cannot
     look like two different things depending on where you found it. */
  function shiftRow(s) {
    var b = S.byId(s.bfmId);
    var trail = (s.status === 'open' || s.status === 'unfulfilled')
      ? '<button class="m-btn m-btn-tonal state-layer" data-assign="' + s.id + '" style="padding:0 var(--space-4);">Assign</button>'
      : badge(s.status);
    return '<div class="m-shift is-' + s.status + ' state-layer" data-shift="' + s.id + '">' +
      '<span class="m-shift-rail"></span>' +
      '<span class="m-shift-body">' +
        '<span class="m-shift-time">' + esc(s.start + ' to ' + s.end) + '</span>' +
        '<span class="m-shift-meta">' + esc((b ? S.fullName(b) : 'Unassigned') + ' · ' + s.position) + '</span>' +
      '</span>' +
      '<span class="m-shift-trail">' + trail + '</span></div>';
  }
  APP.shiftRow = shiftRow;

  function postCard(p) {
    var b = S.byId(p.bfmId);
    return '<div class="m-post">' +
      '<div class="m-post-head">' + avatar(b, true) +
        '<span class="m-post-who"><span class="m-post-name">' + esc(S.fullName(b)) + '</span>' +
        '<span class="m-post-meta">' + esc(b.primary + ' · ' + p.when) + '</span></span>' +
        (p.pinned ? '<span class="m-badge is-info">Pinned</span>' : '') + '</div>' +
      '<div class="m-post-body">' + esc(p.body) + '</div>' +
      '<div class="m-post-actions">' +
        '<button class="m-post-act' + (p.liked ? ' is-on' : '') + '" data-like="' + p.id + '">' + icon('heart', 18) + ' ' + p.likes + '</button>' +
        '<button class="m-post-act" data-comment="' + p.id + '">' + icon('comment', 18) + ' ' + p.comments + '</button>' +
      '</div></div>';
  }
  APP.postCard = postCard;

  function wireHome() {
    var body = $('#homeBody');
    $$('[data-goto]', body).forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        if (f && APP.setScheduleFilter) APP.setScheduleFilter(f);
        go(b.getAttribute('data-goto'));
      });
    });
    $$('[data-shift]', body).forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.target.closest('[data-assign]')) return;
        APP.openShift && APP.openShift(+b.getAttribute('data-shift'));
      });
    });
    $$('[data-assign]', body).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        APP.assignFlow && APP.assignFlow(+b.getAttribute('data-assign'));
      });
    });
    $$('[data-review]', body).forEach(function (b) {
      b.addEventListener('click', function () { reviewFlow(b.getAttribute('data-review')); });
    });
    $$('[data-open="community"]', body).forEach(function (b) {
      b.addEventListener('click', openCommunity);
    });
    $$('[data-sheet="range"]', body).forEach(function (b) {
      b.addEventListener('click', function () { APP.rangeSheet && APP.rangeSheet(); });
    });
    wirePosts(body);
  }

  function wirePosts(root) {
    $$('[data-like]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = +b.getAttribute('data-like');
        var p = S.POSTS.filter(function (x) { return x.id === id; })[0];
        if (!p) return;
        p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
        b.classList.toggle('is-on', p.liked);
        b.innerHTML = icon('heart', 18) + ' ' + p.likes;
      });
    });
  }
  APP.wirePosts = wirePosts;

  /* ---- Review a request -------------------------------------------- */
  function reviewFlow(id) {
    var r = S.REVIEWS.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var b = S.byId(r.bfmId);
    var lines = [];
    if (r.type === 'swap') {
      lines.push(['Request', 'Drop a shift']);
      lines.push(['Shift', r.when + ' · ' + r.time]);
      lines.push(['Position', r.position]);
      lines.push(['Offered to', S.fullName(S.byId(r.with))]);
    } else if (r.type === 'timeoff') {
      lines.push(['Request', 'Time off']);
      lines.push(['Dates', r.from + ' to ' + r.to]);
      lines.push(['Reason', r.reason]);
      lines.push(['Conflicts', r.conflicts + ' assigned shifts in that window']);
    } else {
      lines.push(['Request', 'Claim an open shift']);
      lines.push(['Shift', r.when + ' · ' + r.time]);
      lines.push(['Position', r.position]);
    }
    var warn = (r.type === 'timeoff' && r.conflicts)
      ? '<div class="m-alert is-warning" style="margin:var(--space-3) 0 0;">' + icon('warn', 18) +
        '<span>Approving releases ' + r.conflicts + ' assigned shifts back to Open. You will need to refill them.</span></div>' : '';

    sheet({
      title: S.fullName(b),
      body: '<div style="display:flex;align-items:center;gap:var(--space-3);padding-bottom:var(--space-3);">' +
              avatar(b) + '<div><div style="font-size:var(--fs-2);font-weight:var(--weight-medium);">' + esc(b.primary) + '</div>' +
              '<div style="font-size:var(--fs-1);color:var(--fg-low);">Requested ' + esc(r.age) + '</div></div></div>' +
            lines.map(function (l) {
              return '<div style="display:flex;gap:var(--space-4);padding:var(--space-2) 0;font-size:var(--fs-2);">' +
                '<span style="width:40%;color:var(--fg-low);">' + esc(l[0]) + '</span>' +
                '<span style="flex:1;">' + esc(l[1]) + '</span></div>';
            }).join('') +
            (r.note ? '<div class="m-review-msg" style="margin-top:var(--space-3);">' + esc(r.note) + '</div>' : '') +
            warn,
      actions: '<button class="m-btn m-btn-outlined state-layer" data-decline>Decline</button>' +
               '<button class="m-btn m-btn-filled state-layer" data-approve>Approve</button>',
      wire: function (node) {
        $('[data-approve]', node).addEventListener('click', function () {
          pop(); resolveReview(r, true);
        });
        $('[data-decline]', node).addEventListener('click', function () {
          pop(); resolveReview(r, false);
        });
      }
    });
  }

  function resolveReview(r, approved) {
    var i = S.REVIEWS.indexOf(r);
    if (i > -1) S.REVIEWS.splice(i, 1);
    /* Approving a claim actually assigns the shift, so the effect of the
       decision is visible on Schedule rather than only in a toast. */
    if (approved && r.type === 'claim') {
      var s = S.shiftById(r.shiftId);
      if (s) { s.bfmId = r.bfmId; s.status = 'confirmed'; }
    }
    render();
    snack((approved ? 'Approved' : 'Declined') + ' · ' + S.fullName(S.byId(r.bfmId)), 'Undo', function () {
      S.REVIEWS.splice(i, 0, r);
      if (approved && r.type === 'claim') {
        var s2 = S.shiftById(r.shiftId);
        if (s2) { s2.bfmId = null; s2.status = 'open'; }
      }
      render();
    });
  }

  /* ---- Community ---------------------------------------------------- */
  function openCommunity() {
    fullscreen({
      title: 'Community', back: true, onBack: function () {},
      flush: true,
      body: '<div id="feedList">' + S.POSTS.map(postCard).join('') + '</div>',
      actions: '<button class="m-btn m-btn-filled state-layer" id="newPost" style="flex:1;">New post</button>',
      wire: function (node) {
        wirePosts(node);
        $('#newPost', node).addEventListener('click', function () {
          sheet({
            title: 'New post',
            body: '<label class="m-field"><span class="m-field-label">Message</span>' +
                  '<textarea class="m-textarea" id="postText" placeholder="Share something with the team"></textarea></label>',
            actions: '<button class="m-btn m-btn-outlined state-layer" data-close>Cancel</button>' +
                     '<button class="m-btn m-btn-filled state-layer" data-post>Post</button>',
            wire: function (sn) {
              $('[data-post]', sn).addEventListener('click', function () {
                var t = $('#postText', sn).value.trim();
                if (!t) { snack('Write something first'); return; }
                S.POSTS.unshift({ id: Date.now(), bfmId: 1, when: 'Just now', body: t, likes: 0, comments: 0 });
                pop();
                $('#feedList', node).innerHTML = S.POSTS.map(postCard).join('');
                wirePosts(node);
                snack('Posted to Community');
              });
            }
          });
        });
      }
    });
  }
  APP.openCommunity = openCommunity;

  /* ============================================================
     MORE
     Everything that is real but not daily. Ordered by how often a
     scheduler actually opens it, not alphabetically.
     ============================================================ */
  register('more', function () {
    var me = { first: 'Sumit', last: 'Awinash', initials: 'SA', avatar: 'c5',
      primary: 'Scheduling Administrator', email: 'sumit.awinash@skypointcloud.com' };
    var groups = [
      { label: 'Workplace', items: [
        { id: 'community', icon: 'users', title: 'Community', sub: S.POSTS.length + ' posts' },
        { id: 'locations', icon: 'building', title: 'Locations', sub: S.LOCATIONS.length + ' sites' },
        { id: 'positions', icon: 'briefcase', title: 'Positions', sub: S.POSITIONS.length + ' roles' },
        { id: 'groups', icon: 'layers', title: 'Groups', sub: '4 groups' }
      ] },
      { label: 'Account', items: [
        { id: 'hris', icon: 'settings', title: 'HRIS integration', sub: 'Connected' },
        { id: 'notifications', icon: 'bell', title: 'Notifications' },
        { id: 'help', icon: 'help', title: 'Help and support' }
      ] }
    ];
    var h = ['<button class="m-list-item state-layer" data-open="profile" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-top:0;padding-top:var(--space-4);padding-bottom:var(--space-4);">' +
      '<span class="m-li-lead">' + avatar(me) + '</span>' +
      '<span class="m-li-text"><span class="m-li-title" style="font-size:var(--fs-3);">' + esc(me.first + ' ' + me.last) + '</span>' +
      '<span class="m-li-sub">' + esc(me.primary) + '</span></span>' +
      '<span class="m-li-trail">' + icon('chevron', 20) + '</span></button>'];

    groups.forEach(function (g) {
      h.push('<div class="m-list-header">' + esc(g.label) + '</div>');
      h.push(g.items.map(function (it) {
        return '<button class="m-list-item state-layer" data-open="' + it.id + '" style="width:100%;text-align:left;background:none;border-left:0;border-right:0;border-top:0;">' +
          '<span class="m-li-lead">' + icon(it.icon, 22) + '</span>' +
          '<span class="m-li-text"><span class="m-li-title">' + esc(it.title) + '</span>' +
          (it.sub ? '<span class="m-li-sub">' + esc(it.sub) + '</span>' : '') + '</span>' +
          '<span class="m-li-trail">' + icon('chevron', 20) + '</span></button>';
      }).join(''));
    });

    h.push('<div style="padding:var(--space-5) var(--space-4);">' +
      '<button class="m-btn m-btn-outlined state-layer" id="signOut" style="width:100%;">' + icon('logout', 18) + ' Sign out</button>' +
      '<div style="text-align:center;margin-top:var(--space-4);font-size:var(--fs-1);color:var(--fg-subtle);">skySchedule &middot; prototype build</div></div>');

    $('#moreBody').innerHTML = h.join('');
    $$('[data-open]', $('#moreBody')).forEach(function (b) {
      b.addEventListener('click', function () { openMore(b.getAttribute('data-open'), me); });
    });
    $('#signOut').addEventListener('click', function () {
      dialog({ title: 'Sign out?', body: 'You will need to sign in again to see the schedule.',
        confirm: 'Sign out', danger: true, onConfirm: function () { snack('Signed out'); } });
    });
  });

  function openMore(id, me) {
    if (id === 'community') return openCommunity();
    if (id === 'profile') {
      return fullscreen({ title: 'Your profile', back: true, onBack: function () {}, flush: true,
        body: '<div class="m-profile">' + avatar(me) +
          '<div class="m-profile-name">' + esc(me.first + ' ' + me.last) + '</div>' +
          '<div class="m-profile-role">' + esc(me.primary) + '</div></div>' +
          kv('Email', me.email) + kv('Role', 'Administrator') +
          kv('Locations', S.LOCATIONS.join(', ')) + kv('Time zone', 'Pacific Time (US)') });
    }
    if (id === 'locations') return simpleList('Locations', S.LOCATIONS.map(function (l, i) {
      return { title: l, sub: [12, 6, 5][i] + ' shifts this week' };
    }));
    if (id === 'positions') return simpleList('Positions', S.POSITIONS.map(function (p) {
      var n = S.BFMS.filter(function (b) { return b.primary === p || b.secondary.indexOf(p) > -1; }).length;
      return { title: p, sub: n + (n === 1 ? ' person' : ' people') };
    }));
    if (id === 'groups') return simpleList('Groups', [
      { title: 'Kitchen team', sub: '5 people' }, { title: 'Care team', sub: '2 people' },
      { title: 'Bread Basket', sub: '3 people' }, { title: 'Weekend cover', sub: '6 people' }
    ]);
    if (id === 'hris') return fullscreen({ title: 'HRIS integration', back: true, onBack: function () {}, flush: true,
      body: '<div class="m-alert is-info" style="margin:var(--space-4);">' + icon('checkCircle', 18) +
        '<span>Connected to Workday. Last sync 6:00 AM today.</span></div>' +
        kv('Provider', 'Workday') + kv('Records synced', S.BFMS.length + ' people') +
        kv('Sync schedule', 'Daily at 6:00 AM') + kv('Conflicts', 'None') });
    if (id === 'notifications') return notificationSettings();
    if (id === 'help') return simpleList('Help and support', [
      { title: 'Getting started guide' }, { title: 'Creating and filling shifts' },
      { title: 'Sending messages' }, { title: 'Contact support' }
    ]);
  }

  function kv(k, v) {
    return '<div class="m-kv"><span class="m-kv-k">' + esc(k) + '</span>' +
      '<span class="m-kv-v' + (v ? '' : ' is-empty') + '">' + esc(v || 'Not set') + '</span></div>';
  }
  APP.kv = kv;

  function simpleList(title, items) {
    fullscreen({ title: title, back: true, onBack: function () {}, flush: true,
      body: items.map(function (it) {
        return '<div class="m-list-item"><span class="m-li-text">' +
          '<span class="m-li-title">' + esc(it.title) + '</span>' +
          (it.sub ? '<span class="m-li-sub">' + esc(it.sub) + '</span>' : '') + '</span></div>';
      }).join('') });
  }

  function notificationSettings() {
    var rows = [
      ['A shift goes unfilled', true], ['Someone requests time off', true],
      ['Someone claims an open shift', true], ['A message finishes sending', false],
      ['Weekly schedule summary', true]
    ];
    fullscreen({ title: 'Notifications', back: true, onBack: function () {}, flush: true,
      body: '<div style="padding:var(--space-4);">' + rows.map(function (r) {
        return '<label class="m-switch" style="gap:var(--space-3);justify-content:space-between;width:100%;padding:var(--space-2) 0;">' +
          '<span style="flex:1;font-size:var(--fs-2);">' + esc(r[0]) + '</span>' +
          '<input type="checkbox"' + (r[1] ? ' checked' : '') + ' /></label>';
      }).join('') + '</div>' });
  }

  /* ---- Shell wiring -------------------------------------------------- */
  $$('.m-tab').forEach(function (t) {
    t.addEventListener('click', function () { go(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(t.getAttribute('data-tab')); }
    });
  });
  $$('[data-goto]', $('#v-home')).forEach(function (b) {
    if (b.closest('#homeBody')) return;
    b.addEventListener('click', function () { go(b.getAttribute('data-goto')); });
  });
  $('[data-sheet="location"]').addEventListener('click', function () {
    sheet({ title: 'Location', rows: S.LOCATIONS.map(function (l, i) {
      return { value: l, title: l, selected: i === 0 };
    }), onPick: function (v) { $('#homeLocation').textContent = v; snack('Showing ' + v); } });
  });
  $('[data-sheet="notifications"]').addEventListener('click', function () {
    var ex = S.exceptions();
    sheet({ title: 'Notifications',
      body: (ex.length ? ex.slice(0, 3).map(function (s) {
        var day = S.DAYS[s.day];
        return '<div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);">' +
          '<span style="color:var(--' + (s.status === 'unfulfilled' ? 'danger' : 'warning') + '-solid);flex:none;">' + icon('warn', 20) + '</span>' +
          '<span style="font-size:var(--fs-2);">' + esc(s.position) + ' shift on ' + esc(day.short + ' ' + day.label) +
          ' is ' + esc(s.status) + '.</span></div>';
      }).join('') : '') +
      '<div style="display:flex;gap:var(--space-3);padding:var(--space-3) 0;">' +
        '<span style="color:var(--info-solid);flex:none;">' + icon('users', 20) + '</span>' +
        '<span style="font-size:var(--fs-2);">' + S.REVIEWS.length + ' requests are waiting on your review.</span></div>'
    });
  });

  render('home');
})(window, document);
