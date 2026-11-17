import type { ReactNode } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ageLine } from "@/lib/cards/age";
import { contactWays } from "@/lib/cards/contact";
import { CARDS_COPY, doingLines, personName, roleTitle, sourceLine } from "@/lib/cards/copy";
import type { CardPerson, CardRole, CompanyCard } from "@/lib/cards/types";
import { levelLabel } from "@/lib/matches/copy";
import { LEVEL_TILE_CLASS } from "@/lib/matches/tiles";

const LINK = "text-link underline underline-offset-4 hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus";
const SKILL = "bg-wash px-1.5 py-0.5 font-mono text-[11px] leading-4 text-ink";

/** A link that leaves Foothold: opens in a new tab and says so to a screen reader. */
export function OutLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const mail = href.startsWith("mailto:");
  return (
    <a href={href} target={mail ? undefined : "_blank"} rel={mail ? undefined : "noopener noreferrer"} className={`${LINK} break-words ${className}`}>
      {children}
      {!mail && <span className="sr-only"> {CARDS_COPY.newTab}</span>}
    </a>
  );
}

export function Part({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2 border-t border-hairline pt-4">
      <SectionHeading id={id} level="h3">{title}</SectionHeading>
      {children}
    </section>
  );
}

/** "Why it fits you": the skills the person and the company's recent roles share. Quoted lines come with the model. */
export function WhyPart({ card, id }: { card: CompanyCard; id: string }) {
  return (
    <Part id={id} title={CARDS_COPY.why}>
      {card.shared.length === 0 ? <p className="font-mono text-xs text-ink">{CARDS_COPY.noShared}</p> : (
        <ul aria-label={CARDS_COPY.why} className="flex flex-wrap gap-1.5">
          {card.shared.map((skill) => <li key={skill} className={SKILL}>{skill}</li>)}
        </ul>
      )}
    </Part>
  );
}

export function DoingPart({ card, id }: { card: CompanyCard; id: string }) {
  return (
    <Part id={id} title={CARDS_COPY.doing}>
      <ul className="flex flex-col gap-1 font-mono text-xs leading-5 text-ink">
        {doingLines(card).map((line) => <li key={line}>{line}</li>)}
      </ul>
    </Part>
  );
}

function RoleLine({ role }: { role: CardRole }) {
  const age = ageLine(role.postedAt);
  return (
    <li className="flex flex-col gap-1">
      <OutLink href={role.url} className="text-base font-bold">{roleTitle(role)}</OutLink>
      <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted">
        <span className={LEVEL_TILE_CLASS}>{levelLabel(role.level)}</span>
        {age && <span>Posted {age}</span>}
      </p>
    </li>
  );
}

export function RolesPart({ card, id }: { card: CompanyCard; id: string }) {
  return (
    <Part id={id} title={CARDS_COPY.roles}>
      {card.roles.length === 0 ? <p className="font-mono text-xs text-muted">{CARDS_COPY.noRoles}</p> : (
        <ul className="flex flex-col gap-3">{card.roles.map((role) => <RoleLine key={role.id} role={role} />)}</ul>
      )}
    </Part>
  );
}

function PersonLines({ person }: { person: CardPerson }) {
  const source = sourceLine(person.source, person.seenAt);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-base font-bold text-ink">{personName(person)}{person.role && <span className="font-normal text-muted"> · {person.role}</span>}</p>
      <OutLink href={person.href} className="self-start text-sm">{person.contact}</OutLink>
      <p className="font-mono text-xs text-muted">{person.sourceUrl ? <OutLink href={person.sourceUrl}>{source}</OutLink> : source}</p>
    </div>
  );
}

/** The founders' page in the YC directory: a link out, with a quiet line that Foothold takes no contacts from it. */
function FoundersLink({ href }: { href: string }) {
  return (
    <div className="flex flex-col gap-1">
      <OutLink href={href} className="self-start text-sm">{CARDS_COPY.founders}</OutLink>
      <p className="font-mono text-[11px] leading-4 text-muted">{CARDS_COPY.foundersNote}</p>
    </div>
  );
}

/** "Who to contact": one person through a route they published, with where and when they were found, and the
 *  founders' YC page beneath as a second way in; with no one found yet, the YC page, or else the company's website. */
export function ContactPart({ card, id }: { card: CompanyCard; id: string }) {
  const ways = contactWays(card);
  return (
    <Part id={id} title={CARDS_COPY.contact}>
      {card.person ? <PersonLines person={card.person} /> : <p className="font-mono text-xs text-ink">{CARDS_COPY.noContact}</p>}
      {ways.founders && <FoundersLink href={ways.founders} />}
      {ways.website && <OutLink href={ways.website} className="self-start text-sm">{CARDS_COPY.website}</OutLink>}
    </Part>
  );
}
