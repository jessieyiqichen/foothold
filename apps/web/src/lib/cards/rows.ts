// Rows from fh_today and fh_saved, checked before use: the page shows nothing it has not read field by field. Links
// are https only, and mail opens only for a contact the database calls an email.
import { FAMILIES, LEVELS, type Family, type Level } from "../profile/roles";
import { MAX_ROLES_ON_CARD, PERSON_SOURCES, type PersonSource } from "./constants";
import type { CardPerson, CardRole, CompanyCard, SavedCard } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const textOrNull = (value: unknown): string | null | undefined => (value === null || value === undefined ? null : typeof value === "string" ? value : undefined);
const numberOrNull = (value: unknown): number | null | undefined => (value === null || value === undefined ? null : typeof value === "number" ? value : undefined);
const dateOrNull = (value: unknown): string | null | undefined =>
  value === null || value === undefined ? null : typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : undefined;

/** The link if it is a full https address, else null. */
export function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    return new URL(value).protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

/** A plain address, with nothing a mail link could carry along (no `?cc=`, no spaces). */
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** A company id: a whole number, also when a client sends a bigint as text. */
function companyIdOf(value: unknown): number | null {
  const id = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}

function rowToRole(row: unknown): CardRole | null {
  if (!isRecord(row)) return null;
  const { id, title, posted_at: postedAt, family, level, shared } = row;
  const url = httpsUrl(row.url);
  if (!(typeof id === "string" || typeof id === "number") || typeof title !== "string" || title.trim() === "" || !url) return null;
  const posted = dateOrNull(postedAt);
  if (posted === undefined || typeof family !== "string" || typeof level !== "string" || !isStrings(shared)) return null;
  return {
    id: String(id), title: title.trim(), url, postedAt: posted, shared: [...shared],
    family: FAMILIES.find((f) => f.id === family)?.id ?? ("other" satisfies Family),
    level: LEVELS.find((l) => l.id === level)?.id ?? ("unspecified" satisfies Level),
  };
}

/** The person, or null when any part needed to reach them or to say where they came from is missing. */
function rowToPerson(row: unknown): CardPerson | null {
  if (!isRecord(row)) return null;
  const { name, role, contact_kind: kind, contact, source, seen_at: seenAt } = row;
  if (typeof name !== "string" || name.trim() === "" || typeof contact !== "string") return null;
  if (typeof source !== "string" || !PERSON_SOURCES.includes(source as PersonSource)) return null;
  if (typeof seenAt !== "string" || Number.isNaN(Date.parse(seenAt))) return null;
  const href = kind === "email" ? (EMAIL.test(contact) ? `mailto:${contact}` : null) : kind === "url" ? httpsUrl(contact) : null;
  if (!href) return null;
  return {
    name: name.trim(), role: typeof role === "string" && role.trim() ? role.trim() : null, contactKind: kind as CardPerson["contactKind"], contact, href,
    source: source as PersonSource, sourceUrl: httpsUrl(row.source_url), seenAt,
  };
}

/** A row as a card, or null when the company cannot be named or a field is of the wrong type. */
export function rowToCard(row: unknown): CompanyCard | null {
  if (!isRecord(row)) return null;
  const companyId = companyIdOf(row.company_id);
  const { name, shared, score, roles } = row;
  if (companyId === null || typeof name !== "string" || name.trim() === "" || !isStrings(shared) || typeof score !== "number" || !Array.isArray(roles)) return null;
  const facts = {
    oneLiner: textOrNull(row.one_liner), teamSize: numberOrNull(row.team_size), batch: textOrNull(row.batch), stage: textOrNull(row.stage),
    lastPostedAt: dateOrNull(row.last_posted_at), recentRoles: numberOrNull(row.recent_roles),
  };
  if (Object.values(facts).some((value) => value === undefined)) return null;
  const investors = row.investors === null || row.investors === undefined ? [] : row.investors;
  if (!isStrings(investors)) return null;
  return {
    companyId, name: name.trim(), ...(facts as { [K in keyof typeof facts]: Exclude<(typeof facts)[K], undefined> }),
    website: httpsUrl(row.website), investors: [...investors], shared: [...shared], score,
    roles: roles.map(rowToRole).filter((r): r is CardRole => r !== null).slice(0, MAX_ROLES_ON_CARD),
    person: rowToPerson(row.person),
  };
}

/** One answer from fh_today: the readable cards in order, each company once, and how many rows were dropped. */
export function readCards(data: unknown): { cards: CompanyCard[]; dropped: number } | null {
  if (!Array.isArray(data)) return null;
  const seen = new Set<number>();
  const cards = data.map(rowToCard).filter((card): card is CompanyCard => {
    if (!card || seen.has(card.companyId)) return false;
    seen.add(card.companyId);
    return true;
  });
  return { cards, dropped: data.length - cards.length };
}

/** One answer from fh_saved: saved and reached-out companies, newest decision first; skipped ones are left out. */
export function readSavedCards(data: unknown): { cards: SavedCard[]; dropped: number } | null {
  if (!Array.isArray(data)) return null;
  const kept = data.filter((row) => isRecord(row) && row.decision !== "skipped");
  const cards = kept.flatMap((row): SavedCard[] => {
    const card = rowToCard(row);
    const { decision, decided_at: decidedAt } = row as Record<string, unknown>;
    if (!card || (decision !== "saved" && decision !== "reached_out") || typeof decidedAt !== "string" || Number.isNaN(Date.parse(decidedAt))) return [];
    return [{ ...card, decision, decidedAt }];
  });
  cards.sort((a, b) => Date.parse(b.decidedAt) - Date.parse(a.decidedAt));
  return { cards, dropped: kept.length - cards.length };
}
