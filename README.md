# TeamPulse — Frontend Intern Assignment

React + TypeScript team dashboard. This repo is my submission: bug fixes and the Search Comments feature.

---

## Deliverables

| What | Where |
|------|--------|
| Bug report (symptom, cause, fix per bug) | [BUG_REPORT.md](./BUG_REPORT.md) |
| Search feature notes | [FEATURE_NOTES.md](./FEATURE_NOTES.md) |
| Time log | [TIME_LOG.md](./TIME_LOG.md) |

---

## How to run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

- **Sidebar:** Dashboard, Activity Feed, Search Comments (or ⌘K / Ctrl+K).
- **Header:** Search members (name/email/role), notifications (bell), greeting.
- **Dashboard:** Stats, standup timer, member grid with bookmarks; click a card for the modal.
- **Activity Feed:** List with sort/filter and batch assign.

---

## How I approached it

**Bugs:** I went through the assignment’s user stories and poked around the app—navigation, search, filters, timer, bookmarks, modal, notifications. When something felt wrong I checked the console and React DevTools and traced it back to the cause (e.g. setState during render, mutating state, missing cleanup). I tried to fix the root cause, not just the symptom, and wrote up each one in BUG_REPORT.md with whether it was tied to another bug.

**Search Comments:** The API doesn’t support search, so I fetch all 500 comments once and filter in memory. That keeps typing instant and avoids race conditions. I added a small API module (fetch + search + snippet/highlight), rewrote the overlay with a proper search bar, result list, and highlight (using `<mark>` and `<span>`, no injected HTML). Keyboard: arrows to move, wrap at top/bottom, Escape to close. Click outside to close. More detail and trade-offs are in FEATURE_NOTES.md.

**Constraints:** No external UI or utility libs—just React, TypeScript, and the DOM. Styling is plain CSS; the search overlay uses the existing CSS variables where it made sense.

---

## What I’d improve with more time

- **Search:** Optional debounce to match “brief pause” wording; Enter to expand the highlighted result; guard against setState after unmount when you close before the fetch finishes; virtualize the list if we ever have way more results.
- **Tests:** Unit tests for the filter context, search/highlight helpers; a couple of integration tests for the overlay (open, type, see results and highlight).
- **A11y:** Focus trap in the overlay and restore focus on close; ARIA for result count and loading/error.
- **Loading/errors:** Clearer loading and error handling for member and activity fetches so the “Data Loading” stories are fully covered.
- **Git history:** The assignment asks for one commit per bug with messages that describe the symptom. If you need that, I can split the history into separate commits (e.g. “fix: infinite re-renders in header”, “fix: activity feed duplicates”, etc.).

---

## Stack

React 18, TypeScript, Vite, raw CSS (no Tailwind).

---

## Repo & deploy

- **GitHub:** https://github.com/Nandini80/TeamPulse
- **Live:** https://team-pulse-flame.vercel.app/
