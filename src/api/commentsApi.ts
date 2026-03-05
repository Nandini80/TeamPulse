const COMMENTS_URL = 'https://jsonplaceholder.typicode.com/comments';

export interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

let cachedComments: Comment[] | null = null;

export async function fetchComments(): Promise<Comment[]> {
  if (cachedComments) return cachedComments;
  const res = await fetch(COMMENTS_URL);
  if (!res.ok) throw new Error('Failed to fetch comments');
  const data = (await res.json()) as Comment[];
  cachedComments = data;
  return data;
}

export function searchComments(comments: Comment[], query: string): Comment[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return comments.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q)
  );
}

export function getSnippetWithHighlight(
  text: string,
  query: string,
  maxLength: number = 200
): { parts: { text: string; highlight: boolean }[]; fullMatch: boolean } {
  const q = query.trim().toLowerCase();
  if (!q) {
    const truncated = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    return { parts: [{ text: truncated, highlight: false }], fullMatch: false };
  }
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) {
    const truncated = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    return { parts: [{ text: truncated, highlight: false }], fullMatch: false };
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 80);
  let snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
  const parts: { text: string; highlight: boolean }[] = [];
  const snippetLower = snippet.toLowerCase();
  let pos = 0;
  while (pos < snippet.length) {
    const matchStart = snippetLower.indexOf(q, pos);
    if (matchStart === -1) {
      parts.push({ text: snippet.slice(pos), highlight: false });
      break;
    }
    if (matchStart > pos) parts.push({ text: snippet.slice(pos, matchStart), highlight: false });
    parts.push({ text: snippet.slice(matchStart, matchStart + q.length), highlight: true });
    pos = matchStart + q.length;
  }
  return { parts, fullMatch: true };
}
