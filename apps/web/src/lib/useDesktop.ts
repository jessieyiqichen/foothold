"use client";

import { useSyncExternalStore } from "react";

/** The desktop breakpoint, the same as Tailwind's `lg`. */
const QUERY = "(min-width: 1024px)";

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(QUERY);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
}

/** True on a desktop-wide window, for layouts that differ in what they show, not only in how it is arranged (Goals shows
 *  the list and the chosen goal side by side). False on the server and the first render, so hydration matches. */
export function useDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
