/**
 * DOS tools page their output with form feeds and CRLF line endings. Both are
 * literal characters in a <pre>, so strip them for display — downloads still
 * hand over the original bytes.
 */
export const forDisplay = (text: string) =>
  text.replace(/\r\n?/g, "\n").replace(/\f/g, "");

export interface Segment {
  text: string;
  match: boolean;
}

/** Split text into plain / matching runs, for case-insensitive highlighting. */
export function highlightSegments(text: string, needle: string): Segment[] {
  if (!needle) return [{ text, match: false }];
  const lower = text.toLowerCase();
  const wanted = needle.toLowerCase();
  const out: Segment[] = [];
  let at = 0;
  for (;;) {
    const hit = lower.indexOf(wanted, at);
    if (hit === -1) break;
    if (hit > at) out.push({ text: text.slice(at, hit), match: false });
    out.push({ text: text.slice(hit, hit + needle.length), match: true });
    at = hit + needle.length;
  }
  if (at < text.length) out.push({ text: text.slice(at), match: false });
  return out;
}
