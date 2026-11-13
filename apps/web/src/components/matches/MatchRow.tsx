import { familyLabel, levelLabel, MATCHES_COPY, placesLine, postedLine } from "@/lib/matches/copy";
import type { Match } from "@/lib/matches/types";

/** The kind of work and the level: two small matching labels. They can't be pressed, so they have no fill. */
const LABEL = "rounded-md border border-hairline px-1.5 py-0.5 text-[13px] font-medium text-ink";
/** A shared skill, quieter than the labels above it. */
const SKILL = "rounded-md bg-wash px-1.5 py-0.5 text-[13px] text-ink";

/** One role in a dense list. The title is the link, with extra height to press, and opens the posting on the
 *  company's own job board, where people apply. The shared skills are the reason it is listed. */
export function MatchRow({ match }: { match: Match }) {
  const details = [match.companyName, placesLine(match.locations), postedLine(match.postedAt)].filter(Boolean).join(" · ");
  return (
    <li className="flex min-w-0 flex-col gap-1.5 border-b border-hairline py-3 last:border-b-0">
      <h3 className="text-base font-semibold leading-snug">
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-1.5 inline-block rounded-md py-1.5 break-words text-ink underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {match.title}
          <span aria-hidden="true" className="font-normal text-muted"> ↗</span>
          <span className="sr-only"> {MATCHES_COPY.newTab}</span>
        </a>
      </h3>
      {details && <p className="text-sm break-words text-muted">{details}</p>}
      <p className="flex flex-wrap items-center gap-1.5">
        <span className={LABEL}>{familyLabel(match.family)}</span>
        <span className={LABEL}>{levelLabel(match.level)}</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {/* Said once to a screen reader, as the list's name */}
        <span aria-hidden="true" className="text-muted">{MATCHES_COPY.why}</span>
        {match.shared.length === 0 ? (
          <span className="text-ink">{MATCHES_COPY.noShared}</span>
        ) : (
          <ul aria-label={MATCHES_COPY.why} className="flex flex-wrap gap-1.5">
            {match.shared.map((skill) => <li key={skill} className={SKILL}>{skill}</li>)}
          </ul>
        )}
      </div>
    </li>
  );
}
