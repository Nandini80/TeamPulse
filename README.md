# TeamPulse — Frontend Intern Assignment (Submission)

A React + TypeScript team activity dashboard. This repo contains the **completed** assignment: bug fixes and the Search Comments feature.

---

## Deliverables (quick links)

| Deliverable | File |
|-------------|------|
| Bug report (each fix explained) | [BUG_REPORT.md](./BUG_REPORT.md) |
| Search feature implementation notes | [FEATURE_NOTES.md](./FEATURE_NOTES.md) |
| Time log | [TIME_LOG.md](./TIME_LOG.md) |

---

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

- **Sidebar:** Dashboard, Activity Feed, Search Comments (or ⌘K / Ctrl+K for search).
- **Header:** Team member search (name/email/role), notifications (bell), greeting.
- **Dashboard:** Stats, standup timer, member grid with bookmarks; click a member for the detail modal.
- **Activity Feed:** Activity list with sort/filter and batch assign.

---

## Choices, approach, and trade-offs

### Bug-fixing approach

- Reproduced issues from the assignment’s user stories and by using the app (navigation, search, filters, timer, bookmarks, modal, notifications).
- Used the browser console (errors, warnings) and React DevTools to track down state and effect issues.
- Fixed causes, not only symptoms: e.g. filter “not updating” was fixed by fixing the context setState (new object reference), not by forcing a re-render elsewhere.
- Documented each bug in [BUG_REPORT.md](./BUG_REPORT.md) with: symptom, root cause, fix, and links between bugs where relevant.

### Search Comments feature

- **Data:** Single fetch of all 500 comments from JSONPlaceholder, then client-side filter over `name`, `email`, and `body`. Cached so reopening the overlay doesn’t re-fetch.
- **UX:** Full-screen overlay with blurred backdrop, clear/search bar, result count, and list with snippet highlighting. Keyboard: Arrow Up/Down (with wrap), Escape to close. Click outside (backdrop) to close.
- **Highlighting:** Implemented with React-rendered `<mark>` and `<span>` segments (no `dangerouslySetInnerHTML`), driven by a small helper that returns `{ text, highlight }` parts.
- **Trade-off:** No debounce on typing; filtering is synchronous and fast for 500 items. The spec’s “brief pause after I stop typing” could be met by adding a 200–300 ms debounce if desired.
- **Trade-off:** Enter key does not yet “expand” the highlighted result; that would be a small addition (e.g. expand body in place or open a detail view).

Details and file-level notes are in [FEATURE_NOTES.md](./FEATURE_NOTES.md).

### Constraints respected

- No external UI or utility libraries (no MUI, lodash, react-window, etc.). React, TypeScript, and standard DOM/CSS only.
- Styling is plain CSS (no Tailwind). Search overlay uses existing design tokens (e.g. `var(--primary)`, `var(--surface)`) where possible.

---

## What I’d improve with more time

1. **Search Comments**
   - Optional 200–300 ms debounce on the search input to match “brief pause” wording.
   - Enter key: expand or select the highlighted result (e.g. show full body).
   - Guard against setState after unmount when the overlay is closed before `fetchComments()` resolves (e.g. an “isMounted” or abort ref).
   - Virtualized list if result sets grow beyond a few hundred items.

2. **Testing**
   - Unit tests for filter context, search/filter helpers, and highlight/snippet logic.
   - A few integration tests (e.g. open search overlay, type, see results and highlight).

3. **Accessibility**
   - Focus trap inside the search overlay and restore focus to the trigger on close.
   - ARIA live region for result count and loading/error messages.

4. **Loading and errors**
   - Global loading/error handling for member and activity fetches (e.g. toasts or inline messages) so “Data Loading” user stories are fully covered.

5. **Git history**
   - The assignment asks for one commit per bug with messages describing the symptom. If you need that, I can restructure the history into separate commits (e.g. “fix: infinite re-renders in header greeting”, “fix: activity feed duplicates”, etc.).

---

## Stack

- React 18  
- TypeScript  
- Vite  
- Raw CSS (no Tailwind)

---

## Original assignment instructions (summary)

- Find and fix bugs; document them in **BUG_REPORT.md**.
- Build the Search Comments feature from scratch; document approach in **FEATURE_NOTES.md**.
- Provide **README.md** (choices, approach, trade-offs, improvements), **TIME_LOG.md**, repo link, and deployed link.

Partial submissions are acceptable; any remaining work or known gaps are noted above and in the other docs.
