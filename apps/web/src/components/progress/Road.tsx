"use client";

import { useEffect, useRef, useState } from "react";
import { formatShortDate } from "@/lib/dates";
import type { RoadStory } from "@/lib/story";
import type { Goal } from "@/lib/types";

/** The painted hillside (art generated with GPT from the author's prompt), in its own pixels. */
const W = 1586;
const H = 992;

/** The middle of the painted path, traced by hand from the start near the bottom to the hilltop. */
const TRACE: [number, number][] = [
  [300, 890], [250, 830], [255, 800], [360, 762], [500, 750], [660, 735], [820, 720], [980, 700], [1090, 675],
  [1160, 630], [1150, 575], [1105, 540], [1098, 505], [1125, 470], [1210, 440], [1320, 405], [1410, 370],
  [1432, 330], [1395, 295], [1335, 276],
];

/** A smooth curve through the trace (Catmull-Rom), sampled finely so points can be found by distance along it. */
function smooth(points: [number, number][], per = 12): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, points.length - 1)];
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const CURVE = smooth(TRACE);
const LENGTHS = CURVE.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + Math.hypot(p[0] - CURVE[i - 1][0], p[1] - CURVE[i - 1][1]));
  return acc;
}, []);
const TOTAL = LENGTHS[LENGTHS.length - 1];

/** The spot a share `t` (0 to 1) of the way along the path. */
function point(t: number): [number, number] {
  const d = Math.min(Math.max(t, 0), 1) * TOTAL;
  const i = LENGTHS.findIndex((l) => l >= d);
  if (i <= 0) return CURVE[0];
  const k = (d - LENGTHS[i - 1]) / (LENGTHS[i] - LENGTHS[i - 1] || 1);
  return [CURVE[i - 1][0] + (CURVE[i][0] - CURVE[i - 1][0]) * k, CURVE[i - 1][1] + (CURVE[i][1] - CURVE[i - 1][1]) * k];
}

/** Things further up the hill are further away, so they are drawn smaller: full size at the bottom, about half on top. */
function depth(y: number): number {
  return 0.5 + 0.5 * ((y - 276) / (890 - 276));
}

const STEPS = 26;
const PACE_GAP = 0.08;
const LABEL_GAP = 0.07;

/** The road's direction where `t` is, as a unit vector, read over a short stretch so a small kink does not count. */
function heading(t: number): [number, number] {
  const [ax, ay] = point(Math.max(t - 0.02, 0));
  const [bx, by] = point(Math.min(t + 0.02, 1));
  const len = Math.hypot(bx - ax, by - ay) || 1;
  return [(bx - ax) / len, (by - ay) / len];
}

/** A soft print in the dust: faint, small, left and right feet taking turns, each turned the way she walked. */
function Paw({ t, left }: { t: number; left: boolean }) {
  const [x, y] = point(t);
  const [dx, dy] = heading(t);
  const side = (left ? -1 : 1) * 9 * depth(y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return (
    <g transform={`translate(${x - dy * side} ${y + dx * side}) rotate(${angle}) scale(${1.9 * depth(y)})`} fill="var(--color-reward-deep)" opacity={0.42}>
      <ellipse cx={0} cy={2.5} rx={3.6} ry={3} />
      <circle cx={-3.8} cy={-2} r={1.4} /><circle cx={-1.3} cy={-3.8} r={1.4} /><circle cx={1.3} cy={-3.8} r={1.4} /><circle cx={3.8} cy={-2} r={1.4} />
    </g>
  );
}

/** Signposts stand on the far verge, beside the road rather than on it, so Titi walks past them. */
function verge(t: number): [number, number] {
  const [x, y] = point(t);
  const [dx, dy] = heading(t);
  // the normal that points up the picture, away from the viewer
  const [nx, ny] = dx >= 0 ? [dy, -dx] : [-dy, dx];
  const off = 62 * depth(y);
  return [x + nx * off, y + ny * off];
}

/** A small wooden signpost painted into the field: a tapered post, a board with a soft brown edge, tilted a little.
 *  Honey once reached, cream before. The board keeps one size so its number stays readable on a phone. */
function Milestone({ at, reached, count, grow }: { at: number; reached: boolean; count: number; grow: number }) {
  const [x, y] = verge(at);
  const k = depth(y);
  const post = 122 * k; // tall enough that the board clears Titi's head as she walks past
  const w = String(count).length * 26 + 40;
  const tilt = at < 0.5 ? -3 : 3;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={2} rx={20 * k} ry={5 * k} fill="url(#road-shadow)" />
      <path d={`M-4,2 L-3,${-post} L3,${-post} L4,2 Z`} fill="var(--color-reward-deep)" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={2} />
      <g transform={`translate(0 ${-post - 26 * grow}) rotate(${tilt}) scale(${grow})`}>
        <path
          d={`M${-w / 2},-24 Q0,-29 ${w / 2},-24 L${w / 2 + 2},22 Q0,27 ${-w / 2 - 2},22 Z`}
          fill={reached ? "var(--color-reward)" : "var(--color-reward-soft)"}
          stroke="var(--color-reward-deep)"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <text y={14} textAnchor="middle" fontFamily="var(--font-display)" fontSize={40} fontWeight={700} fill="var(--color-ink)">{count}</text>
      </g>
    </g>
  );
}

