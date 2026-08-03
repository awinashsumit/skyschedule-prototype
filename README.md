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
