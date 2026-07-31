// Media queries shared by the layout code and the CSS.
//
// Keep the pixel values in sync with the matching @media blocks in App.css —
// the drawer/bottom-sheet behaviour is half JS (state) and half CSS (paint),
// and they have to flip at the same width or the two halves disagree.

import { useEffect, useState } from "react";

/** Below this the workbench stops splitting horizontally: Explorer becomes an
 *  overlay drawer and Output becomes a bottom sheet. */
export const NARROW_QUERY = "(max-width: 900px)";

/** Primary pointer is a finger — phones and tablets, including iPadOS (which
 *  reports itself as a Mac). A laptop with a touchscreen keeps the mouse-first
 *  UI because its primary pointer is still fine. */
export const COARSE_QUERY = "(pointer: coarse)";

export function matchesQuery(query: string): boolean {
  return typeof window !== "undefined" && !!window.matchMedia
    ? window.matchMedia(query).matches
    : false;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchesQuery(query));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // the query may have flipped between render and effect
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** True while the viewport is in the phone/small-tablet layout. */
export const useNarrowLayout = () => useMediaQuery(NARROW_QUERY);

/** True on touch-first devices. */
export const isTouchDevice = () => matchesQuery(COARSE_QUERY);
