# VolunteerHub — Event Volunteer Management (MVP)

Desktop-first, responsive website for an event organizer to manage volunteers. Built for a hackathon demo — no backend, no build step, works by opening `index.html` directly.

## MVP Core Features

1. **Role shifts with timings & location** — Organizer creates shifts (role, date, start/end time, location, required headcount).
2. **Volunteer sign up & check in** — Volunteers sign up for open shifts; organizer marks them checked in at the event.
3. **Filled / vacant / understaffed roles** — Dashboard shows totals and per-role status so the organizer knows staffing gaps at a glance.

## Tech Stack

- HTML5 + CSS3 (custom, desktop-first responsive)
- Vanilla JavaScript (ES6)
- Persistence: `localStorage` (no server required)

## Run It

```bash
cd volunteer-hub
# Option A: open directly
open index.html   # macOS
# or double-click index.html

# Option B: serve locally (recommended for realistic demo)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Data Persistence (Technical Risk & Mitigation)

| Risk | Impact | Mitigation |
|------|--------|------------|
| `localStorage` is browser-specific | Data won't sync across devices/browsers | Demo from one machine; use "Export JSON" to back up |
| Clearing site data wipes data | All shifts/volunteers lost on cache clear | "Seed Demo Data" restores sample shifts instantly |
| No authentication | Anyone can edit/delete | Acceptable for MVP demo; add auth in v2 |
| No real-time sync | Check-in won't show on another tab until refresh | Refresh the dashboard tab after check-in |

## Git

```bash
git init
git add .
git commit -m "feat: initial volunteer management MVP"
```

## Project Structure

```
volunteer-hub/
├── index.html          # Single-page app (all views)
├── css/style.css       # Desktop-first responsive styles
├── js/app.js           # State, storage, rendering, logic
├── README.md
└── .gitignore
```

## Demo Script for Judges

1. Open **Dashboard** → show total shifts, signed-up volunteers, filled/vacant/understaffed counts.
2. Open **Role Shifts** → click **+ Add Shift** to create a new role with time & location.
3. Open **Volunteer Sign Up** → fill name/email, pick a shift with open spots, submit.
4. Return to **Dashboard** → watch counts update and understaffed roles change.
5. Open **Check In** → pick a shift, check in volunteers, watch status flip to "Checked In".
