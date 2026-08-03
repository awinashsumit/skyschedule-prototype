/* ============================================================
   skySchedule mobile - Messages
   Compose is the longest flow in the product and the one most
   likely to be run on a phone in a corridor, so it keeps the
   desktop's two guarantees: a readiness checklist that says what
   is missing before you can send, and a review step that shows
   the rendered message, the real per-channel reach and the SMS
   cost. Nothing sends without passing both.
   ============================================================ */
(function (w, d) {
  'use strict';
  var S = w.SS, A = w.APP;
  var $ = A.$, $$ = A.$$, esc = A.esc, icon = A.icon;

  var pane = 'templates';

  A.register('messages', function () {
    $$('#msgSeg .m-segmented-item').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-pane') === pane);
    });
    var body = $('#msgBody');
    body.innerHTML = pane === 'templates' ? templatesHtml() : sentHtml();
    body.scrollTop = 0;

    $$('[data-tpl]', body).forEach(function (el) {
      el.addEventListener('click', function () { openTemplate(+el.getAttribute('data-tpl')); });
    });
    $$('[data-msg]', body).forEach(function (el) {
      el.addEventListener('click', function () { openMessage(+el.getAttribute('data-msg')); });
    });
    $$('[data-use]', body).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        compose({ template: S.TEMPLATES.filter(function (t) { return t.id === +el.getAttribute('data-use'); })[0] });
      });
    });
  });

  function templatesHtml() {
    return '<div class="m-intro">' +
      'Start from a template rather than writing an SMS and an email from scratch.</div>' +
      '<div class="m-stack">' + S.TEMPLATES.map(function (t) {
        var sms = S.smsInfo(t.sms);
        return '<div class="m-card m-list-item state-layer" data-tpl="' + t.id + '" style="align-items:flex-start;padding:var(--m-card-pad);">' +
          '<span class="m-li-text">' +
            '<span class="m-li-title">' + esc(t.name) + '</span>' +
            '<span class="m-li-sub">' + (t.shared ? 'Shared · ' : 'Only you · ') +
              'Used ' + t.usedCount + ' times · last ' + esc(t.lastUsed) + '</span>' +
            '<span class="m-li-sub" style="margin-top:4px;color:var(--fg-subtle);">' +
              sms.parts + ' SMS part' + (sms.parts === 1 ? '' : 's') + ' · ' + sms.chars + ' chars</span>' +
          '</span>' +
          '<span class="m-li-trail">' +
            '<button class="m-btn m-btn-tonal state-layer u-inset" data-use="' + t.id + '" >Use</button>' +
          '</span></div>';
      }).join('') + '</div>' +
      '<div class="m-footer-action"><button class="m-btn m-btn-outlined state-layer u-full" id="newTpl" >' +
      icon('plus', 18, 2) + ' New template</button></div>';
  }

  function sentHtml() {
    var groups = [
      { key: 'draft', label: 'Drafts' },
      { key: 'scheduled', label: 'Scheduled' },
      { key: 'sent', label: 'Sent' }
    ];
    var h = [];
    groups.forEach(function (g) {
      var list = S.MESSAGES.filter(function (m) { return m.status === g.key; });
      if (!list.length) return;
      h.push('<div class="m-group"><div class="m-list-header m-sticky">' + g.label + '</div>' +
        '<div class="m-stack"><div class="m-card is-rows">');
      h.push(list.map(function (m) {
        var delivered = m.channels.sms.delivered + m.channels.email.delivered + m.channels.push.delivered;
        var failed = m.channels.sms.failed + m.channels.email.failed + m.channels.push.failed;
        var sub = m.status === 'sent'
          ? m.recipients + ' recipients · ' + delivered + ' delivered' + (failed ? ' · ' + failed + ' failed' : '')
          : m.status === 'scheduled' ? 'Goes out ' + m.sentAt : m.sentAt;
        return '<div class="m-list-item state-layer" data-msg="' + m.id + '">' +
          '<span class="m-li-lead"><span class="m-avatar is-sm av-' + m.senderAvatar + '">' + esc(m.senderInitials) + '</span></span>' +
          '<span class="m-li-text">' +
            '<span class="m-li-title u-truncate">' + esc(m.rendered) + '</span>' +
            '<span class="m-li-sub">' + esc(sub) + '</span></span>' +
          '<span class="m-li-trail">' +
            (m.status === 'sent' ? (failed ? A.badge('unfulfilled').replace('Unfulfilled', 'Issues') : '')
              : m.status === 'scheduled' ? '<span class="m-badge is-info">Scheduled</span>'
              : '<span class="m-badge is-neutral">Draft</span>') +
            icon('chevron', 20) + '</span></div>';
      }).join('') + '</div></div></div>');
    });
    return h.join('');
  }

  /* ---- Template detail --------------------------------------------- */
  function openTemplate(id) {
    var t = S.TEMPLATES.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var sample = S.BFMS[0];
    var sms = S.smsInfo(t.sms);
    A.fullscreen({
      title: t.name, back: true, onBack: function () {}, flush: true,
      body:
        '<div class="m-sec-head"><h2>SMS</h2><span class="m-sec-sub">' + sms.parts + ' part' + (sms.parts === 1 ? '' : 's') + ' · ' + sms.encoding + '</span></div>' +
        '<div class="u-inset"><div class="m-review-msg">' + esc(t.sms) + '</div></div>' +
        '<div class="m-note">As ' + esc(sample.first) + ' receives it:</div>' +
        '<div class="u-inset"><div class="m-review-msg" style="background:var(--accent-3);">' +
          esc(S.renderTokens(t.sms, sample)) + '</div></div>' +
        '<div class="m-sec-head"><h2>Email</h2></div>' +
        A.kv('Subject', t.emailSubject) +
        '<div style="padding:var(--space-3) var(--m-inset);"><div class="m-review-msg">' + esc(t.emailBody) + '</div></div>' +
        '<div class="m-sec-head"><h2>Merge fields</h2></div>' +
        '<div style="padding:0 var(--m-inset) var(--space-5);display:flex;flex-wrap:wrap;gap:var(--space-2);">' +
          tokensIn(t.sms + ' ' + t.emailSubject + ' ' + t.emailBody).map(function (k) {
            return '<span class="m-badge is-neutral">{' + esc(k) + '}</span>';
          }).join('') + '</div>' +
        '<div class="m-stack is-bottom">' + A.card(
          A.kv('Visibility', t.shared ? 'Shared with the team' : 'Only you') +
          A.kv('Used', t.usedCount + ' times, last on ' + t.lastUsed)) + '</div>',
      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-edit >Edit</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-use >Use this</button>',
      wire: function (n) {
        $('[data-use]', n).addEventListener('click', function () { A.pop(); compose({ template: t }); });
        $('[data-edit]', n).addEventListener('click', function () { A.snack('Template editing opens on the desktop for now'); });
      }
    });
  }

  function tokensIn(text) {
    var out = [], m, re = /\{(\w+)\}/g;
    while ((m = re.exec(text))) if (out.indexOf(m[1]) === -1) out.push(m[1]);
    return out;
  }

  /* ---- Sent message detail ----------------------------------------- */
  function openMessage(id) {
    var m = S.MESSAGES.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var ch = m.channels;
    function chRow(label, c) {
      if (!c.sent && m.status === 'sent') return A.kv(label, 'Not used');
      return '<div class="m-kv"><span class="m-kv-k">' + label + '</span><span class="m-kv-v">' +
        (m.status === 'sent'
          ? c.delivered + ' of ' + c.sent + ' delivered' + (c.failed ? ' · ' + c.failed + ' failed' : '')
          : c.sent + ' queued') + '</span></div>';
    }
    A.fullscreen({
      title: m.status === 'sent' ? 'Sent message' : m.status === 'scheduled' ? 'Scheduled message' : 'Draft',
      back: true, onBack: function () {}, flush: true,
      trail: m.status === 'sent' ? '' : '<span class="m-badge is-' + (m.status === 'scheduled' ? 'info' : 'neutral') + '">' +
        (m.status === 'scheduled' ? 'Scheduled' : 'Draft') + '</span>',
      body:
        '<div style="padding:var(--m-inset);"><div class="m-review-msg">' + esc(m.rendered) + '</div></div>' +
        A.kv(m.status === 'sent' ? 'Sent' : m.status === 'scheduled' ? 'Goes out' : 'Last edited', m.sentAt) +
        A.kv('By', m.sender) + A.kv('Audience', m.audience) +
        A.kv('Template', m.templateName || 'Written from scratch') +
        A.kv('Recipients', String(m.recipients)) +
        '<div class="m-sec-head"><h2>Delivery</h2></div>' +
        '<div class="m-stack">' + A.card(chRow('SMS', ch.sms) + chRow('Email', ch.email) + chRow('Push', ch.push)) + '</div>' +
        (ch.sms.failed
          ? '<div class="m-alert is-warning u-mt-3">' + icon('warn', 18) +
            '<span>' + ch.sms.failed + ' SMS failed. The number was unreachable at the carrier. Email still went through.</span></div>'
          : ''),
      actions: m.status === 'draft'
        ? '<button class="m-btn m-btn-outlined state-layer u-grow" data-del >Delete</button>' +
          '<button class="m-btn m-btn-filled state-layer u-grow" data-resume >Continue</button>'
        : m.status === 'scheduled'
        ? '<button class="m-btn m-btn-danger state-layer u-grow" data-cancel >Cancel send</button>'
        : '<button class="m-btn m-btn-outlined state-layer u-grow" data-again >Send again</button>',
      wire: function (n) {
        var c = $('[data-cancel]', n);
        if (c) c.addEventListener('click', function () {
          A.dialog({ title: 'Cancel this send?', body: 'It goes back to Drafts. Nobody has received it yet.',
            confirm: 'Cancel send', danger: true, onConfirm: function () {
              m.status = 'draft'; m.sentAt = 'Edited Aug 3 at 9:14 AM';
              A.pop(); A.render(); A.snack('Send cancelled, saved as a draft');
            } });
        });
        var del = $('[data-del]', n);
        if (del) del.addEventListener('click', function () {
          var i = S.MESSAGES.indexOf(m);
          S.MESSAGES.splice(i, 1); A.pop(); A.render();
          A.snack('Draft deleted', 'Undo', function () { S.MESSAGES.splice(i, 0, m); A.render(); });
        });
        var r = $('[data-resume]', n);
        if (r) r.addEventListener('click', function () { A.pop(); compose({ resume: m }); });
        var ag = $('[data-again]', n);
        if (ag) ag.addEventListener('click', function () { A.pop(); compose({}); });
      }
    });
  }

  /* ============================================================
     COMPOSE
     A readiness checklist rather than a wizard. Each row opens the
     one thing it owns; nothing is gated behind step order, so you
     can fill in whatever you know first. The Review button stays
     disabled until every required row is green.
     ============================================================ */
  function compose(opts) {
    opts = opts || {};
    var t = opts.template;
    var m = {
      audience: null,           // { label, people: [] }
      channels: { sms: true, email: true, push: false },
      sms: t ? t.sms : '',
      subject: t ? t.emailSubject : '',
      emailBody: t ? t.emailBody : '',
      when: 'now',              // 'now' | 'later'
      whenLabel: 'As soon as you send',
      templateName: t ? t.name : null
    };

    /* Preset audiences map to the same scopes the desktop offers, plus a
       manual picker. Each carries the actual people so reach is real. */
    function audiences() {
      var everyone = S.BFMS.filter(function (b) { return b.account === 'active'; });
      var weekPeople = uniq(S.SHIFTS.filter(function (s) { return s.bfmId; }).map(function (s) { return S.byId(s.bfmId); }));
      var todayPeople = uniq(S.shiftsOn(S.TODAY).filter(function (s) { return s.bfmId; }).map(function (s) { return S.byId(s.bfmId); }));
      var openQualified = uniq(S.exceptions().reduce(function (acc, s) {
        return acc.concat(S.candidatesFor(s).filter(function (c) { return c.available; }).map(function (c) { return c.bfm; }));
      }, []));
      return [
        { id: 'week', label: "This week's schedule", people: weekPeople },
        { id: 'today', label: 'On shift today', people: todayPeople },
        { id: 'open', label: 'Anyone who could take an open shift', people: openQualified },
        { id: 'everyone', label: 'Everyone active', people: everyone }
      ];
    }
    function uniq(arr) {
      var seen = {}, out = [];
      arr.forEach(function (b) { if (b && !seen[b.id]) { seen[b.id] = 1; out.push(b); } });
      return out;
    }

    if (opts.scope === 'person' && opts.bfm) {
      m.audience = { label: S.fullName(opts.bfm), people: [opts.bfm] };
    } else if (opts.scope === 'shift' && opts.shift) {
      var b = S.byId(opts.shift.bfmId);
      if (b) m.audience = { label: 'Assigned to shift #' + opts.shift.id, people: [b] };
    }

    /* Each check returns ok plus the sentence shown under its label, so the
       checklist explains what is wrong instead of only that something is. */
    function checks() {
      var reach = m.audience ? S.reachOf(m.audience.people) : null;
      var out = [];
      out.push({ key: 'audience', label: 'Audience',
        ok: !!(m.audience && m.audience.people.length),
        sub: m.audience
          ? m.audience.label + ' · ' + m.audience.people.length + (m.audience.people.length === 1 ? ' person' : ' people')
          : 'Choose who receives this' });

      var anyCh = m.channels.sms || m.channels.email || m.channels.push;
      var chNames = [];
      if (m.channels.sms) chNames.push('SMS');
      if (m.channels.email) chNames.push('Email');
      if (m.channels.push) chNames.push('Push');
      out.push({ key: 'channels', label: 'Channels', ok: anyCh,
        sub: anyCh ? chNames.join(', ') + (reach ? ' · reaches ' + reachCount(reach) + ' of ' + reach.total : '')
          : 'Pick at least one way to reach them' });

      if (m.channels.sms) {
        var info = S.smsInfo(m.sms);
        var unknown = S.unknownTokens(m.sms);
        out.push({ key: 'sms', label: 'SMS message',
          ok: !!m.sms.trim() && !unknown.length,
          sub: !m.sms.trim() ? 'Write the text message'
            : unknown.length ? 'Unknown merge field {' + unknown[0] + '}'
            : info.chars + ' chars · ' + info.parts + ' part' + (info.parts === 1 ? '' : 's') + ' · ' + info.encoding });
      }
      if (m.channels.email) {
        var un2 = S.unknownTokens(m.subject + ' ' + m.emailBody);
        out.push({ key: 'email', label: 'Email',
          ok: !!m.subject.trim() && !!m.emailBody.trim() && !un2.length,
          sub: !m.subject.trim() ? 'Add a subject line'
            : !m.emailBody.trim() ? 'Add an email body'
            : un2.length ? 'Unknown merge field {' + un2[0] + '}'
            /* Resolved, not raw: a summary line reading "training on {date}"
               tells the user nothing about what will actually arrive. */
            : S.renderTokens(m.subject, m.audience && m.audience.people[0]) });
      }
      out.push({ key: 'when', label: 'Send time', ok: true, sub: m.whenLabel });
      return out;
    }
    function reachCount(r) {
      var n = 0;
      if (m.channels.sms) n = Math.max(n, r.sms);
      if (m.channels.email) n = Math.max(n, r.email);
      if (m.channels.push) n = Math.max(n, r.push);
      return n;
    }

    function bodyHtml() {
      var c = checks();
      var done = c.filter(function (x) { return x.ok; }).length;
      var pct = Math.round((done / c.length) * 100);
      return '<div style="padding:var(--space-4) var(--space-4) var(--space-2);">' +
          '<div style="display:flex;justify-content:space-between;font-size:var(--m-fs-body);font-weight:var(--weight-medium);margin-bottom:var(--space-2);">' +
            '<span>' + done + ' of ' + c.length + ' ready</span>' +
            (m.templateName ? '<span style="color:var(--fg-low);font-weight:var(--weight-regular);">From ' + esc(m.templateName) + '</span>' : '') +
          '</div>' +
          '<div class="m-progress"><div class="m-progress-fill" style="width:' + pct + '%;"></div></div>' +
        '</div>' +
        '<div class="m-stack"><div class="m-card is-rows">' + c.map(function (x) {
          return '<button class="m-ready-row state-layer" data-open="' + x.key + '">' +
            '<span class="m-ready-icon">' + icon(x.ok ? 'checkCircle' : 'warn', 24, x.ok ? 'success' : 'danger') + '</span>' +
            '<span class="m-ready-text"><span class="m-ready-label">' + esc(x.label) + '</span>' +
            '<span class="m-ready-sub' + (x.ok ? '' : ' is-error') + '">' + esc(x.sub) + '</span></span>' +
            icon('chevron', 20) + '</button>';
        }).join('') + '</div></div>' +
        (m.audience ? reachHtml(S.reachOf(m.audience.people)) : '');
    }

    /* Reach is shown on the checklist, not only at review, because finding
       out two people have no phone after writing the SMS is too late. */
    function reachHtml(r) {
      var rows = [];
      if (m.channels.sms) rows.push(['SMS ' + r.sms + ' of ' + r.total, r.smsWhy.join(', '), r.sms === r.total]);
      if (m.channels.email) rows.push(['Email ' + r.email + ' of ' + r.total, '', r.email === r.total]);
      if (m.channels.push) rows.push(['Push ' + r.push + ' of ' + r.total, r.pushWhy.join(', '), r.push === r.total]);
      if (!rows.length) return '';
      return '<div class="m-sec-head"><h2>Who this reaches</h2></div>' +
        '<div class="m-stack is-bottom"><div class="m-card"><div class="m-reach">' +
        rows.map(function (x) {
          return '<div class="m-reach-row is-' + (x[2] ? 'ok' : 'blocked') + '">' +
            '<span class="m-reach-label">' + esc(x[0]) + '</span>' +
            (x[1] ? '<span class="m-reach-why">' + esc(x[1]) + '</span>' : '') + '</div>';
        }).join('') + '</div></div></div>';
    }

    var node = A.fullscreen({
      title: 'New message', flush: true,
      trail: '<span class="m-badge is-neutral">Draft</span>',
      body: bodyHtml(),
      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-later >Finish later</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-goreview >Review</button>',
      wire: function (n) {
        function refresh() {
          $('#fsBody', n).innerHTML = bodyHtml();
          attach();
          var ready = checks().every(function (x) { return x.ok; });
          var rv = $('[data-goreview]', n);
          rv.disabled = !ready;
          rv.title = ready ? '' : 'Finish the red rows first';
        }
        function attach() {
          $$('[data-open]', n).forEach(function (r) {
            r.addEventListener('click', function () { openSection(r.getAttribute('data-open'), refresh); });
          });
        }
        function openSection(key, done) {
          if (key === 'audience') return audienceSheet(done);
          if (key === 'channels') return channelSheet(done);
          if (key === 'sms') return smsEditor(done);
          if (key === 'email') return emailEditor(done);
          if (key === 'when') return whenSheet(done);
        }

        function audienceSheet(done) {
          var presets = audiences();
          A.sheet({
            title: 'Audience',
            rows: presets.map(function (p) {
              return { value: p.id, title: p.label, sub: p.people.length + (p.people.length === 1 ? ' person' : ' people'),
                selected: m.audience && m.audience.label === p.label };
            }).concat([{ value: '__pick', title: 'Choose people individually', sub: 'Pick from the roster' }]),
            onPick: function (v) {
              if (v === '__pick') return pickPeople(done);
              var p = presets.filter(function (x) { return x.id === v; })[0];
              m.audience = { label: p.label, people: p.people };
              done();
            }
          });
        }

        function pickPeople(done) {
          var chosen = {};
          (m.audience ? m.audience.people : []).forEach(function (b) { chosen[b.id] = true; });
          var active = S.BFMS.filter(function (b) { return b.account === 'active'; });
          A.sheet({
            title: 'Choose people',
            body: '<div id="pickList">' + active.map(function (b) {
              return '<button class="m-pick' + (chosen[b.id] ? ' is-selected' : '') + '" data-id="' + b.id + '" style="border-left:0;border-right:0;">' +
                A.avatar(b, true) +
                '<span class="m-pick-text"><span class="m-pick-title">' + esc(S.fullName(b)) + '</span>' +
                '<span class="m-pick-sub">' + esc(b.primary) + (b.phone ? '' : ' · no mobile number') + '</span></span>' +
                '<span class="m-pick-check">' + icon('check', 20, 2) + '</span></button>';
            }).join('') + '</div>',
            actions: '<button class="m-btn m-btn-outlined state-layer" data-close>Cancel</button>' +
                     '<button class="m-btn m-btn-filled state-layer" data-ok><span id="pickCount">' +
                     Object.keys(chosen).length + '</span> selected</button>',
            wire: function (sn) {
              $$('.m-pick', sn).forEach(function (bn) {
                bn.addEventListener('click', function () {
                  var id = +bn.getAttribute('data-id');
                  chosen[id] = !chosen[id];
                  if (!chosen[id]) delete chosen[id];
                  bn.classList.toggle('is-selected', !!chosen[id]);
                  $('#pickCount', sn).textContent = Object.keys(chosen).length;
                });
              });
              $('[data-ok]', sn).addEventListener('click', function () {
                var people = active.filter(function (b) { return chosen[b.id]; });
                if (!people.length) { A.snack('Choose at least one person'); return; }
                m.audience = { label: people.length + ' selected', people: people };
                A.pop(); done();
              });
            }
          });
        }

        function channelSheet(done) {
          var r = m.audience ? S.reachOf(m.audience.people) : null;
          A.sheet({
            title: 'Channels',
            sub: 'Everyone reachable on any selected channel gets the message once.',
            body: ['sms', 'email', 'push'].map(function (k) {
              var label = k === 'sms' ? 'SMS' : k === 'email' ? 'Email' : 'Push notification';
              var sub = !r ? 'Choose an audience to see reach'
                : k === 'sms' ? r.sms + ' of ' + r.total + ' reachable' + (r.smsWhy.length ? ' · ' + r.smsWhy.join(', ') : '')
                : k === 'email' ? r.email + ' of ' + r.total + ' reachable'
                : r.push + ' of ' + r.total + ' reachable' + (r.pushWhy.length ? ' · ' + r.pushWhy.join(', ') : '');
              return '<label class="m-switch" style="gap:var(--space-3);justify-content:space-between;width:100%;padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);">' +
                '<span class="u-grow"><span style="display:block;font-size:var(--m-fs-body);font-weight:var(--weight-medium);">' + label + '</span>' +
                '<span class="u-meta-low">' + esc(sub) + '</span></span>' +
                '<input type="checkbox" data-ch="' + k + '"' + (m.channels[k] ? ' checked' : '') + ' /></label>';
            }).join('') +
            (m.channels.sms && m.sms ? '<div style="margin-top:var(--space-3);font-size:var(--m-fs-meta);color:var(--fg-low);">' +
              'SMS is billed per part. At ' + S.smsInfo(m.sms).parts + ' part' + (S.smsInfo(m.sms).parts === 1 ? '' : 's') +
              ' this send costs ' + (r ? r.sms * S.smsInfo(m.sms).parts : 0) + ' segments.</div>' : ''),
            actions: '<button class="m-btn m-btn-filled state-layer" data-close>Done</button>',
            wire: function (sn) {
              $$('[data-ch]', sn).forEach(function (c) {
                c.addEventListener('change', function () { m.channels[c.getAttribute('data-ch')] = c.checked; done(); });
              });
            }
          });
        }

        function smsEditor(done) {
          var sample = m.audience && m.audience.people[0];
          A.fullscreen({
            title: 'SMS message', back: true, onBack: done,
            body: '<label class="m-field"><span class="m-field-label">Message</span>' +
                '<textarea class="m-textarea" id="smsText" rows="5" placeholder="Keep it short. SMS is billed per part.">' + esc(m.sms) + '</textarea>' +
                '<span class="m-field-hint" id="smsMeta"></span></label>' +
              '<div class="m-sec-head" ><h2>Merge fields</h2></div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);">' +
                ['firstName', 'position', 'location', 'date', 'shiftDate', 'shiftWindow', 'link', 'org'].map(function (k) {
                  return '<button class="m-chip state-layer" data-token="' + k + '">{' + k + '}</button>';
                }).join('') + '</div>' +
              '<div class="m-sec-head" ><h2>Preview</h2>' +
                (sample ? '<span class="m-sec-sub">as ' + esc(sample.first) + '</span>' : '') + '</div>' +
              '<div class="m-review-msg" id="smsPreview"></div>',
            actions: '<button class="m-btn m-btn-filled state-layer u-grow" data-save >Done</button>',
            wire: function (fn) {
              var ta = $('#smsText', fn);
              function upd() {
                m.sms = ta.value;
                var info = S.smsInfo(m.sms);
                var unknown = S.unknownTokens(m.sms);
                var meta = $('#smsMeta', fn);
                meta.textContent = info.chars + ' of ' + info.limit + ' · ' + info.parts +
                  ' part' + (info.parts === 1 ? '' : 's') + ' · ' + info.encoding +
                  (unknown.length ? ' · unknown field {' + unknown[0] + '}' : '');
                meta.classList.toggle('is-error', !!unknown.length);
                $('#smsPreview', fn).textContent = S.renderTokens(m.sms, sample) || 'Nothing written yet.';
              }
              ta.addEventListener('input', upd);
              $$('[data-token]', fn).forEach(function (c) {
                c.addEventListener('click', function () {
                  var tok = '{' + c.getAttribute('data-token') + '}';
                  var at = ta.selectionStart || ta.value.length;
                  ta.value = ta.value.slice(0, at) + tok + ta.value.slice(ta.selectionEnd || at);
                  ta.focus(); ta.selectionStart = ta.selectionEnd = at + tok.length;
                  upd();
                });
              });
              $('[data-save]', fn).addEventListener('click', function () { A.pop(); done(); });
              upd();
            }
          });
        }

        function emailEditor(done) {
          var sample = m.audience && m.audience.people[0];
          A.fullscreen({
            title: 'Email', back: true, onBack: done,
            body: '<label class="m-field"><span class="m-field-label">Subject</span>' +
                '<input class="m-input" id="emSub" value="' + esc(m.subject) + '" placeholder="Subject line" />' +
                '<span class="m-field-hint is-error" id="emSubErr" hidden>Add a subject line</span></label>' +
              '<label class="m-field u-mt-4"><span class="m-field-label">Body</span>' +
                '<textarea class="m-textarea" id="emBody" rows="8">' + esc(m.emailBody) + '</textarea></label>' +
              '<div class="m-sec-head" ><h2>Preview</h2>' +
                (sample ? '<span class="m-sec-sub">as ' + esc(sample.first) + '</span>' : '') + '</div>' +
              '<div style="font-size:var(--m-fs-body);font-weight:var(--weight-bold);margin-bottom:var(--space-2);" id="emSubPrev"></div>' +
              '<div class="m-review-msg" id="emBodyPrev"></div>',
            actions: '<button class="m-btn m-btn-filled state-layer u-grow" data-save >Done</button>',
            wire: function (fn) {
              var s = $('#emSub', fn), b2 = $('#emBody', fn);
              function upd() {
                m.subject = s.value; m.emailBody = b2.value;
                $('#emSubErr', fn).hidden = !!m.subject.trim();
                $('#emSubPrev', fn).textContent = S.renderTokens(m.subject, sample) || 'No subject';
                $('#emBodyPrev', fn).textContent = S.renderTokens(m.emailBody, sample) || 'Nothing written yet.';
              }
              s.addEventListener('input', upd); b2.addEventListener('input', upd);
              $('[data-save]', fn).addEventListener('click', function () { A.pop(); done(); });
              upd();
            }
          });
        }

        function whenSheet(done) {
          A.sheet({
            title: 'Send time',
            rows: [
              { value: 'now', title: 'Send now', sub: 'Goes out as soon as you confirm', selected: m.when === 'now' },
              { value: 'shift', title: 'Tomorrow at 6:00 AM', sub: 'Before the early shift starts', selected: m.whenLabel === 'Tomorrow at 6:00 AM' },
              { value: 'evening', title: 'Today at 5:00 PM', sub: 'End of the day shift', selected: m.whenLabel === 'Today at 5:00 PM' }
            ],
            onPick: function (v) {
              m.when = v === 'now' ? 'now' : 'later';
              m.whenLabel = v === 'now' ? 'As soon as you send'
                : v === 'shift' ? 'Tomorrow at 6:00 AM' : 'Today at 5:00 PM';
              done();
            }
          });
        }

        $('[data-later]', n).addEventListener('click', function () {
          S.MESSAGES.unshift({
            id: Date.now(), status: 'draft', sentAt: 'Edited Aug 3 at 9:14 AM',
            sender: 'Sumit Awinash', senderAvatar: 'c5', senderInitials: 'SA',
            audience: m.audience ? m.audience.label : 'Not set', templateName: m.templateName,
            recipients: m.audience ? m.audience.people.length : 0,
            rendered: m.sms || m.subject || 'Empty draft',
            channels: { sms: { sent: 0, delivered: 0, failed: 0 }, email: { sent: 0, delivered: 0, failed: 0 }, push: { sent: 0, delivered: 0, failed: 0 } }
          });
          A.pop(); pane = 'sent'; A.go('messages'); A.snack('Saved to Drafts');
        });

        $('[data-goreview]', n).addEventListener('click', function () { review(m, refresh); });
        refresh();
      }
    });

    return node;
  }

  /* ---- Review gate -----------------------------------------------------
     Nothing sends from the checklist. This screen shows the message as a
     real recipient receives it, the true reach per channel, and what the
     SMS costs - the three things that cannot be undone after Send. */
  function review(m, back) {
    var r = S.reachOf(m.audience.people);
    var sample = m.audience.people[0];
    var info = S.smsInfo(m.sms);
    var segs = m.channels.sms ? r.sms * info.parts : 0;
    var unreachable = m.audience.people.filter(function (b) {
      if (m.channels.email) return false;
      if (m.channels.sms && b.phone && b.sms) return false;
      if (m.channels.push && b.push) return false;
      return true;
    });

    A.fullscreen({
      title: 'Review', back: true, onBack: back, flush: true,
      body:
        '<div class="m-review-block"><div class="m-review-k">Going to</div>' +
          '<div class="u-body u-medium">' + esc(m.audience.label) + '</div>' +
          '<div class="u-body-low">' + m.audience.people.length +
          (m.audience.people.length === 1 ? ' person' : ' people') + ' · ' + esc(m.whenLabel) + '</div></div>' +

        (m.channels.sms
          ? '<div class="m-review-block"><div class="m-review-k">SMS as ' + esc(sample.first) + ' receives it</div>' +
            '<div class="m-review-msg">' + esc(S.renderTokens(m.sms, sample)) + '</div>' +
            '<div style="margin-top:var(--space-2);font-size:var(--m-fs-meta);color:var(--fg-low);">' +
            info.chars + ' chars · ' + info.parts + ' part' + (info.parts === 1 ? '' : 's') + ' · ' + info.encoding +
            ' · ' + segs + ' segments billed</div></div>' : '') +

        (m.channels.email
          ? '<div class="m-review-block"><div class="m-review-k">Email as ' + esc(sample.first) + ' receives it</div>' +
            '<div style="font-weight:var(--weight-bold);font-size:var(--m-fs-body);margin-bottom:var(--space-2);">' +
            esc(S.renderTokens(m.subject, sample)) + '</div>' +
            '<div class="m-review-msg">' + esc(S.renderTokens(m.emailBody, sample)) + '</div></div>' : '') +

        '<div class="m-sec-head"><h2>Reach</h2></div>' +
        '<div class="m-stack" style="padding-bottom:var(--space-4);"><div class="m-card"><div class="m-reach">' +
          (m.channels.sms ? reachRow('SMS ' + r.sms + ' of ' + r.total, r.smsWhy.join(', '), r.sms === r.total) : '') +
          (m.channels.email ? reachRow('Email ' + r.email + ' of ' + r.total, '', true) : '') +
          (m.channels.push ? reachRow('Push ' + r.push + ' of ' + r.total, r.pushWhy.join(', '), r.push === r.total) : '') +
        '</div></div></div>' +

        (unreachable.length
          ? '<div class="m-alert is-danger">' + icon('warn', 18) + '<span>' + unreachable.length +
            ' will not receive this on any selected channel: ' +
            esc(unreachable.map(S.fullName).join(', ')) + '. Turn on Email to reach everyone.</span></div>'
          : '<div class="m-alert is-info">' + icon('checkCircle', 18) +
            '<span>Every person in this audience is reachable on at least one selected channel.</span></div>'),

      actions: '<button class="m-btn m-btn-outlined state-layer u-grow" data-close >Back</button>' +
               '<button class="m-btn m-btn-filled state-layer u-grow" data-send >' +
               (m.when === 'now' ? 'Send now' : 'Schedule') + '</button>',
      wire: function (n) {
        $('[data-send]', n).addEventListener('click', function () {
          A.dialog({
            title: m.when === 'now' ? 'Send to ' + m.audience.people.length + ' people?' : 'Schedule this message?',
            body: m.when === 'now'
              ? 'This cannot be recalled once it goes out.' + (segs ? ' ' + segs + ' SMS segments will be billed.' : '')
              : 'It goes out ' + m.whenLabel.toLowerCase() + '. You can cancel it until then.',
            confirm: m.when === 'now' ? 'Send' : 'Schedule',
            onConfirm: function () { send(m, r, info); }
          });
        });
      }
    });
  }

  function reachRow(label, why, ok) {
    return '<div class="m-reach-row is-' + (ok ? 'ok' : 'blocked') + '">' +
      '<span class="m-reach-label">' + esc(label) + '</span>' +
      (why ? '<span class="m-reach-why">' + esc(why) + '</span>' : '') + '</div>';
  }

  function send(m, r, info) {
    var rec = {
      id: Date.now(),
      status: m.when === 'now' ? 'sent' : 'scheduled',
      sentAt: m.when === 'now' ? 'Mon, Aug 3 at 9:15 AM' : m.whenLabel,
      sender: 'Sumit Awinash', senderAvatar: 'c5', senderInitials: 'SA',
      audience: m.audience.label, templateName: m.templateName,
      recipients: m.audience.people.length,
      rendered: S.renderTokens(m.sms || m.subject, m.audience.people[0]),
      channels: {
        sms: { sent: m.channels.sms ? r.sms : 0, delivered: m.when === 'now' && m.channels.sms ? r.sms : 0, failed: 0 },
        email: { sent: m.channels.email ? r.email : 0, delivered: m.when === 'now' && m.channels.email ? r.email : 0, failed: 0 },
        push: { sent: m.channels.push ? r.push : 0, delivered: m.when === 'now' && m.channels.push ? r.push : 0, failed: 0 }
      }
    };
    S.MESSAGES.unshift(rec);
    if (m.templateName) {
      var t = S.TEMPLATES.filter(function (x) { return x.name === m.templateName; })[0];
      if (t) { t.usedCount++; t.lastUsed = 'Aug 3'; }
    }
    A.popAll();
    pane = 'sent';
    A.go('messages');
    A.snack(m.when === 'now'
      ? 'Sent to ' + rec.recipients + (rec.recipients === 1 ? ' person' : ' people')
      : 'Scheduled for ' + m.whenLabel.toLowerCase(), 'View', function () { openMessage(rec.id); });
  }

  /* ---- Wiring ----------------------------------------------------------- */
  $$('#msgSeg .m-segmented-item').forEach(function (b) {
    b.addEventListener('click', function () { pane = b.getAttribute('data-pane'); A.render('messages'); });
  });
  $('#fabCompose').addEventListener('click', function () { compose({}); });
  d.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('#newTpl');
    if (t) A.snack('Template authoring opens on the desktop for now');
  });

  A.composeFor = compose;
})(window, document);
