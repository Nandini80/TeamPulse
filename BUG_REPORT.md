# Bug Report — TeamPulse

Here’s each bug I ran into, what was going on under the hood, and how I fixed it. I’ve kept the format the assignment asked for but tried to write it like I’m explaining to a teammate.

---

## Bug 1 — Infinite re-renders (React "Too many re-renders")

- **Exact error / console output:**  
  `Uncaught Error: Too many re-renders. React limits the number of renders to prevent an infinite loop.`
- **Steps to reproduce:**
  1. Open the app at localhost:5173
  2. Load the Dashboard (default view)
  3. The app crashes or freezes; console shows the error above
- **Viewport / device tested:** Desktop Chrome (any viewport)
- **Symptom — what you saw:** The app locked up and React threw the “too many re-renders” error.
- **Root cause — the why:** In the Header, the greeting was being set with `setGreeting(computeGreeting())` right in the component body—so on every render we were calling setState. That triggers another render, which calls setState again, and so on. Classic infinite loop. React only uses the initial state value on first mount; after that you’re not supposed to update state during render.
- **Fix and why it works:** I stopped updating the greeting during render. Instead I initialize it once with a lazy initializer: `useState(() => computeGreeting())`. React only runs that function on the first mount, so we get the greeting once and never trigger a re-render from it.
- **Connected to another bug?** No.

---

## Bug 2 — Activity feed shows duplicate entries

