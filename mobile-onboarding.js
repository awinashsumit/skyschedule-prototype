/* ============================================================
   skySchedule mobile - splash and onboarding

   Splash -> three onboarding slides -> sign in.

   The illustrations are drawn from the app's own components: the
   shift row with its status rail, the avatar, the message card.
   That is a deliberate choice over stock artwork. Generic art of
   smiling people tells a scheduler nothing, whereas showing the
   real shift row means the first screen of the product is already
   familiar by the time they reach it - and it cannot drift out of
   sync with the design system, because it is built from it.
   ============================================================ */
(function (w, d) {
  'use strict';
  var A = w.APP;
  var $ = A.$;

  /* Slide artwork. One fixed viewBox for all three, so the art block never
     changes height between slides and the sheet below stays perfectly still
     as you page. Everything is composed to sit INSIDE the blob - elements
     breaking its edge read as a mistake rather than as depth. */
  var VB = { w: 300, h: 260, cx: 150, cy: 130, r: 118 };

  function art(inner) {
    return '<svg viewBox="0 0 ' + VB.w + ' ' + VB.h + '" fill="none" ' +
      'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      /* two offset discs rather than one flat circle, for a little depth */
      '<circle cx="' + (VB.cx + 18) + '" cy="' + (VB.cy - 14) + '" r="' + (VB.r - 10) + '" fill="var(--accent-2)"/>' +
      '<circle cx="' + VB.cx + '" cy="' + VB.cy + '" r="' + VB.r + '" fill="var(--accent-3)"/>' +
      inner + '</svg>';
  }

  /* A shift row, drawn from the same parts as the real one: status rail,
     a title line, a meta line. */
  function card(y, hei, rail, opts) {
    opts = opts || {};
    var x = 56, wid = 188;
    return '<g' + (opts.dim ? ' opacity="0.55"' : '') + '>' +
      '<rect x="' + x + '" y="' + y + '" width="' + wid + '" height="' + hei + '" rx="14" fill="#fff"/>' +
      '<rect x="' + (x + 14) + '" y="' + (y + 13) + '" width="4" height="' + (hei - 26) + '" rx="2" fill="' + rail + '"/>' +
      '<rect x="' + (x + 28) + '" y="' + (y + 16) + '" width="86" height="8" rx="4" fill="var(--gray-8)"/>' +
      '<rect x="' + (x + 28) + '" y="' + (y + 32) + '" width="58" height="6" rx="3" fill="var(--gray-6)"/>' +
      '</g>';
  }

  var SLIDES = [
    {
      title: 'Your week, at a glance',
      body: 'Every shift, every day, in the order they happen. A gap is impossible to miss.',
      art: art(
        card(46, 52, 'var(--success-solid)') +
        card(110, 52, 'var(--success-solid)') +
        card(174, 52, 'var(--warning-solid)')
      )
    },
    {
      title: 'Fill a gap in two taps',
      body: 'Open a shift and skySchedule shows who is qualified, who is free, and who is already booked.',
      art: art(
        card(58, 52, 'var(--warning-solid)') +
        /* the arc reads as the person being dropped into the open shift */
        '<path d="M96 182 C 118 166, 166 160, 190 132" stroke="var(--accent-9)" stroke-width="2.5" ' +
          'stroke-dasharray="1 8" stroke-linecap="round"/>' +
        '<circle cx="88" cy="188" r="22" fill="var(--chart-4)"/>' +
        '<text x="88" y="194" text-anchor="middle" font-family="Inter, sans-serif" font-size="15" ' +
          'font-weight="600" fill="#fff">PD</text>' +
        '<circle cx="206" cy="120" r="18" fill="var(--success-solid)"/>' +
        '<path d="M198 120 l6 6 12 -13" stroke="#fff" stroke-width="2.75" stroke-linecap="round" ' +
          'stroke-linejoin="round" fill="none"/>'
      )
    },
    {
      title: 'Nothing sends by accident',
      body: 'Before a message goes out you see it as your team will, who it truly reaches, and what it costs.',
      art: art(
        '<rect x="52" y="56" width="196" height="104" rx="16" fill="#fff"/>' +
        '<rect x="72" y="78" width="104" height="8" rx="4" fill="var(--gray-8)"/>' +
        '<rect x="72" y="96" width="156" height="6" rx="3" fill="var(--gray-6)"/>' +
        '<rect x="72" y="110" width="128" height="6" rx="3" fill="var(--gray-6)"/>' +
        /* the two reach chips the review step actually shows */
        '<rect x="72" y="128" width="60" height="16" rx="8" fill="var(--success-bg)"/>' +
        '<rect x="138" y="128" width="60" height="16" rx="8" fill="var(--warning-bg)"/>' +
        /* the review gate itself */
        '<circle cx="206" cy="176" r="30" fill="var(--accent-9)"/>' +
        '<path d="M206 161 l11 4.5 v8 c0 6.5 -4.6 12.4 -11 14.5 c-6.4 -2.1 -11 -8 -11 -14.5 v-8 z" ' +
          'fill="var(--accent-contrast)"/>' +
        '<path d="M201 175.5 l3.6 3.6 7.4 -8.4" stroke="var(--accent-9)" stroke-width="2.2" ' +
          'stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
      )
    }
  ];

  /* ---- Splash ------------------------------------------------------ */
  function splash() {
    var el = d.createElement('div');
    el.className = 'm-splash';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'skySchedule, loading');
    el.innerHTML = A.logo() +
      '<div class="m-splash-load"><i></i><i></i><i></i></div>' +
      '<div class="m-splash-foot">powered by ' +
        '<span class="m-splash-mark">S</span><b>skypoint</b></div>';
    d.body.appendChild(el);

    /* Tappable, and it also self-advances. A splash that can only be waited
       out is a splash that annoys anyone who opens the app twice. */
    function go() {
      clearTimeout(t);
      el.removeEventListener('click', go);
      el.classList.add('is-leaving');
      setTimeout(function () { el.remove(); onboarding(); }, 300);
    }
    var t = setTimeout(go, 1400);
    el.addEventListener('click', go);
  }

  /* ---- Onboarding --------------------------------------------------- */
  function onboarding() {
    var i = 0;
    var el = d.createElement('div');
    el.className = 'm-onb';
    d.body.appendChild(el);

    function paint() {
      var s = SLIDES[i];
      var last = i === SLIDES.length - 1;
      el.innerHTML =
        '<button class="m-onb-skip state-layer" id="onbSkip">Skip</button>' +
        '<div class="m-onb-art">' + s.art + '</div>' +
        '<div class="m-onb-sheet">' +
          '<div class="m-dots">' + SLIDES.map(function (_, k) {
            return '<span class="m-dot' + (k === i ? ' is-on' : '') + '"></span>';
          }).join('') + '</div>' +
          '<h1>' + s.title + '</h1><p>' + s.body + '</p>' +
          '<div class="m-onb-actions">' +
            (i > 0 ? '<button class="m-btn m-btn-outlined state-layer" id="onbBack" ' +
                     'aria-label="Previous">' + A.icon('back', 20) + '</button>' : '') +
            '<button class="m-btn m-btn-filled state-layer u-grow" id="onbNext">' +
              (last ? 'Get started' : 'Next') + '</button>' +
          '</div>' +
        '</div>';

      $('#onbSkip', el).addEventListener('click', finish);
      $('#onbNext', el).addEventListener('click', function () {
        if (last) return finish();
        i++; paint();
      });
      var back = $('#onbBack', el);
      if (back) back.addEventListener('click', function () { i--; paint(); });
    }

    function finish() { el.remove(); A.signIn(); }

    /* Horizontal swipe, since dots imply a pageable surface and a user who
       sees dots will try to swipe them. */
    var x0 = null;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0 && i < SLIDES.length - 1) { i++; paint(); }
      else if (dx > 0 && i > 0) { i--; paint(); }
    }, { passive: true });

    paint();
  }

  A.splash = splash;
  A.onboarding = onboarding;
  splash();
})(window, document);
