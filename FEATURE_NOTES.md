# Feature Notes — Search Comments

Notes on how I built the Search Comments feature: what I did and why, and where I cut corners or would do more with extra time.

---

## What it does

Click “Search Comments” in the sidebar (or hit ⌘K / Ctrl+K) and you get a full-screen overlay. It loads all 500 comments from JSONPlaceholder once, then you type and we filter on the client. Results show the comment name, email, and a snippet of the body with your search term highlighted. You can move through results with the arrow keys (with wrap) and close with Escape or by clicking the backdrop.

---

## Data and API layer

I added `src/api/commentsApi.ts`. It talks to `https://jsonplaceholder.typicode.com/comments` and does the search/highlight logic.

- **fetchComments()** — Fetches all comments and caches them in a module-level variable. So the first time you open the overlay we hit the network; after that we reuse the same data. No search endpoint on the API, so “search” had to be client-side anyway.
- **searchComments(comments, query)** — Simple filter: trim and lowercase the query, then filter comments where the query appears in name, email, or body. Pure function, no async.
- **getSnippetWithHighlight(text, query, maxLength)** — Takes a comment body and returns little chunks: either `{ text, highlight: false }` or `{ text, highlight: true }` so the UI can render the match in a `<mark>` and the rest in normal text. We only show a slice of the body (default 200 chars) with some context around the first match so it’s readable.

---

## The overlay component

`SearchOverlay` lives in `src/components/Search/SearchOverlay.tsx`. It’s controlled by `isOpen` and `onClose` from App.

When the overlay opens we reset query and selection. If we already have comments in a ref we use those; otherwise we fetch and set loading/error state. Results are computed as you type: `results = query.trim() ? searchComments(comments, query) : []`. No debounce—filtering 500 items in memory is fast enough that I kept it instant. The spec says “brief pause after I stop typing”; you could add a 200–300ms debounce if you want to match that wording exactly.

Highlighting is done by calling `getSnippetWithHighlight` for each result and then mapping the segments to either `<mark className="search-overlay__highlight">` or `<span>`. No `dangerouslySetInnerHTML`—everything is real React elements as required.

Keyboard: we listen for keydown on document when the overlay is open. Escape calls `onClose()`. Arrow Down/Up update an `activeIndex` and we wrap at the ends (modulo the results length). A separate effect scrolls the active item into view with `scrollIntoView`. I didn’t implement “Enter expands the highlighted result”—that would be a nice next step (e.g. expand the body in place or show a small detail view).

Clicking the dimmed backdrop closes the overlay; clicks inside the panel don’t (we stopPropagation).

---

## Styling

All in `SearchOverlay.css`. Full-screen fixed overlay, blurred backdrop, centered panel (max 640px wide, 85vh tall) with a search bar (icon, input, clear button, Esc button) and a scrollable list. Each result row has the comment name (bold), email (lighter), and the snippet. Matches get a light purple background; the keyboard-selected row gets a solid light purple background so you can see where you are. Loading and error states are just text in the same area.

---

## Trade-offs

- **No debounce:** Typing filters immediately. For 500 items it’s fine. If you want to strictly match “brief pause after I stop typing,” add a short debounce on the query.
- **No virtual list:** We render all matching results. For 500 it’s okay. If we ever had thousands I’d add a simple virtualized list (render only what’s in view) without pulling in a library.
- **Highlight:** Done with React elements (array of `<mark>` and `<span>`), not injected HTML.
- **Stale results / unmount:** If you close the overlay before the fetch finishes, the `.then()` still runs and updates state. In theory that could run after unmount. To be safe we could use a ref (e.g. “isMounted”) and skip the state updates if the overlay is already closed. I didn’t add that yet.

---

## Files I added or changed

- **New:** `src/api/commentsApi.ts` — fetch, search, and snippet/highlight helpers.
- **Replaced:** `src/components/Search/SearchOverlay.tsx` — full implementation from the old placeholder.
- **New:** `src/components/Search/SearchOverlay.css` — overlay and result styles.

App and the sidebar were already wired (search open state, “Search Comments” button, ⌘K); I didn’t need to change that.

---

## What I’d do with more time

1. Add a short debounce (200–300ms) so it literally “pauses after you stop typing” if that’s important.
2. Make Enter expand or select the highlighted result (e.g. show full body).
3. Guard the fetch completion with an “isOpen” or “mounted” ref so we don’t set state after the overlay is closed.
4. Virtualize the list if we ever show way more results.
5. Focus trap inside the overlay and restore focus to the trigger when we close.
