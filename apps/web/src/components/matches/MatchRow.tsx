import { familyLabel, levelLabel, MATCHES_COPY, placesLine, postedLine } from "@/lib/matches/copy";
import { familyTileClass, LEVEL_TILE_CLASS } from "@/lib/matches/tiles";
import type { Match } from "@/lib/matches/types";

/** A shared skill: a quiet mono chip. */
const SKILL = "bg-wash px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink";

/** One role, straight and dense like a ranking row on Builder's Board: no tape, no tilt. The title, in the grotesk,
 *  is the link, with extra height to press, and opens the posting on the company's own job board. One mono meta line;
 *  the family and level as two small flat tiles; the shared skills, the reason it is listed, as quiet chips. */
export function MatchRow({ match }: { match: Match }) {
  const details = [match.companyName, placesLine(match.locations), postedLine(match.postedAt)].filter(Boolean).join(" · ");
  return (
    <li className="flex min-w-0 flex-col gap-1.5 border-b border-hairline py-3.5 last:border-b-0">
      <h3 className="text-[17px] leading-snug font-bold tracking-[-0.01em]">
        <a
          href={match.url}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-1.5 inline-block py-1.5 break-words text-ink underline-offset-4 hover:text-link hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {match.title}
          <span aria-hidden="true" className="font-normal text-muted"> ↗</span>
          <span className="sr-only"> {MATCHES_COPY.newTab}</span>
        </a>
      </h3>
      {details && <p className="font-mono text-xs leading-5 break-words text-muted">{details}</p>}
      <p className="flex flex-wrap items-center gap-1.5">
        <span className={familyTileClass(match.family)}>{familyLabel(match.family)}</span>
        <span className={LEVEL_TILE_CLASS}>{levelLabel(match.level)}</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Said once to a screen reader, as the list's name */}
        <span aria-hidden="true" className="font-mono text-[11px] text-muted">{MATCHES_COPY.why}</span>
        {match.shared.length === 0 ? (
          <span className="font-mono text-[11px] text-ink">{MATCHES_COPY.noShared}</span>
        ) : (
          <ul aria-label={MATCHES_COPY.why} className="flex flex-wrap gap-1.5">
            {match.shared.map((skill) => <li key={skill} className={SKILL}>{skill}</li>)}
          </ul>
        )}
      </div>
    </li>
  );
}
