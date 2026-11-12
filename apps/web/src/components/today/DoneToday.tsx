"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ScreenHeading } from "@/components/ui/ScreenHeading";
import { countOf } from "@/lib/phrases";
import type { BowlDay } from "@/lib/scene";
import { doneStats, type DoneStat } from "@/lib/session";
import type { Goal } from "@/lib/types";
import { useCountUp } from "@/lib/useCountUp";
import { CatArt } from "./CatArt";
import { ShelfBowl } from "./Room";

interface Props {
  /** Shown under the celebration: the moment something useful is done is when to ask. */
  prompt?: ReactNode;
  goal: Goal;
  doneToday: number;
  doneTotal: number;
  streakDays: number;
  /** "Halfway there!" when today crossed a quarter of the road. */
  milestone?: string | null;
  next: Goal | null;
  onStartNext: () => void;
  /** Back to Today. */
  onContinue: () => void;
  /** This week's bowls, for the streak moment. */
  bowls: BowlDay[];
  /** The first goal finished today: the streak gets its own moment after the results, like a finished lesson's. */
  streakMoment?: boolean;
}

/** Each result is a badge like a lesson-complete screen: a honey strip with its name, an icon and the number. One colour
 *  for all of them, the reward colour that progress uses everywhere (green is kept for things you press) (reviewer, user
 *  2026-10-19: three colours read as three kinds of thing). The icon says which: a full bowl for days in a row, the flag
 *  for the road, a fish for every one done. Badges are celebration, not controls: a border, never the clay lip. */
const ICON: Record<string, string | null> = {
  Streak: "/cat/bowl-full.png",
  "So far": null,
  "All time": "/cat/fish.png",
};

function Flag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7">
      <path
        d="M6 3v18"
        stroke="var(--color-reward-deep)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d="M7 4c4-1.5 7 1.5 11 0l-2 4 2 4c-4 1.5-7-1.5-11 0z"
        fill="var(--color-flag)"
      />
    </svg>
  );
}

/** One badge: it bounces in after the one before it and its number counts up. */
function Badge({ stat, index }: { stat: DoneStat; index: number }) {
  const shown = useCountUp(stat.value, 500 + index * 220);
  const icon = ICON[stat.label] ?? null;
  const suffix = stat.unit
    ? shown === 1
      ? stat.unit.one
      : stat.unit.many
    : stat.suffix;
  return (
    <li
      className="badge-in flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-reward bg-surface"
      style={{ ["--delay" as string]: `${0.35 + index * 0.22}s` }}
    >
      <span className="bg-reward px-1 py-1 text-center font-display text-sm font-semibold text-ink">
        {stat.label}
      </span>
      <span className="flex items-center justify-center gap-1 whitespace-nowrap px-1 py-3">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small decorative icon
          <img src={icon} alt="" aria-hidden="true" className="w-6" />
        ) : (
          <Flag />
        )}
        <span
          aria-hidden="true"
          className="font-display text-xl font-bold tabular-nums text-reward-deep"
        >
          {shown}
          {suffix}
        </span>
        <span className="sr-only">
          {stat.value}
          {stat.unit
            ? stat.value === 1
              ? stat.unit.one
              : stat.unit.many
            : stat.suffix}
        </span>
      </span>
    </li>
  );
}

/** Slow light rays behind Titi, in the sun colour, like the burst behind a finished lesson. */
function Rays({ className = "size-[150%]" }: { className?: string }) {
  const wedges = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    // The turning square is clipped to a circle, so its corners never widen the page on a phone
    <div
      aria-hidden="true"
      className={`absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full ${className}`}
    >
      <svg viewBox="-100 -100 200 200" className="rays size-full">
        {wedges.map((a) => (
          <path
            key={a}
            d="M0,0 L-9,-100 L9,-100 Z"
            transform={`rotate(${a})`}
            fill="var(--color-sun)"
            opacity={0.8}
          />
        ))}
        <circle r={46} fill="var(--color-sun)" />
      </svg>
    </div>
  );
}

