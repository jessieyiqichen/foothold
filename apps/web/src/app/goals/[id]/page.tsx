import type { Metadata } from "next";
import { Suspense } from "react";
import { GoalView } from "@/components/goals/GoalView";
import { AppShell } from "@/components/ui/AppShell";

export const metadata: Metadata = { title: "Progress · Nudge" };

type Props = PageProps<"/goals/[id]">;

/** Goals live in the browser, so only the id (and where you came from) is read here; the screen does the rest. */
async function Progress({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const { from } = await searchParams;
  return <GoalView id={id} fromToday={from === "today"} />;
}

export default function ProgressPage({ params, searchParams }: Props) {
  return (
    <AppShell width="medium">
      <Suspense fallback={<p className="pt-6 text-muted">Loading your progress…</p>}>
        <Progress params={params} searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
