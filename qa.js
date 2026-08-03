/* ============================================================
   skySchedule mobile - UI audit

   Paste into the console, or run via the preview harness, on
   mobile.html. Walks all five tabs and reports every mechanical
   defect that has actually shipped in this project at least once,
   so none of them can ship twice.

   Usage:  QA()            audit the five tab screens
           QA(true)        also open each overlay and audit those
   ============================================================ */
(function (w, d) {
  'use strict';

  var SCALE = ['11px', '13px', '15px', '18px', '22px', '26px'];
  var INPUT_FLOOR = '16px';            // inputs are pinned; see .m-input

  /* Documented text edges. Each is a real composition: a gutter, plus
     whatever leading element the row carries. Anything else is a bug. */
  var EDGES = [
    20,   // page gutter
    40,   // gutter + card padding
    58,   // in-card + status rail (4) + gap (14)
    60,   // day header: gutter + day number (28) + gap (12)
    66,   // sheet row: gutter + small avatar (32) + gap (14)
    68,   // app bar with a leading icon button: 8 + 44 + 4 + 12
    78,   // in-card + leading 24px icon + gap (14)
    86,   // in-card + small avatar (32) + gap (14)
    94    // in-card + avatar (40) + gap (14)
  ];

  /* Accepted, decided exceptions. Listed so the audit reports genuine
     regressions rather than re-reporting a choice that was made on
     purpose - an audit that cries wolf gets ignored. */
  var ACCEPTED_CONTRAST = [
    '.m-tab.is-active',  // brand amber at 1.79:1, chosen over contrast
    '.m-btn:disabled'    // WCAG 1.4.3 exempts inactive components, and any
                         // darker would stop reading as disabled
  ];
  var TOUCH = 44;
  var TOUCHABLE = '.m-tab,.m-icon-btn,.m-btn,.m-chip,.m-list-item,.m-ready-row,' +
                  '.m-pick,.m-shift,.m-attn-row,.m-appbar-scope,.m-segmented-item,.m-post-act';

  function lum(c) {
    var p = c.match(/\d+(\.\d+)?/g);
    if (!p) return 1;
    var v = p.slice(0, 3).map(function (x) {
      x = x / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function bgOf(el) {
    var n = el;
    while (n && n !== d.documentElement) {
      var b = getComputedStyle(n).backgroundColor;
      if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b;
      n = n.parentElement;
    }
    return 'rgb(255,255,255)';
  }
  function textOf(el) {
    return Array.prototype.filter.call(el.childNodes, function (n) {
      return n.nodeType === 3 && n.textContent.trim();
    }).map(function (n) { return n.textContent.trim(); }).join(' ');
  }
  /* Text position, not element position: an element with its own padding
     starts its box before its text does, and only the text edge matters. */
  function textLeft(el) {
    var r = d.createRange();
    r.selectNodeContents(el);
    return Math.round(r.getBoundingClientRect().left);
  }

  function audit(scope, found) {
    d.querySelectorAll(scope + ' *').forEach(function (el) {
      var box = el.getBoundingClientRect();
      if (!box.height || !box.width) return;
      var cs = getComputedStyle(el);
      var txt = textOf(el);

      if (txt) {
        /* 1. every size comes from the ramp */
        var isField = el.matches('input,textarea,select,.m-search input');
        if (!isField && SCALE.indexOf(cs.fontSize) === -1) {
          found.push(['off-scale type', cs.fontSize + '  "' + txt.slice(0, 24) + '"']);
        }
        if (isField && cs.fontSize !== INPUT_FLOOR) {
          found.push(['input under 16px (iOS will zoom)', cs.fontSize]);
        }

        /* 2. contrast */
        var a = lum(cs.color), b = lum(bgOf(el));
        var cr = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        var sz = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
        var need = (sz >= 24 || (sz >= 18.66 && bold)) ? 3 : 4.5;
        var excused = ACCEPTED_CONTRAST.some(function (sel) { return el.closest(sel); });
        if (cr < need && !excused) {
          found.push(['contrast', txt.slice(0, 20) + '  ' + cr.toFixed(2) + ':1 (needs ' + need + ')']);
        }

        /* 3. left edge, for left-aligned text wide enough to matter */
        var parentCS = el.parentElement ? getComputedStyle(el.parentElement) : null;
        /* A multi-column grid has one edge per column by definition; only
           the first column is expected to sit on the page grid. */
        var trailing = el.closest('.m-li-trail,.m-shift-trail,.m-sec-head,.m-day-header,.m-kpis') ||
          (parentCS && parentCS.display === 'grid') ||
          (parentCS && /flex/.test(parentCS.display) && /end|right/.test(parentCS.justifyContent));
        if (cs.textAlign !== 'center' && cs.textAlign !== 'right' && !trailing && box.width > 70) {
          var L = textLeft(el);
          if (EDGES.indexOf(L) === -1 && L > 0) {
            found.push(['off-grid text', L + 'px  "' + txt.slice(0, 24) + '"']);
          }
        }

        /* 4. clipped text - a label narrower than its own content */
        var pseudo = getComputedStyle(el, '::before');
        var hasPseudo = pseudo.content && pseudo.content !== 'none';
        if (!hasPseudo && el.scrollWidth > Math.ceil(box.width) + 1 &&
            cs.textOverflow !== 'ellipsis' && cs.overflowX !== 'auto' && cs.overflow !== 'hidden') {
          found.push(['clipped text', '"' + txt.slice(0, 24) + '"']);
        }
      }

      /* 5. touch targets, counting any ::before hit-area expansion */
      if (el.matches(TOUCHABLE)) {
        var bf = getComputedStyle(el, '::before');
        var h = Math.max(box.height, parseFloat(bf.height) || 0);
        if (h < TOUCH - 0.5) {
          found.push(['touch target', (el.className || el.tagName).split(' ')[0] + '  ' + Math.round(h) + 'px']);
        }
      }

      /* 6. A shadow wraps the corners only if some layer reaches sideways.
         Judge the widest layer: a tight contact shadow paired with a wide
         ambient one is correct, and checking layers individually would
         flag every well-built elevation. */
      if (cs.boxShadow && cs.boxShadow !== 'none' && /shadow|card|fab|sheet/.test(cs.boxShadow + el.className)) {
        var widest = -99;
        cs.boxShadow.split(/,(?![^(]*\))/).forEach(function (layer) {
          if (/inset/.test(layer)) return;
          var nums = layer.match(/-?\d+(\.\d+)?px/g);
          if (!nums || nums.length < 3) return;
          var blur = parseFloat(nums[2]);
          var spread = nums.length > 3 ? parseFloat(nums[3]) : 0;
          widest = Math.max(widest, blur / 2 + spread);
        });
        if (widest > -99 && widest < 4) {
          found.push(['shadow does not wrap', (el.className || '').split(' ')[0] + '  reaches ' + widest.toFixed(1) + 'px sideways']);
        }
      }

      /* 13. An element whose background matches what is directly behind it
         is invisible. This is how a canvas colour change silently erases a
         search field or a badge - the element is still there, still
         measurable, and renders as nothing. */
      var own = cs.backgroundColor;
      if (own && !/rgba\(0, 0, 0, 0\)|transparent/.test(own) && el.parentElement) {
        var behind = bgOf(el.parentElement);
        var flat = !/gradient|url/.test(cs.backgroundImage || 'none');
        var noEdge = cs.borderTopWidth === '0px' && !/inset/.test(cs.boxShadow);
        /* A sticky or fixed header is deliberately painted the canvas colour
           so content scrolls invisibly beneath it, and a full-viewport
           surface is a background rather than an object. Neither is a bug. */
        var masking = cs.position === 'sticky' || cs.position === 'fixed' ||
          (box.width >= w.innerWidth - 1 && box.height >= w.innerHeight - 80);
        if (flat && noEdge && !masking && own === behind && box.width > 24 && box.height > 12) {
          found.push(['invisible surface', (el.className || el.tagName).split(' ')[0] + '  ' + own + ' on the same colour']);
        }
      }

      /* 7. horizontal overflow of the viewport */
      if (box.right > w.innerWidth + 1 || box.left < -1) {
        if (cs.position !== 'fixed' && el.offsetParent) {
          found.push(['overflows viewport', (el.className || el.tagName).split(' ')[0] + '  ' + Math.round(box.left) + '..' + Math.round(box.right)]);
        }
      }
    });
  }

  function structural(found) {
    /* 8. two class attributes on one tag - the browser keeps the first and
       silently drops the second. This shipped once and killed every
       full-width row on More. */
    d.querySelectorAll('*').forEach(function (el) {
      var names = Array.prototype.map.call(el.attributes, function (a) { return a.name; });
      if (names.filter(function (x) { return x === 'class'; }).length > 1) {
        found.push(['duplicate class attribute', el.outerHTML.slice(0, 70)]);
      }
    });
    /* 9. an icon placeholder Lucide could not resolve renders as nothing */
    var unresolved = d.querySelectorAll('i[data-lucide]');
    if (unresolved.length) {
      found.push(['unpainted icon', Array.prototype.map.call(unresolved, function (i) {
        return i.getAttribute('data-lucide');
      }).join(', ')]);
    }
    /* 11. Focus. Every interactive element must have an authored focus
       ring; without one the browser paints its own blue box, which is what
       shipped on the tab bar.

       This cannot be tested by calling .focus() - :focus-visible only
       matches keyboard focus, so a programmatic focus always reports no
       outline and the check would flag everything. Instead, read the
       :focus-visible rules out of the stylesheet, strip the pseudo, and
       confirm each interactive element is matched by at least one. */
    var focusSelectors = [];
    Array.prototype.forEach.call(d.styleSheets, function (sheet) {
      var rules;
      try { rules = sheet.cssRules; } catch (e) { return; }   // cross-origin
      Array.prototype.forEach.call(rules || [], function (r) {
        if (r.selectorText && r.selectorText.indexOf(':focus-visible') > -1) {
          r.selectorText.split(',').forEach(function (sel) {
            if (sel.indexOf(':focus-visible') > -1) {
              focusSelectors.push(sel.replace(/:focus-visible/g, '').trim() || '*');
            }
          });
        }
      });
    });
    if (!focusSelectors.length) {
      found.push(['no focus styles authored at all', 'every control falls back to the UA ring']);
    } else {
      d.querySelectorAll(TOUCHABLE).forEach(function (el) {
        var covered = focusSelectors.some(function (sel) {
          try { return sel === '*' || el.matches(sel); } catch (e) { return false; }
        });
        if (!covered) {
          found.push(['no focus ring', (el.className || el.tagName).split(' ')[0]]);
        }
      });
    }

    /* 10. a sticky header outside a .m-group pins forever and stacks up */
    d.querySelectorAll('.m-sticky').forEach(function (el) {
      if (!el.closest('.m-group')) found.push(['sticky header without .m-group', el.textContent.trim().slice(0, 24)]);
    });
  }

  /* The audit clicks through the app and measures immediately. Several
     properties are transitioned (tab label colour, chip background), and
     getComputedStyle returns the INTERPOLATED value mid-transition - so an
     inactive tab still reads as brand amber and gets reported as a contrast
     failure that does not exist. Freeze all animation for the duration. */
  function freeze() {
    var st = d.createElement('style');
    st.id = 'qa-freeze';
    st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
    d.head.appendChild(st);
    return function () { st.remove(); };
  }

  /* Content must be reachable: scroll a pane to its end and check the last
     row clears the fixed tab bar. Run per screen, because a padding value
     that is short by a few pixels leaves one row permanently half-covered
     and only on the screen that has the extra chrome. */
  function reachable(found) {
    var bar = d.querySelector('.m-tabbar');
    var barTop = bar ? bar.getBoundingClientRect().top : Infinity;
    d.querySelectorAll('.m-view:not([hidden]) .m-body').forEach(function (body) {
      var prev = body.scrollTop;
      body.scrollTop = body.scrollHeight;
      var last = body.children[body.children.length - 1];
      if (last) {
        var r = last.getBoundingClientRect();
        if (r.bottom > barTop + 1) {
          found.push(['content trapped under the tab bar',
            (body.id || '') + '  last row ends ' + Math.round(r.bottom - barTop) + 'px into the bar']);
        }
      }
      body.scrollTop = prev;
    });
  }

  w.QA = function (withOverlays) {
    var found = [];
    var thaw = freeze();
    ['home', 'schedule', 'bfms', 'messages', 'more'].forEach(function (t) {
      var tab = d.querySelector('.m-tab[data-tab="' + t + '"]');
      if (tab) tab.click();
      audit('.m-view:not([hidden])', found);
      reachable(found);
    });
    audit('.m-tabbar', found);
    if (withOverlays && w.APP) {
      d.querySelector('.m-tab[data-tab="schedule"]').click();
      var a = d.querySelector('#schedBody [data-assign]');
      if (a) { a.click(); audit('#overlayHost', found); w.APP.popAll(); }
      d.querySelector('#fabShift').click(); audit('#overlayHost', found); w.APP.popAll();
      d.querySelector('.m-tab[data-tab="messages"]').click();
      d.querySelector('#fabCompose').click(); audit('#overlayHost', found); w.APP.popAll();
    }
    structural(found);
    d.querySelector('.m-tab[data-tab="home"]').click();
    thaw();

    var byKind = {};
    found.forEach(function (f) { (byKind[f[0]] = byKind[f[0]] || []).push(f[1]); });
    Object.keys(byKind).forEach(function (k) {
      byKind[k] = byKind[k].filter(function (v, i, arr) { return arr.indexOf(v) === i; });
    });
    return { total: found.length, issues: byKind };
  };
})(window, document);