/** The finish: the red flag on the hilltop. The date is said in words above the picture, so no board crowds the flag. */
function Finish() {
  const [x, y] = point(1);
  const s = depth(y) * 1.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={3} rx={26} ry={7} fill="url(#road-shadow)" />
      <path d="M-4,3 L-3,-130 L3,-130 L4,3 Z" fill="var(--color-reward-deep)" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={2} />
      <circle cx={0} cy={-133} r={7} fill="var(--color-reward)" />
      <path d="M4,-126 q38,-12 76,4 l-16,24 l16,24 q-38,-16 -76,-4 z" fill="var(--color-flag)" stroke="var(--color-ink)" strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
}

/** How much to enlarge the boards so their numbers never render below 13px, however narrow the picture is. */
function useGrow(ref: React.RefObject<HTMLDivElement | null>): number {
  const [grow, setGrow] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setGrow(Math.max(1, (13 * W) / (40 * entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return grow;
}

/** True when the person asks for less motion; follows the setting if it changes while the page is open. */
function useStill(): boolean {
  const [still, setStill] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setStill(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return still;
}

/** The walk loop faces right and stands its feet 92.6% down its 444px square, its body centred at 54% across. The road
 *  pose she sits in once she has arrived stands its feet 93.7% down its 300px square, centred at 56.7%. */
const WALK = { src: "/cat/walk.webp", feet: 0.926, centre: 0.54 };
const REST = { src: "/cat/happy.png", feet: 0.937, centre: 0.567 };

/** Titi's walk along the road when it opens: from where she stood this morning to where today's logs took her, then
 *  she stops (user, 2026-10-18: a walking loop that never moves looks like marching in place). Under reduced motion,
 *  or with nothing logged today, she is simply where she is. */
function useJourney(from: number, to: number, still: boolean): { t: number; walking: boolean } {
  const idle = still || to - from < 0.002;
  const [state, setState] = useState({ t: from, walking: false });
  useEffect(() => {
    if (idle) return;
    const ms = Math.min(Math.max((to - from) * 5000, 1000), 2800);
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + 350;
      const k = Math.min(Math.max((now - start) / ms, 0), 1);
      const eased = 1 - Math.pow(1 - k, 2);
      setState({ t: from + (to - from) * eased, walking: k < 1 });
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, to, idle]);
  return idle ? { t: to, walking: false } : state;
}

/** A by-date goal as Titi walking up the painted hill path: paw prints behind her, a signpost with its number at every
 *  quarter, a dashed ring where the steady pace would be today, and a red flag on the hilltop at the deadline. Things
 *  higher up the hill are drawn smaller, so they sit in the painting's distance. No axes, no chart. */
export function Road({ goal, story }: { goal: Goal; story: RoadStory }) {
  const still = useStill();
  const { t: now, walking } = useJourney(story.from, story.at, still);
  // At the finish Titi stands just before the flag, so the flag stays in view
  const [cx, cy] = point(Math.min(now, 0.94));
  // Titi shrinks with distance too, but never so far that she is hard to see
  const cs = Math.max(depth(cy), 0.62);
  const [px, py] = point(story.pace);
  const steps = Array.from({ length: STEPS }, (_, i) => (i + 0.5) / STEPS).filter((t) => t < now - 0.045);
  // No pace ring once she has reached the flag: there is nothing left to keep pace with
  const showPace = story.at < 1 && Math.abs(story.pace - story.at) > PACE_GAP;
  const paceLabel = story.milestones.every((m) => Math.abs(m.at - story.pace) > LABEL_GAP) && story.pace < 0.92;
  const label = `${story.done} of ${goal.target} ${goal.unit}: ${Math.round(story.at * 100)}% of the road to the flag on ${formatShortDate(goal.deadline ?? "")}, ${story.ahead ? "ahead of" : "behind"} the steady pace`;
  const cat = 230 * cs;
  const finished = story.at >= 1 && !walking;
  const frame = useRef<HTMLDivElement>(null);
  const grow = useGrow(frame);
  // Which way the road runs where she stands, read over a short stretch so a small kink does not flip her: the walk
  // loop faces right, so she is mirrored where the road runs left
  const [behindX] = point(Math.max(now - 0.05, 0));
  const [aheadX] = point(Math.min(now + 0.05, 1));
  const left = aheadX < behindX;
  const pose = walking ? WALK : REST;
  const size = walking ? cat : cat * 0.92;
  return (
    <figure>
      <div ref={frame} className="relative overflow-hidden rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- painted art, sized by the card */}
        <img src="/cat/road.webp" alt="" aria-hidden="true" width={W} height={H} className="block h-auto w-full" />
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="road-shadow">
              <stop offset="0%" stopColor="var(--color-ink)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-ink)" stopOpacity={0} />
            </radialGradient>
          </defs>
          {steps.map((t, i) => <Paw key={t} t={t} left={i % 2 === 0} />)}
          {/* signposts further up the hill first, so a nearer one overlaps a farther one, never the other way */}
          {[...story.milestones].reverse().filter((m) => verge(m.at)[1] < cy).map((m) => <Milestone key={m.at} at={m.at} reached={now >= m.at} count={Math.round(m.at * goal.target)} grow={grow} />)}
          <Finish />
          {showPace && (
            <g transform={`translate(${px} ${py}) scale(${depth(py)})`}>
              <circle r={28} fill="var(--color-surface)" fillOpacity={0.4} stroke="var(--color-lip)" strokeOpacity={0.85} strokeWidth={5} strokeDasharray="8 7" strokeLinecap="round" />
              {paceLabel && <text y={66} textAnchor="middle" fontFamily="var(--font-display)" fontSize={30} fontWeight={600} fill="var(--color-lip)" stroke="var(--color-surface)" strokeWidth={8} paintOrder="stroke">pace</text>}
            </g>
          )}
          <ellipse cx={cx} cy={cy + 2 * cs} rx={78 * cs} ry={15 * cs} fill="url(#road-shadow)" />
          {finished ? (
            <image href="/cat/celebrate.png" x={cx - cat / 2} y={cy - cat + 8 * cs} width={cat} height={cat} />
          ) : (
            // Walking while she moves, then sitting where she arrived. Mirrored around her own feet where the path turns
            // left, so she always faces the way the road goes
            <image href={pose.src} x={cx - pose.centre * size} y={cy - pose.feet * size + 6 * cs} width={size} height={size} transform={walking && left ? `translate(${2 * cx} 0) scale(-1 1)` : undefined} />
          )}
          {story.milestones.filter((m) => verge(m.at)[1] >= cy).map((m) => <Milestone key={m.at} at={m.at} reached={now >= m.at} count={Math.round(m.at * goal.target)} grow={grow} />)}
        </svg>
      </div>
      <figcaption className="px-3 pt-3 text-center text-sm font-bold text-muted lg:px-1 lg:text-left">
        {/* The marker is a dashed ring, not a flag, and it is only drawn when it is clear of Titi, so the caption says so too
            (first-run check, 2026-10-18: "pace flag" sent a tester looking for a second flag). Whether you are ahead or
            behind is said once, in the headline above (reviewer, 2026-10-18). */}
        {story.at >= 1 ? "Titi made it to the end of the road!" : showPace ? "The dashed ring is where the steady pace would be today" : story.ahead ? "Titi is right on pace!" : "The steady pace is just a step ahead"}
      </figcaption>
    </figure>
  );
}
