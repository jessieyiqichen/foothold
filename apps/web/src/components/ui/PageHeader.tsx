import Link from "next/link";

interface PageHeaderProps {
  title: string;
  intro?: string;
  /** Where the back link goes; null for a page the top navigation already reaches (Goals). */
  back?: string | null;
  backLabel?: string;
  /** "h2" when the page already has its h1 (a goal shown beside the list on a desktop). */
  level?: "h1" | "h2";
  /** False when a desktop side note says the same, so the intro only shows on a phone. */
  introOnDesktop?: boolean;
}

export function PageHeader({ title, intro, back = "/", backLabel = "← Back to Today", level = "h1", introOnDesktop = true }: PageHeaderProps) {
  const Heading = level;
  return (
    <div className="flex flex-col gap-1">
      {back && <Link href={back} className="inline-flex min-h-9 items-center self-start font-mono text-xs text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
        {backLabel}
      </Link>}
      <Heading className="text-3xl font-black tracking-[-0.03em] text-ink">{title}</Heading>
      {intro && <p className={`font-mono text-xs leading-5 text-muted ${introOnDesktop ? "" : "lg:hidden"}`}>{intro}</p>}
    </div>
  );
}