- **Exact error / console output:** No console error. You just see the same activity (e.g. “Emily Nakamura merged PR #140”) listed two or more times.
- **Steps to reproduce:**
  1. Open the app, go to Activity Feed
  2. In dev (especially with React Strict Mode) or after switching to another page and back, you’ll see duplicate rows
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The same activities repeated in the list.
- **Root cause — the why:** The effect that loads activities was doing `setActivities(prev => [...prev, ...data])`—so it was *appending* the API response to whatever was already there. If the effect ran twice (Strict Mode or navigating away and back), we’d append the same 500 items again. On top of that, the list used `key={index}`, which doesn’t help React when items are duplicated or reordered.
- **Fix and why it works:** I changed it to replace the list instead of appending: `setActivities(data)`. So each load overwrites state and we don’t get duplicates. I also switched to `key={activity.id}` so each row has a stable identity.
- **Connected to another bug?** No.

---

## Bug 3 — Header search: no results or wrong results

- **Exact error / console output:** No error. Typing in the header search either showed nothing or results that didn’t match what you’d just typed (e.g. results for “m” after you’d typed “mei”).
- **Steps to reproduce:**
  1. Focus the header search and type a name (e.g. “mei”) or a role (e.g. “Senior”)
  2. Either no dropdown appears, or the results are for an older query
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Search felt broken—empty or stale results.
- **Root cause — the why:** Three things. (1) The input was controlled with `undefined` as initial state, which can make controlled inputs behave oddly. (2) There was a 300ms debounce but no cleanup when the query changed, and no check that the response actually matched the *current* query—so a slow response for “m” could overwrite results for “mei”. (3) The API only searched name and email; searching by role returned nothing.
- **Fix and why it works:** (1) Use `useState('')` and `value={query ?? ''}` so the input is always a proper controlled string. (2) Clear the previous timeout when the query changes and on unmount, and keep a ref with the latest query—only call `setSearchResults` when the response’s query matches that ref so we ignore stale responses. (3) Added role to the search filter in mockApi and trim the query before searching.
- **Connected to another bug?** No.

---

## Bug 4 — Header search: outside click doesn’t close; clicking a result does nothing

- **Exact error / console output:** No console error.
- **Steps to reproduce:**
  1. Type in the header search until results show
  2. Click outside the search—dropdown stays open
  3. Click a search result—nothing happens
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** You couldn’t dismiss the dropdown by clicking away, and the result rows weren’t clickable.
- **Root cause — the why:** There was no listener for “click outside,” and the result items were just divs with no onClick. The Dashboard holds the selected member locally, so the Header had no way to say “open this member.”
- **Fix and why it works:** I wrapped the search area in a ref and added a document mousedown listener—if the click is outside that ref, we clear the results and query so the dropdown closes. For “click on user,” I lifted the “member to open from search” into App state and passed a callback to the Header. When you click a result, we navigate to Dashboard and pass that member; Dashboard gets `memberToOpen` and opens the modal. I also made the result rows proper buttons (role="button", Enter/Space). Fixing this is what made the next bug obvious (modal showing the wrong person), which I fixed with the key in Bug 10.
- **Connected to another bug?** Yes. Implementing “click on user” led to Bug 10 (wrong member in modal), fixed by `key={selectedMember.id}`.

---

## Bug 5 — Standup timer doesn’t tick

- **Exact error / console output:** No error. The timer shows something like 14:56:38 but the numbers never change.
- **Steps to reproduce:**
  1. Open the Dashboard
  2. Watch the “Next Standup” countdown
  3. It stays frozen
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** The countdown didn’t move.
- **Root cause — the why:** The effect set up a setInterval that did `setTimeLeft(timeLeft - 1)`. The problem is that `timeLeft` inside that callback is whatever it was when the effect ran—so we were always subtracting 1 from the *initial* value. React never saw a real countdown. Also the interval was never cleared, so when you left the Dashboard it kept running and could try to set state on an unmounted component.
- **Fix and why it works:** Each tick I recalculate from the current time: `setTimeLeft(getSecondsUntilStandup())`. That way we always show the real time left and it actually counts down. I also return a cleanup that clears the interval so we don’t leak or update after unmount.
- **Connected to another bug?** No.

---

## Bug 6 — Filters don’t update the UI

- **Exact error / console output:** No error. You pick a status or role in the sidebar but the dropdown/radio doesn’t reflect it and the list might not filter.
- **Steps to reproduce:**
  1. Use the sidebar filters—e.g. select “Active” or “Engineering Lead”
  2. The UI doesn’t update to show your selection
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Filter controls looked stuck; your selection didn’t show.
- **Root cause — the why:** In FilterContext, `updateFilter` was mutating the existing state object (`filters[key] = value`) and then calling `setFilters(filters)` with the *same* object. React decides whether to re-render based on reference; since the reference didn’t change, React didn’t bother re-rendering, so the UI never updated.
- **Fix and why it works:** I stopped mutating. Now we do `setFilters(prev => ({ ...prev, [key]: value }))` so we pass a new object every time. React sees a new reference and re-renders, and the filter controls and member list update correctly.
- **Connected to another bug?** No.

---

## Bug 7 — Bookmarked members disappear when you leave and come back

- **Exact error / console output:** No error.
- **Steps to reproduce:**
  1. Bookmark some members on the Dashboard
  2. Go to Activity Feed (or anywhere else) and then back to Dashboard
  3. Your bookmarks are gone
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Bookmarks didn’t survive navigation or refresh.
- **Root cause — the why:** Bookmark state lived only in MemberGrid as `useState(new Set())`. When you navigate away, that component unmounts and the state is gone. When you come back, it mounts again with a fresh empty Set.
- **Fix and why it works:** I persist bookmark IDs in localStorage (key `teampulse-bookmarks`). On mount we read from there with `useState(loadBookmarks)`. Every time you toggle a bookmark we update state and also call `saveBookmarks(next)`. On first load when localStorage is empty, after we fetch members we seed bookmarks from the API’s `bookmarked` field and save that too, so the initial state is also persisted.
- **Connected to another bug?** No.

---

## Bug 8 — Notification dropdown doesn’t close when you click outside

- **Exact error / console output:** No error.
- **Steps to reproduce:**
  1. Click the bell icon
  2. Click anywhere else on the page
  3. The dropdown stays open
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** You had to click the bell again to close it; clicking outside did nothing.
- **Root cause — the why:** Nothing was listening for clicks outside the notification area. Only the bell button toggled the state.
- **Fix and why it works:** I wrapped the bell and the dropdown in a div with a ref and reused the same “click outside” idea as the search: the document mousedown handler checks if the click was inside that ref; if not, we set `showNotifications` to false. The wrapper has `position: relative` so the dropdown still positions correctly under the button.
- **Connected to another bug?** No.

---

## Bug 9 — Resize listener never removed (Dashboard)

- **Exact error / console output:** You might see a React warning in dev: “Can’t perform a React state update on an unmounted component.”
- **Steps to reproduce:**
  1. Open the Dashboard (resize listener gets added)
  2. Navigate to Activity Feed so the Dashboard unmounts
  3. Resize the window—the listener is still there and may call setGridCols
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** Listener leak and possible setState-after-unmount when resizing after leaving the Dashboard.
- **Root cause — the why:** The effect added `window.addEventListener('resize', ...)` but never returned a cleanup, so when the Dashboard unmounted the listener stayed attached and kept firing.
- **Fix and why it works:** I gave the handler a name and returned a cleanup that calls `removeEventListener`. When the component unmounts, the effect cleanup runs and the listener is removed.
- **Connected to another bug?** No.

---

## Bug 10 — Modal shows the wrong member when you open from header search

- **Exact error / console output:** No error.
- **Steps to reproduce:**
  1. Open a member from the grid (modal shows Member A), then use header search to open Member B (or close and search for B)
  2. The modal can still show Member A’s info instead of B’s
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** You clicked a search result but the modal showed someone else’s profile.
- **Root cause — the why:** MemberModal uses `useState(member)` for its internal state. That initial value is only used on first mount. When the parent passed a *different* member (e.g. from search), we were reusing the same modal instance, so its internal state never updated and it kept showing the previous member.
- **Fix and why it works:** I render the modal with `key={selectedMember.id}`. When you select a different member, the key changes so React unmounts the old modal and mounts a new one. The new instance gets the correct `member` in its initial state. This only became visible after fixing Bug 4 (making search results open a member).
- **Connected to another bug?** Yes. Showed up after implementing “click on search result to open member” (Bug 4).

---

## Bug 11 — localStorage can throw and crash the app (bookmarks)

- **Exact error / console output:** In private mode or when quota is exceeded you can get `QuotaExceededError` or `SecurityError` when saving bookmarks.
- **Steps to reproduce:**
  1. In an environment where localStorage is full or disabled, toggle a bookmark
  2. The app can throw and crash
- **Viewport / device tested:** Environment-dependent
- **Symptom — what you saw:** Unhandled exception when toggling bookmarks in those cases.
- **Root cause — the why:** `saveBookmarks` called `localStorage.setItem` with no try/catch. If the browser throws, the error bubbles up.
- **Fix and why it works:** I wrapped the write in try/catch and ignore the error. The UI state is already updated; we just skip persisting that one write. `loadBookmarks` already had try/catch for parse errors.
- **Connected to another bug?** No.

---

## Bug 12 — Filter context re-renders everyone too often

- **Exact error / console output:** No error—just unnecessary re-renders.
- **Steps to reproduce:**
  1. Use the app with the sidebar filters and member grid
  2. Any re-render elsewhere (e.g. navigation) would re-render filter consumers even when filters hadn’t changed
- **Viewport / device tested:** Desktop Chrome
- **Symptom — what you saw:** More re-renders than needed.
- **Root cause — the why:** The context value was `value={{ filters, updateFilter }}`—a new object every render. React compares by reference, so consumers always thought the value changed and re-rendered.
- **Fix and why it works:** I memoized: `updateFilter` is in `useCallback` (empty deps) and the value object is in `useMemo(() => ({ filters, updateFilter }), [filters, updateFilter])`. The reference only changes when filters or the callback actually change, so we only re-render when it matters.
- **Connected to another bug?** No.

---

## Bug 13 — ⌘K / Ctrl+K listener never cleaned up (App)

- **Exact error / console output:** No visible error. In theory a small leak if the root ever unmounts (e.g. in tests).
- **Steps to reproduce:**
  1. Load the app (listener is added)
  2. If the root unmounts, the listener would still be there
- **Viewport / device tested:** N/A (best-practice fix)
- **Symptom — what you saw:** Listener added but never removed.
- **Root cause — the why:** The effect in App that opens the search overlay on ⌘K/Ctrl+K added the keydown listener but didn’t return a cleanup, so it was never removed.
- **Fix and why it works:** The effect now returns a function that removes the listener. I also set the dependency array to `[]` so we only add it once on mount.
- **Connected to another bug?** No.
