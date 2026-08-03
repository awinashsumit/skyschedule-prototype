# skySchedule, design prototype

A clickable redesign of the skySchedule admin app, built on the Skypoint Radix
design system (Radix geometry, amber `#FFB31C` brand, Inter).

This is a **front-end prototype for design review**. There is no backend: all
data lives in JavaScript arrays and resets on reload.

## Running it

The pages are static, but the JavaScript loads as separate files, so serve the
folder rather than opening the HTML directly:

```bash
cd skyschedule
python3 -m http.server 4173
```

Then open http://localhost:4173/dashboard.html for desktop, or
http://localhost:4173/mobile.html for the phone app (set the browser to a
390px-wide device viewport).

## Desktop screens

| File | What it covers |
|---|---|
| `dashboard.html` | Hub. KPIs, exception queues, today's roster, previews that deep-link into each section. |
| `schedule.html` | Roster grid (Day / Week / Month), List view of shift records, create-shift flow. |
| `bfms.html` | People roster, profile drawer with shift history, availability and time off. |
| `communications.html` | Compose (readiness checklist), Messages log, Templates. |
| `community.html` | Internal posts feed. |

Shared: `dashboard.css` (components + layout shell) and `tokens.css` (colors,
type, spacing). Both come from the design system; page files should not
hardcode colors or sizes.

## Mobile app

`mobile.html` is the same application, not a cut-down companion: every desktop
capability is reachable from the phone. What changes is the mechanics —
dropdowns become bottom sheets, the week grid becomes a vertical agenda, and
multi-step authoring (Compose, availability, add a BFM) becomes a full-screen
surface with its own app bar.

| File | What it covers |
|---|---|
| `mobile.html` | Shell. Five views in one document; tapping a tab swaps the view, so there is no page reload and scroll position survives. |
| `mobile.css` | Material 3 anatomy wearing the Radix skin, plus the screen layer. Header documents the four deliberate departures from stock M3. |
| `mobile-data.js` | Single source of people, shifts, templates, messages and posts, shared by every view. KPIs are computed from it, never hardcoded. |
| `mobile-app.js` | Helpers, the overlay stack, the tab router, Home and More. |
| `mobile-schedule.js` | Agenda, filters, month sheet, assign, create/edit shift. |
| `mobile-people.js` | Roster, profile, availability, add/edit, deactivate and restore. |
| `mobile-comms.js` | Templates, message log, Compose checklist and the review gate. |
| `mobile-components.html` | Component gallery: every component in every state. |

### Design foundation

**Colour, radii, spacing, shadows: Radix.** The gray, red, green, blue and
orange ramps are the literal Radix 12-step scales; space is Radix 1–9
(4·8·12·16·24·32·40·48·64); radii are the Radix "medium" factor; shadows are
the Radix recipe (1px ring plus soft spread).

Four steps of the amber ramp deviate, and only these four. Steps **9 and 10**
are Skypoint amber rather than Radix Amber, which is the point of a brand
accent. Step **3** is warmed slightly. Step **11** was set to the same
`#ffb31c` as step 9 — a fill colour used as a text colour, giving 1.79:1 on
white — and is overridden to `#9c5b00` (5.37:1) in `mobile.css`. `tokens.css`
is left alone so the desktop build is unaffected.

**Density is mobile-specific.** Radix geometry is tuned for dense desktop
tables at 1440px: 8px radii, 12px padding, hairline dividers. At 390px that
reads as a spreadsheet. The mobile layer uses a 20px gutter, 20px card radii,
20px card padding, and separates cards with space rather than a 1px rule.
Dividers appear only *inside* a card, where they mean "same group, next item".

**Type is a modular scale, not the desktop ramp.** The Radix ramp is
hand-tuned for desktop, and the first mobile build leant on its 12 and 14px
steps for ~80% of all text, which is why the screens had no hierarchy. Mobile
uses a 1.25 scale anchored at a 16px body, rounded so every line-height lands
on the 4px baseline grid:

| Token | Size / line | Used for |
|---|---|---|
| `--m-fs-meta` | 13 / 20 | captions, timestamps, counts |
| `--m-fs-body` | 16 / 24 | default; also the iOS no-zoom floor for inputs |
| `--m-fs-title` | 20 / 28 | card titles, section and app bar headings |
| `--m-fs-head` | 24 / 32 | screen titles |
| `--m-fs-hero` | 32 / 40 | the one big number on a screen |

`--m-fs-micro` (11px) is the single documented exception, used only inside
circular counters and small avatars where 13px will not fit.

**Text starts on one of five edges, never anywhere else.**

```
20   the page gutter ................ anything on the canvas
40   gutter + card padding .......... anything inside a card
58   + status rail (4) + gap (14) ... a shift row
86   + small avatar (32) + gap ...... a row led by a 32px avatar
94   + avatar (40) + gap ............ a row led by a 40px avatar
```

Trailing content is right-aligned and does not share a left edge. The two-up
KPI grid has its own second column. Anything landing elsewhere is a bug.

**Styling lives in `mobile.css`, not the markup.** Every recurring pattern is
a named component or a small utility class. Inline styles are down from 179 to
~60 and the remainder are genuine one-offs (a progress bar's computed width, a
single-use flex arrangement). If you find yourself writing the same inline
style twice, it belongs in the stylesheet. Two rules worth knowing:

- `icon()` emits a sized class, not inline geometry, so ~90 call sites carry no
  dimensions.
- Watch for a tag ending up with two `class` attributes — the browser keeps the
  first and silently drops the second. That bug shipped once and took out
  every full-width row on the More screen.

