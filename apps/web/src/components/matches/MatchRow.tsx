import Link from "next/link";
import { roleHref } from "@/lib/company/constants";
import { familyLabel, levelLabel, MATCHES_COPY, placesLine, postedLine } from "@/lib/matches/copy";
import { familyTileClass, LEVEL_TILE_CLASS } from "@/lib/matches/tiles";
import type { Match } from "@/lib/matches/types";

const TITLE = "-my-1.5 inline-block py-1.5 break-words text-ink underline-offset-4 hover:text-link hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
/** A shared skill: a quiet mono chip. */
const SKILL = "bg-wash px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink";

/** One role, straight and dense like a ranking row on Builder's Board: no tape, no tilt. The title, in the grotesk,
 *  opens the company's page with this role chosen (user, 2026-11-21); the posting itself is a quiet link in the meta line. One mono meta line;
 *  the family and level as two small flat tiles; the shared skills, the reason it is listed, as quiet chips. */
/** `personal` false for a signed-out visitor: there is no "why this is here" without a resume. */
export function MatchRow({ match, personal = true }: { match: Match; personal?: boolean }) {
  const details = [match.companyName, placesLine(match.locations), postedLine(match.postedAt)].filter(Boolean).join(" · ");
  return (
    <li className="flex min-w-0 flex-col gap-1.5 border-b border-hairline py-3.5 last:border-b-0">
      <h3 className="text-[17px] leading-snug font-bold tracking-[-0.01em]">
        {match.companyId === null ? (
          // No company page to open (some Hacker News posts): the title opens the post itself
          <a href={match.url} target="_blank" rel="noopener noreferrer" className={TITLE}>
            {match.title}<span aria-hidden="true" className="font-normal text-muted"> ↗</span><span className="sr-only"> {MATCHES_COPY.newTab}</span>
          </a>
        ) : (
          <Link href={roleHref(match.id)} className={TITLE}>{match.title}</Link>
        )}
      </h3>
      <p className="font-mono text-xs leading-5 break-words text-muted">
        {details}
        {details && " · "}
        <a href={match.url} target="_blank" rel="noopener noreferrer" className="text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {MATCHES_COPY.posting} ↗<span className="sr-only"> {MATCHES_COPY.newTab}</span>
        </a>
      </p>
      <p className="flex flex-wrap items-center gap-1.5">
        <span className={familyTileClass(match.family)}>{familyLabel(match.family)}</span>
        <span className={LEVEL_TILE_CLASS}>{levelLabel(match.level)}</span>
      </p>
      {personal && <div className="flex flex-wrap items-center gap-1.5">
        {/* Said once to a screen reader, as the list's name */}
        <span aria-hidden="true" className="font-mono text-[11px] text-muted">{MATCHES_COPY.why}</span>
        {match.shared.length === 0 ? (
          <span className="font-mono text-[11px] text-ink">{MATCHES_COPY.noShared}</span>
        ) : (
          <ul aria-label={MATCHES_COPY.why} className="flex flex-wrap gap-1.5">
            {match.shared.map((skill) => <li key={skill} className={SKILL}>{skill}</li>)}
          </ul>
        )}
      </div>}
    </li>
  );
}
