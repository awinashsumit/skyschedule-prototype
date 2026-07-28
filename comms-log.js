/* History and Templates.
   History stores the rendered message and per-channel delivery outcomes, so it
   answers "who was told what, and did it arrive" rather than showing the
   unresolved template. */
(function () {
  'use strict';
  var C = window.Comms;
  var histSearch = '';

  var msgFilter = 'all';

  function statusBadge(entry) {
    if (entry.status === 'draft') return '<span class="badge is-neutral">Draft</span>';
    if (entry.status === 'scheduled') return '<span class="badge is-info">Scheduled</span>';
    var failed = ['sms', 'email', 'push'].reduce(function (n, ch) { return n + (entry.channels[ch] ? entry.channels[ch].failed : 0); }, 0);
    if (failed > 0) return '<span class="badge is-warning">' + failed + ' failed</span>';
    return '<span class="badge is-success">Delivered</span>';
  }

  function channelBreakdown(entry) {
    if (entry.status !== 'sent') return '';
    return ['sms', 'email', 'push'].map(function (ch) {
      var c = entry.channels[ch];
      if (!c || !c.sent) return '';
      var label = ch === 'sms' ? 'SMS' : ch === 'email' ? 'Email' : 'Push';
      var tone = c.failed ? 'var(--warning-text)' : 'var(--fg-low)';
      return '<span class="t-1" style="color:' + tone + ';">' + label + ' ' + c.delivered + '/' + c.sent +
        (c.failed ? ' (' + c.failed + ' failed)' : '') + '</span>';
    }).filter(Boolean).join('<span class="t-1" style="color:var(--fg-subtle);"> &middot; </span>');
  }

  // Actions depend on where the message is in its lifecycle: drafts resume,
  // scheduled messages can still be cancelled, sent ones can only be reused.
  function rowActions(e) {
    if (e.status === 'draft') return '<button class="btn btn-surface is-sm" data-resume="' + e.id + '">Continue editing</button>';
    if (e.status === 'scheduled') return '<button class="btn btn-surface is-sm" data-resume="' + e.id + '">Edit</button>' +
      ' <button class="btn btn-ghost is-sm" data-cancel="' + e.id + '" style="color:var(--danger-text);">Cancel</button>';
    return '<button class="btn btn-surface is-sm" data-resend="' + e.id + '">Duplicate</button>';
  }

  function renderMessages() {
    var q = histSearch.trim().toLowerCase();
    var list = C.MESSAGES.filter(function (e) {
      if (msgFilter !== 'all' && e.status !== msgFilter) return false;
      return !q || ((e.renderedSample || '') + ' ' + e.sender + ' ' + (e.title || '') + ' ' + (e.templateName || '')).toLowerCase().indexOf(q) > -1;
    });
    var counts = {
      all: C.MESSAGES.length,
      draft: C.MESSAGES.filter(function (e) { return e.status === 'draft'; }).length,
      scheduled: C.MESSAGES.filter(function (e) { return e.status === 'scheduled'; }).length,
      sent: C.MESSAGES.filter(function (e) { return e.status === 'sent'; }).length
    };

    var rows = list.map(function (e) {
      return '<div class="log-row">' +
        '<div style="display:flex;align-items:flex-start;gap:var(--space-3);">' +
          '<div style="flex:1;min-width:0;">' +
            (e.title ? '<div class="t-2 fw-medium" style="color:var(--fg-high);">' + C.esc(e.title) + '</div>' : '') +
            '<div class="t-2" style="color:' + (e.title ? 'var(--fg-low)' : 'var(--fg-high)') + ';margin-bottom:2px;">' + C.esc(e.renderedSample) + '</div>' +
            '<div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;">' +
              '<span class="avatar ' + e.senderAvatar + '" style="width:20px;height:20px;font-size:9px;">' + e.senderInitials + '</span>' +
              '<span class="t-1" style="color:var(--fg-low);">' + C.esc(e.sender) + '</span>' +
              '<span class="t-1" style="color:var(--fg-subtle);">' + C.esc(e.sentAt) + '</span>' +
              '<span class="t-1" style="color:var(--fg-subtle);">&middot;</span>' +
              '<span class="t-1" style="color:var(--fg-low);">' + e.recipients + ' recipients</span>' +
              (e.templateName ? '<span class="tag">' + C.esc(e.templateName) + '</span>' : '') +
            '</div>' +
            '<div style="margin-top:var(--space-1);">' + channelBreakdown(e) + '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:var(--space-2);flex:none;">' +
            statusBadge(e) + rowActions(e) +
          '</div>' +
        '</div></div>';
    }).join('');

    document.getElementById('panel-history').innerHTML =
      '<div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4);flex-wrap:wrap;">' +
        '<div class="segmented" role="tablist" aria-label="Message status">' +
          [['all', 'All'], ['draft', 'Drafts'], ['scheduled', 'Scheduled'], ['sent', 'Sent']].map(function (f) {
            return '<button class="segmented-item' + (msgFilter === f[0] ? ' is-active' : '') + '" data-msg-filter="' + f[0] + '">' +
              f[1] + ' <span class="t-1" style="opacity:.7;">' + counts[f[0]] + '</span></button>';
          }).join('') +
        '</div>' +
        '<span style="flex:1;"></span>' +
        '<div class="search" style="max-width:320px;flex:1;">' +
          '<span class="search-icon">' + C.icon(C.I.search) + '</span>' +
          '<input class="input" id="histSearch" placeholder="Search messages" value="' + C.esc(histSearch) + '">' +
        '</div>' +
      '</div>' +
      '<section class="card" style="padding:0;">' +
        (rows || '<div class="empty-state" style="padding:var(--space-6) 0;">' +
          '<div class="empty-art">' + C.icon(C.I.search, 36) + '</div>' +
          '<h2>Nothing here yet</h2><p>Messages you draft, schedule, or send will appear in this list.</p></div>') +
      '</section>';

    document.querySelectorAll('[data-msg-filter]').forEach(function (b) {
      b.addEventListener('click', function () { msgFilter = b.getAttribute('data-msg-filter'); renderMessages(); });
    });
    var hs = document.getElementById('histSearch');
    hs.addEventListener('input', function () {
      histSearch = hs.value;
      var pos = hs.selectionStart;
      renderMessages();
      var again = document.getElementById('histSearch');
      again.focus(); try { again.setSelectionRange(pos, pos); } catch (err) {}
    });
    document.querySelectorAll('[data-resume]').forEach(function (b) {
      b.addEventListener('click', function () {
        var e = C.MESSAGES.filter(function (m) { return String(m.id) === b.getAttribute('data-resume'); })[0];
        if (e && window.CommsCompose) window.CommsCompose.resumeDraft(e);
      });
    });
    document.querySelectorAll('[data-cancel]').forEach(function (b) {
      b.addEventListener('click', function () {
        var e = C.MESSAGES.filter(function (m) { return String(m.id) === b.getAttribute('data-cancel'); })[0];
        confirmCancel(e);
      });
    });
    document.querySelectorAll('[data-resend]').forEach(function (b) {
      b.addEventListener('click', function () {
        C.showToast('Copied into Compose', 'Review the audience and message, then send again.');
        document.querySelector('.tab[data-comm-tab="compose"]').click();
      });
    });
  }

  // Cancelling a queued send is the promise the schedule option makes, so it
  // gets a real confirmation rather than a silent state flip.
  function confirmCancel(e) {
    C.overlay().innerHTML =
      '<div class="alert-dialog" role="alertdialog">' +
        '<div class="ad-title">Cancel this scheduled message?</div>' +
        '<div class="ad-body">It is queued for ' + e.recipients + ' people (' + C.esc(e.sentAt) + '). ' +
          'Cancelling keeps it as a draft so you can edit and send it later.</div>' +
        '<div class="ad-footer">' +
          '<button class="btn btn-soft" data-close>Keep it scheduled</button>' +
          '<button class="btn btn-solid is-danger" id="cancelConfirm">Cancel send</button>' +
        '</div></div>';
    C.overlay().hidden = false;
    C.overlay().querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', C.closeModal); });
    document.getElementById('cancelConfirm').addEventListener('click', function () {
      e.status = 'draft';
      e.sentAt = 'Edited Jul 27 at 3:55 PM';
      C.closeModal();
      renderMessages();
      C.showToast('Send cancelled', 'Saved as a draft. Nothing was sent.');
    });
  }

  // ---- Templates ----
  function renderTemplates() {
    var cards = C.TEMPLATES.map(function (t) {
      var hasEmail = t.emailSubject && t.emailBody;
      return '<article class="tmpl-card">' +
        '<div style="display:flex;align-items:flex-start;gap:var(--space-2);">' +
          '<div style="flex:1;min-width:0;">' +
            '<div class="t-4 fw-bold" style="color:var(--fg-high);">' + C.esc(t.name) + '</div>' +
            '<div style="margin-top:var(--space-1);"><span class="badge is-neutral">' +
              (t.shared ? 'Shared' : 'Only you') + '</span></div>' +
          '</div>' +
          '<button class="btn btn-ghost is-sm is-icon" data-tmpl-menu="' + t.id + '" aria-label="Actions for ' + C.esc(t.name) + '" aria-expanded="false">' +
            C.icon('<circle cx="12" cy="12" r="1" /> <circle cx="12" cy="5" r="1" /> <circle cx="12" cy="19" r="1" />') +
          '</button>' +
        '</div>' +
        '<div class="tmpl-text">' + C.esc(t.sms) + '</div>' +
        (!hasEmail ? '<div class="t-1" style="color:var(--warning-text);margin-bottom:var(--space-2);">No email content yet</div>' : '') +
        '<button class="btn btn-surface is-sm" data-use="' + t.id + '" style="align-self:flex-start;">Use in Compose</button>' +
      '</article>';
    }).join('');

    document.getElementById('panel-templates').innerHTML =
      '<p class="t-2" style="color:var(--fg-low);margin:0 0 var(--space-4);">' +
        'Reusable messages. Shared templates are visible to everyone who can send at skypoint.</p>' +
      '<div class="card-grid">' +
        '<button class="tmpl-new" id="newTmpl">' + C.icon(C.I.plus, 24) +
          '<span class="t-2 fw-medium">New template</span>' +
          '<span class="t-1" style="color:var(--fg-subtle);">Start from a blank message</span>' +
        '</button>' + cards +
      '</div>';

    document.getElementById('newTmpl').addEventListener('click', function () { openTemplateForm(null); });
    document.querySelectorAll('[data-use]').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = C.TEMPLATES.filter(function (x) { return String(x.id) === b.getAttribute('data-use'); })[0];
        if (t && window.CommsCompose) window.CommsCompose.loadTemplate(t);
      });
    });
    document.querySelectorAll('[data-tmpl-menu]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); openTmplMenu(b); });
    });
  }

  // Edit and Delete sit behind an overflow so the card leads with its content
  // and one primary action.
  function openTmplMenu(btn) {
    closeTmplMenu();
    var t = C.TEMPLATES.filter(function (x) { return String(x.id) === btn.getAttribute('data-tmpl-menu'); })[0];
    var pop = document.createElement('div');
    pop.className = 'popover';
    pop.id = 'tmplMenu';
    pop.style.minWidth = '160px';
    pop.innerHTML =
      '<button class="list-item" data-act="edit">' + C.icon(C.I.pencil) + ' Edit</button>' +
      '<button class="list-item" data-act="delete" style="color:var(--danger-text);">' + C.icon(C.I.trash) + ' Delete</button>';
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
      var a = e.target.closest('[data-act]');
      if (!a) return;
      e.stopPropagation();
      var act = a.getAttribute('data-act');
      closeTmplMenu();
      if (act === 'edit') openTemplateForm(t);
      if (act === 'delete') confirmDelete(t);
    });
    setTimeout(function () { document.addEventListener('click', closeTmplMenu, { once: true }); }, 0);
  }
  function closeTmplMenu() {
    var m = document.getElementById('tmplMenu');
    if (m) m.remove();
    document.querySelectorAll('[data-tmpl-menu]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTmplMenu(); });

  function openTemplateForm(t) {
    var isEdit = !!t;
    var v = t || { name: '', sms: '', emailSubject: '', emailBody: '', shared: false };
    C.overlay().innerHTML =
      '<div class="modal" style="padding:var(--space-5);">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">' +
          '<span class="t-5 fw-bold">' + (isEdit ? 'Edit template' : 'New template') + '</span>' +
          '<button class="btn btn-ghost is-sm is-icon" data-close aria-label="Close">' + C.icon(C.I.x) + '</button>' +
        '</div>' +
        '<label class="field" style="margin-bottom:var(--space-4);"><span class="field-label">Name <span class="req">*</span></span>' +
          '<input class="input" id="tName" value="' + C.esc(v.name) + '">' +
          '<span class="field-hint is-error" id="tNameErr" hidden>Give the template a name</span></label>' +
        '<label class="field"><span class="field-label">SMS and push message <span class="req">*</span></span>' +
          '<textarea class="textarea" id="tSms" rows="3">' + C.esc(v.sms) + '</textarea>' +
          '<span class="field-hint" id="tSmsHint"></span>' +
          '<span class="field-hint is-error" id="tSmsErr" hidden>Enter the SMS message</span></label>' +
        '<label class="field" style="margin-top:var(--space-4);"><span class="field-label">Email subject</span>' +
          '<input class="input" id="tSubj" value="' + C.esc(v.emailSubject) + '"></label>' +
        '<label class="field" style="margin-top:var(--space-3);"><span class="field-label">Email body</span>' +
          '<textarea class="textarea" id="tBody" rows="6">' + C.esc(v.emailBody) + '</textarea>' +
          '<span class="field-hint">Leave email blank to make this an SMS and push only template.</span></label>' +
        '<label class="checkbox" style="margin-top:var(--space-4);"><input type="checkbox" id="tShared"' + (v.shared ? ' checked' : '') + '> Share with everyone who can send at skypoint</label>' +
        '<div class="dialog-footer">' +
          '<button class="btn btn-soft" data-close>Cancel</button>' +
          '<button class="btn btn-solid" id="tSave">' + (isEdit ? 'Save template' : 'Create template') + '</button>' +
        '</div>' +
      '</div>';
    C.overlay().hidden = false;

    function updateHint() {
      var txt = document.getElementById('tSms').value;
      var r = C.segmentRange(txt, C.PEOPLE);
      var bad = C.unknownTokens(txt);
      var el = document.getElementById('tSmsHint');
      el.textContent = !txt ? 'Merge fields expand at send time, so length varies per person.'
        : (r.min === r.max ? r.min + ' SMS segment' + (r.min === 1 ? '' : 's') + ' for everyone.'
           : r.min + ' to ' + r.max + ' SMS segments depending on the recipient.');
      el.classList.toggle('is-error', bad.length > 0);
      if (bad.length) el.textContent = 'Unknown merge field: ' + bad.map(function (b) { return '{' + b + '}'; }).join(', ');
    }
    document.getElementById('tSms').addEventListener('input', updateHint);
    updateHint();

    C.overlay().querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', C.closeModal); });
    document.getElementById('tSave').addEventListener('click', function () {
      var name = document.getElementById('tName').value.trim();
      var sms = document.getElementById('tSms').value.trim();
      var ok = true;
      document.getElementById('tNameErr').hidden = !!name; if (!name) ok = false;
      document.getElementById('tSmsErr').hidden = !!sms; if (!sms) ok = false;
      if (!ok) return;
      var payload = {
        name: name, sms: sms,
        emailSubject: document.getElementById('tSubj').value.trim(),
        emailBody: document.getElementById('tBody').value.trim(),
        shared: document.getElementById('tShared').checked
      };
      if (isEdit) { Object.assign(t, payload); }
      else { payload.id = Math.max.apply(null, C.TEMPLATES.map(function (x) { return x.id; })) + 1; C.TEMPLATES.push(payload); }
      document.getElementById('templateCount').textContent = C.TEMPLATES.length;
      C.closeModal();
      renderTemplates();
      C.showToast(isEdit ? 'Template saved' : 'Template created', name + ' is ready to use in Compose.');
    });
  }

  function confirmDelete(t) {
    C.overlay().innerHTML =
      '<div class="alert-dialog" role="alertdialog">' +
        '<div class="ad-title">Delete "' + C.esc(t.name) + '"?</div>' +
        '<div class="ad-body">' + (t.shared
          ? 'This template is shared, so it will be removed for everyone who can send at skypoint.'
          : 'This removes the template from your list.') +
          ' Messages already sent with it are not affected.</div>' +
        '<div class="ad-footer">' +
          '<button class="btn btn-soft" data-close>Cancel</button>' +
          '<button class="btn btn-solid is-danger" id="delConfirm">Delete template</button>' +
        '</div>' +
      '</div>';
    C.overlay().hidden = false;
    C.overlay().querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', C.closeModal); });
    document.getElementById('delConfirm').addEventListener('click', function () {
      var i = C.TEMPLATES.indexOf(t);
      if (i > -1) C.TEMPLATES.splice(i, 1);
      document.getElementById('templateCount').textContent = C.TEMPLATES.length;
      C.closeModal();
      renderTemplates();
      C.showToast('Template deleted', t.name + ' was removed.');
    });
  }

  window.CommsLog = { renderMessages: renderMessages, renderTemplates: renderTemplates };
  document.addEventListener('DOMContentLoaded', function () { renderMessages(); renderTemplates(); });
})();