**Radii come from the shared scale.** Desktop cards are `--radius-4` (8px);
mobile cards are `--radius-6` (16px) — two steps up the same Radix ramp,
because a 350px card on a 390px screen needs more curvature than a 1440px
layout to read as soft rather than square. The first mobile build used 20 /
14 / 28px, none of which exist on the scale; that was the inconsistency, not
the fact that mobile is rounder. One step was added rather than more free
numbers: `--radius-7` at 24px, for full-width mobile surfaces (bottom sheets)
that have no desktop equivalent.

**The app opens on splash → onboarding → sign in.** `mobile-onboarding.js`
drives the sequence; `mobile-auth.js` no longer self-starts.

The onboarding illustrations are drawn from the app's own components — the
shift row with its status rail, the avatar, the message card — rather than
stock artwork. Generic art of smiling people tells a scheduler nothing,
whereas showing the real shift row means the product is already familiar by
the time they reach it, and the art cannot drift out of sync with the design
system because it is built from it. All three share one fixed viewBox so the
sheet below does not move as you page.

**Sign in is at `mobile-auth.js`.** Three screens: sign in, redeem an invite,
reset a password. There is deliberately no open sign-up — skySchedule accounts
are provisioned by an administrator and reconciled against HRIS on the daily
sync, so a Create account button would fail for everyone who tapped it. The
two routes that exist are SSO and an emailed invite, and the screen says so.
Wrong credentials return one combined message and password reset always
confirms, so neither can be used to discover which addresses are registered.
Demo credentials are in `VALID` at the top of the file.

**Icons are Lucide**, loaded from a pinned CDN build and rendered from
`<i data-lucide="…">` placeholders — no hand-traced path data. The exception is
the five *filled* tab-bar icons, which are hand-drawn because Lucide ships an
outline set only; they live in `mobile.html` and are the only `<svg>` literals
in the project.

### Auditing the UI

`qa.js` is a standing audit. Load it on `mobile.html` and call `QA(true)`; it
walks all five tabs plus the overlays and reports every mechanical defect that
has actually shipped in this project at least once, so none of them can ship
twice:

```js
// in the console on mobile.html
var s = document.createElement('script');
s.src = '/qa.js';
document.head.appendChild(s);
s.onload = () => console.table(QA(true).issues);
```

It checks: type sizes outside the ramp, inputs under 16px (Safari zooms),
contrast against the computed background, text off the documented edges,
clipped labels, touch targets under 44px, shadows whose spread cancels their
blur so they never wrap the corners, horizontal overflow, duplicate `class`
attributes, unpainted icon placeholders, and sticky headers outside a
`.m-group`.

Two things to know if you extend it. It freezes CSS transitions for the
duration — `getComputedStyle` returns the *interpolated* value mid-transition,
which made an inactive tab report as brand amber. And it carries an explicit
list of accepted exceptions, because an audit that re-reports decisions
already made gets ignored.

**Accessibility is measured, not assumed.** Every screen was audited in the
browser: all text clears WCAG AA (4.5:1, or 3:1 at large sizes) and every
interactive target clears 44px. Six of the eight avatar fills were darkened
from the chart ramp until white initials passed. The one deliberate exception
is the active tab's amber at 1.79:1, kept for brand fidelity at Sumit's
direction.

Two rules the mobile build keeps from desktop, because they are the product's
actual safety net:

- **Nothing sends without review.** Compose gates the send behind a screen
  showing the message with merge fields resolved against a real recipient, true
  per-channel reach, and the SMS segment cost.
- **Deactivating names the damage.** The dialog lists the specific upcoming
  shifts that break, and offers to release them back to Open. Undoable.

## How the pieces relate

People and shifts are deliberately consistent across screens. Anush Kulal's
Monday shift is the same fact in the Schedule grid, the BFM profile drawer, and
the Communications recipient list. If you change one dataset, check the others.

Communications reachability is derived from BFM attributes: a person only
receives SMS if they have a mobile number and have opted in, and only receives
push if they use the app. That is why a channel can be globally enabled but
show "6 of 8".

## Gotchas for whoever picks this up

**Script and stylesheet URLs are versioned** (`comms.js?v=5`,
`dashboard.css?v=2`). The dev server caches aggressively, so if you edit those
files and see no change, bump the version number in the HTML.

**Never rely on the `hidden` attribute alone** for a new component. Most
components here declare their own `display`, which outranks the browser default.
`dashboard.css` and `mobile.css` both carry a global
`[hidden] { display: none !important; }`, but keep it in mind if you move code
elsewhere.

**Token overrides must match tokens.css's own selector.** `tokens.css` scopes
its palette to `:root[data-theme="light"]`. A `:root { ... }` override loses the
specificity contest and silently does nothing. `mobile.css` overrides a handful
of tokens for contrast and uses `:root, :root[data-theme="light"]` for exactly
this reason.

**Sticky headers need a wrapper.** An agenda day header or list group label
only unsticks when its containing block scrolls past. Bare sibling headers all
share the scroll body as their containing block and pile up together at the top.
Each header goes inside a `.m-group` with its own rows.

**Mobile screens with a FAB need `.has-fab` on the scroll body.** Without it the
last row sits permanently under the button and its trailing action can never be
tapped.

## Not built yet

HRIS, Help & Support, Locations, Positions, Groups, Notifications, shift detail
pages, and Position Scheduling (the grid layout toggle exists, the view is a
placeholder). Delivery status, SMS costs, and ratings are mock values.