/** One shower of fish treats and hearts across the screen, once. Hidden under reduced motion. */
function Confetti() {
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    left: (i * 61) % 100,
    delay: (i % 6) * 0.14,
    fall: 2.2 + (i % 5) * 0.25,
    sway: ((i % 4) - 1.5) * 26,
    spin: (i % 2 ? 1 : -1) * (200 + (i % 3) * 120),
    fish: i % 3 !== 0,
  }));
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti absolute top-0"
          style={{
            left: `${p.left}%`,
            ["--delay" as string]: `${p.delay}s`,
            ["--fall" as string]: `${p.fall}s`,
            ["--sway" as string]: `${p.sway}px`,
            ["--spin" as string]: `${p.spin}deg`,
          }}
        >
          {p.fish ? (
            // eslint-disable-next-line @next/next/no-img-element -- decorative
            <img src="/cat/fish.png" alt="" className="w-8" />
          ) : (
            <svg viewBox="0 0 24 24" className="size-5">
              <path
                d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.2 0 3.6 1.3 5.3 3.2 1.7-1.9 3.1-3.2 5.3-3.2 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"
                fill="var(--color-heart)"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}

/** What comes after: the next goal, or back to Today, and the nudge question when it is due. */
function Onward({
  next,
  onStartNext,
  onContinue,
  prompt,
}: Pick<Props, "next" | "onStartNext" | "onContinue" | "prompt">) {
  return (
    <>
      {/* The question comes before the way out, so it is seen before you leave (reviewer, user 2026-10-19) */}
      {prompt && <div className="mt-8 w-full text-left">{prompt}</div>}
      <div className="mt-8 flex w-full flex-col items-center gap-3 lg:items-start">
        {next ? (
          <>
            <Button size="lg" onClick={onStartNext} className="w-full">
              Next: {next.title} →
            </Button>
            <Button variant="ghost" onClick={onContinue}>
              Or stop here, today counts
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={onContinue} className="w-full">
            Back to Today
          </Button>
        )}
      </div>
    </>
  );
}

/** The streak's own moment, once a day: the count in big honey numbers and this week's bowls, today's popping in. */
function StreakMoment({
  days,
  bowls,
  children,
}: {
  days: number;
  bowls: BowlDay[];
  children: ReactNode;
}) {
  const shown = useCountUp(days, 250);
  return (
    <section
      aria-labelledby="streak-title"
      className="relative flex flex-col items-center pt-10 text-center lg:mx-auto lg:w-full lg:max-w-xl"
    >
      <div aria-hidden="true" className="fixed inset-0 -z-20 bg-celebrate" />
      {/* One centred column on every screen: the fish in its rays, then the number under it (user, 2026-10-19: the
          number alone on the left of a two-column page read oddly; the space under the column is fine) */}
      <div className="relative flex size-44 items-center justify-center">
        <Rays />
        {/* eslint-disable-next-line @next/next/no-img-element -- the fish treat, the streak's mark */}
        <img
          src="/cat/fish.png"
          alt=""
          aria-hidden="true"
          className="pop-in w-28"
        />
      </div>
      <p
        aria-hidden="true"
        className="mt-4 font-display text-7xl font-bold tabular-nums text-reward-deep"
      >
        {shown}
      </p>
      <ScreenHeading
        id="streak-title"
        className="font-display text-3xl font-bold text-ink"
      >
        {days}-day streak!
      </ScreenHeading>
      <p className="mt-1 font-display text-lg font-semibold text-muted">
        Come back tomorrow to keep it going
      </p>
      <ol aria-label="This week" className="mt-8 flex w-full items-end gap-1">
        {bowls.map((b) => (
          <ShelfBowl key={b.date} bowl={b} pop={b.today} />
        ))}
      </ol>
      {children}
    </section>
  );
}

/** The reward when today's number is reached, like a lesson-complete screen: light rays and Titi jumping for joy, a
 *  shower of fish once, what you did in words, three badges that bounce in and count up. On the first finish of the
 *  day "See my streak" leads to the streak's own moment; otherwise the next step is right here. Buttons say where they
 *  go: "See my streak", "Back to Today" (the navigation's name for it), not "Continue" or "Titi's room". */
export function DoneToday({
  prompt,
  goal,
  doneToday,
  doneTotal,
  streakDays,
  milestone = null,
  next,
  onStartNext,
  onContinue,
  bowls,
  streakMoment = false,
}: Props) {
  const [stage, setStage] = useState<"results" | "streak">("results");
  const stats = doneStats(goal, { doneToday, doneTotal, streakDays });
  const onward = (
    <Onward
      next={next}
      onStartNext={onStartNext}
      onContinue={onContinue}
      prompt={prompt}
    />
  );
  if (stage === "streak")
    return (
      <StreakMoment days={streakDays} bowls={bowls}>
        {onward}
      </StreakMoment>
    );
  return (
    <section
      aria-labelledby="done-title"
      className="relative flex flex-col items-center pt-2 text-center lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:pb-16 lg:pt-0 lg:text-left"
    >
      <div aria-hidden="true" className="fixed inset-0 -z-20 bg-celebrate" />
      <Confetti />
      {/* On a desktop: Titi jumping in her rays on the right five columns, what you did and the way on on the left
          seven (user, 2026-10-19), both starting right under the navigation like every page; the rays stay inside a
          square as wide as their column, so they never reach the navigation. On a phone nothing changes */}
      <div className="relative mt-4 w-52 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:mt-0 lg:flex lg:aspect-square lg:w-full lg:items-center lg:justify-center lg:self-start">
        <Rays className="size-[150%] lg:size-[92%]" />
        <CatArt
          mood="celebrate"
          effect="party"
          sun={false}
          className="pop-in w-52 lg:w-80"
        />
      </div>
      <div className="contents lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:items-start lg:self-start">
        <ScreenHeading
          id="done-title"
          className="mt-4 font-display text-4xl font-bold text-ink lg:mt-0 lg:text-6xl"
        >
          Done for today!
        </ScreenHeading>
        <p className="mt-1 font-display text-xl font-semibold text-ink lg:mt-3 lg:text-2xl">
          {countOf(doneToday, goal.unit)} done, Titi is so proud!
        </p>
        <ul aria-label="Today's results" className="mt-6 flex w-full gap-3">
          {stats.map((stat, i) => (
            <Badge key={stat.label} stat={stat} index={i} />
          ))}
        </ul>
        {milestone && (
          <p
            className="badge-in mt-5 font-display text-xl font-semibold text-ink"
            style={{ ["--delay" as string]: "1.1s" }}
          >
            {milestone}
          </p>
        )}
        {streakMoment && streakDays > 0 ? (
          <div className="mt-8 w-full">
            <Button
              size="lg"
              onClick={() => setStage("streak")}
              className="w-full"
            >
              See my streak
            </Button>
          </div>
        ) : (
          onward
        )}
      </div>
    </section>
  );
}
