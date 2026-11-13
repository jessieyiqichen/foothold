import { familyLabel, levelLabel, MATCHES_COPY, placesLine, postedLine, whyLine } from "@/lib/matches/copy";
import type { Match } from "@/lib/matches/types";

/** One role. The row itself can't be tapped, so it has no box; its title is the link, and opens the posting on the
 *  company's own job board, where people apply. The shared skills are the reason it is listed. */
export function MatchRow({ match }: { match: Match }) {
  const details = [match.companyName, placesLine(match.locations), postedLine(match.postedAt)].filter(Boolean).join(" · ");
  return (
    <li className="flex flex-col gap-1.5 border-b-2 border-wash-strong py-4 last:border-b-0">
      <h3 className="font-display text-lg font-semibold leading-snug">
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline decoration-line decoration-2 underline-offset-4 hover:decoration-ink focus-visible:outline-3 focus-visible:outline-focus"
        >
          {match.title}
          <span aria-hidden="true"> ↗</span>
          <span className="sr-only"> {MATCHES_COPY.newTab}</span>
        </a>
      </h3>
      {details && <p className="text-sm font-bold text-muted">{details}</p>}
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
        <span>{familyLabel(match.family)}</span>
        <span className="rounded-full bg-wash px-2.5 py-0.5">{levelLabel(match.level)}</span>
      </p>
      <p className="text-sm text-ink">
        <span className="font-bold text-muted">{MATCHES_COPY.why}: </span>
        {whyLine(match.shared)}
      </p>
    </li>
  );
}
