"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { deleteGoal, pauseGoal, resumeGoal } from "@/lib/actions";
import { formatShortDate } from "@/lib/dates";
import { stashRemoved } from "@/lib/store";
import type { Goal } from "@/lib/types";

const PAUSE_OPTIONS = [
  { days: 3, label: "3 days" },
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
];

/** Edit, a break, or remove: removing happens right away and Goals offers Undo, so no "are you sure". */
/** `inline`: beside the goal list on a desktop, Edit and Take a break in a row with Remove as a link at its far end. */
export function GoalActions({
  goal,
  today,
  inline = false,
}: {
  goal: Goal;
  today: string;
  inline?: boolean;
}) {
  const router = useRouter();
  const [pausing, setPausing] = useState(false);
  // The break lengths open under the buttons, often below a phone screen, so they are brought into view and focus
  // moves to the first one (first-run check 2: "Take a break" seemed to do nothing)
  const options = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!pausing) return;
    const box = options.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box?.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" });
    box?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
  }, [pausing]);
  const pause = goal.pauses.find((p) => p.from <= today && today <= p.to);

  function remove() {
    stashRemoved(deleteGoal(goal.id));
    router.push("/goals");
  }

  return (
    <section
      aria-label="This goal"
      className={`flex flex-col gap-3 ${inline ? "" : "lg:h-full"}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href={`/goals/${goal.id}/edit`} variant="secondary">
          Edit goal
        </ButtonLink>
        {pause ? (
          <Button
            variant="secondary"
            onClick={() => resumeGoal(goal.id, today)}
          >
            Back from the break
          </Button>
        ) : (
          <Button
            variant="secondary"
            aria-expanded={pausing}
            onClick={() => setPausing((v) => !v)}
          >
            Take a break
          </Button>
        )}
        {/* In the same row as Edit and Take a break, a real button in the warning colour, so it is found where the other
            things you can do with the goal are (user, 2026-10-19: removing a goal was too hard to find). Undo on Goals,
            so no "are you sure" */}
        <Button
          variant="secondary"
          className={`text-danger! ${inline ? "ml-auto" : ""}`}
          onClick={remove}
        >
          Remove goal
        </Button>
      </div>
      {pause && (
        <p className="text-sm font-bold text-muted">
          Taking a break until {formatShortDate(pause.to)}, no nudges and
          nothing counts as behind
        </p>
      )}
      {pausing && !pause && (
        <div ref={options} className="flex scroll-mb-6 flex-col gap-3 px-1 py-2">
          <p className="font-bold text-ink">
            How long? No nudges, and it won&apos;t count as falling behind
          </p>
          <div className="flex flex-wrap gap-2">
            {PAUSE_OPTIONS.map((o) => (
              <Button
                key={o.days}
                variant="secondary"
                onClick={() => {
                  pauseGoal(goal.id, o.days, today);
                  setPausing(false);
                }}
              >
                {o.label}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setPausing(false)}>
              Never mind
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Remove a goal from anywhere it can be changed (its progress page, and the bottom of Edit goal): right away, then Goals
 *  offers Undo, so no "are you sure" (user, 2026-10-19: removing was hard to find). */
export function RemoveGoalButton({
  goalId,
  className = "",
}: {
  goalId: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => {
        stashRemoved(deleteGoal(goalId));
        router.push("/goals");
      }}
    >
      Remove goal
    </Button>
  );
}
