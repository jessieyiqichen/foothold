"use client";

import { startSession } from "./actions";
import { setFocusGoal } from "./store";
import type { Goal } from "./types";

/** Start: begin today's session. The goal's page is never opened here; the session offers an "Open <site>" button, so
 *  a new tab only ever appears because the person asked for it (user, 2026-10-18). */
export function startGoal(goal: Goal): void {
  setFocusGoal(goal.id);
  startSession(goal.id);
}

export function hostOf(link: string | null): string | null {
  if (!link) return null;
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const SITE_NAMES: Record<string, string> = { "linkedin.com": "LinkedIn", "leetcode.com": "LeetCode", "github.com": "GitHub", "app.joinhandshake.com": "Handshake", "joinhandshake.com": "Handshake", "indeed.com": "Indeed" };

/** "LinkedIn" for linkedin.com; otherwise the first part of the host, capitalized. */
export function siteName(link: string | null): string | null {
  const host = hostOf(link);
  if (!host) return null;
  return SITE_NAMES[host] ?? host.split(".")[0].replace(/^./, (c) => c.toUpperCase());
}
