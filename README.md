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

Then open http://localhost:4173/dashboard.html

## Screens

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
`dashboard.css` now has a global `[hidden] { display: none !important; }` that
covers this, but keep it in mind if you move code elsewhere.

## Not built yet

HRIS, Help & Support, Locations, Positions, Groups, Notifications, shift detail
pages, and Position Scheduling (the grid layout toggle exists, the view is a
placeholder). Delivery status, SMS costs, and ratings are mock values.
