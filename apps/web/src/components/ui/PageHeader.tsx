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
    <div className="flex flex-col gap-3 pt-4 lg:gap-2 lg:pt-0">
      {back && <Link href={back} className="self-start text-sm font-semibold text-muted underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-focus lg:inline-flex lg:min-h-11 lg:items-center lg:text-lg">
        {backLabel}
      </Link>}
      <Heading className="font-display text-3xl font-bold text-ink lg:text-4xl">{title}</Heading>
      {intro && <p className={`font-bold text-muted lg:text-lg ${introOnDesktop ? "" : "lg:hidden"}`}>{intro}</p>}
    </div>
  );
}
