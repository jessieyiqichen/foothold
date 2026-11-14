// People from HN "Who is hiring" posts: the addresses a poster wrote in their own post, and, when they said it, their
// name and role. Only what the post itself says; nothing is guessed, looked up or checked by sending mail.
// An address is kept only if it is on the company's own domain or written right after "me" (the poster's own route);
// a name or role goes only on the poster's own address. Every pattern has bounded repeats and the text read is cut
// at SCAN_MAX, so a crafted post costs no more than a normal one.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

export interface HnPerson {
  email: string;
  /** The first name the poster gave ("I'm Ravi"), only on their own address. */
  name: string | null;
  /** What the poster said they do ("co-founder/CTO"), only on their own address. */
  role: string | null;
}

/** HN posts in the November 2026 thread are at most 4,408 characters; past this, nothing is read. */
const SCAN_MAX = 6000;
const ROLE_MAX = 100;
/** The local part may not start inside a longer run, and the domain ends where letters and digits end. */
const EMAIL = /(?<![a-z0-9._%+-])([a-z0-9._%+-]{1,64})@((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,8}[a-z]{2,24})(?![a-z0-9-])/gi;
/** Local parts that name an inbox, not a person: the poster's name never goes on these. */
const INBOX = /^(jobs?|careers?|hiring|hire|hr|recruit\w*|talent|hello|hi|info|team|apply|applications?|work|contact|people|join|founders?)$/;
/** Addresses written as examples, and addresses that are not a way to reach anyone. */
const NOT_ROUTE = /@(example|company|domain|email|yourcompany)\.com$|^(you|your\.?name|name|first\.?last|git|noreply|no-reply|donotreply|do-not-reply|mailer-daemon)@/;
/** Job-board and code hosts named in a header: their domain is not the company's. */
const HOSTED = /(^|\.)(ashbyhq\.com|greenhouse\.io|lever\.co|workable\.com|rippling\.com|gem\.com|bamboohr\.com|github\.com|gitlab\.com|linkedin\.com|ycombinator\.com|notion\.site|google\.com|wellfound\.com)$/;
/** Capitalised words that follow "I'm" without being a name. */
const NOT_NAMES = new Set(["Hiring", "Happy", "Looking", "Based", "Building", "Back", "Excited", "Not", "Also", "The", "A", "An", "Here", "Still", "Currently", "Now", "On", "In"]);
/** "email me at acme dot com" is a website, not an address for "me". */
const PRONOUNS = /^(me|us|you|him|her|them|it|at)$/i;
/** The words after which a bare "name at domain dot tld" is an address the poster meant. */
const CUE = String.raw`(?:e-?mail(?:\s+(?:me|us))?|reach\s+(?:me|us)(?:\s+at)?|send\s+(?:[a-z]{1,20}\s+){0,3}to|contact(?:\s+(?:me|us))?|write\s+to(?:\s+(?:me|us))?)`;
const BARE = new RegExp(String.raw`\b(${CUE})([ \t]{0,3}:?[ \t]{0,3})([a-z0-9._%+-]{1,64})[ \t]{1,3}at[ \t]{1,3}([a-z0-9-]{1,63}(?:[ \t]{1,3}dot[ \t]{1,3}[a-z0-9-]{1,63}){1,4})\b`, "gi");
const ROLE = String.raw`(?:co-?founder(?:\s?(?:\/|and|&)\s?(?:CEO|CTO|COO|CPO))?|founder(?:\s?(?:\/|and|&)\s?(?:CEO|CTO|COO|CPO))?|CEO|CTO|COO|CPO|CFO|VP(?: of|,)? [A-Z][A-Za-z]{1,40}|head of [A-Za-z]{1,30}|(?:hiring|engineering) manager|recruiter|tech lead)`;

/** "jobs[at]acme.org", "dana [at] acme [dot] com", and "email: kofi at mail dot com" after a contact cue. */
export function deobfuscate(text: string): string {
  return text
    .replace(/[ \t]{0,3}[\[({<][ \t]{0,3}at[ \t]{0,3}[\])}>][ \t]{0,3}/gi, "@")
    .replace(/[ \t]{0,3}[\[({<][ \t]{0,3}dot[ \t]{0,3}[\])}>][ \t]{0,3}/gi, ".")
    .replace(BARE, (m, cue: string, gap: string, user: string, host: string) =>
      PRONOUNS.test(user) ? m : `${cue}${gap}${user}@${host.replace(/[ \t]{1,3}dot[ \t]{1,3}/gi, ".")}`);
}

/** The domains a post's first line names ("Acme | Engineer | acme.com"), lower-cased, hosted job boards left out. */
export function headerDomains(text: string): string[] {
  const first = text.slice(0, 300).split("\n")[0];
  const found = new Set<string>();
  for (const m of first.matchAll(/(?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]{1,63}\.){1,4}[a-z]{2,24})(?![a-z0-9-])/gi)) {
    if (/[A-Z]/.test(m[1])) continue; // "Node.js" is a word in a header, not a domain
    const d = m[1].toLowerCase();
    if (!HOSTED.test(d)) found.add(d);
  }
  return [...found];
}

/** The poster's own introduction: a first name and a role, each null when not said. */
function introduction(text: string): { name: string | null; role: string | null } {
  const named = new RegExp(String.raw`\b(?:I'?m|I am|my name is) ([A-Z][a-z]{1,30})\b(?:,? (?:the |a |our )?(${ROLE}))?`).exec(text);
  const name = named && !NOT_NAMES.has(named[1]) ? named[1] : null;
  let role = name && named?.[2] ? named[2] : null;
  role ??= new RegExp(String.raw`\b(?:I'?m|I am) (?:the|a|an) (${ROLE})`, "i").exec(text)?.[1] ?? null;
  role ??= (() => {
    const team = /\bI (run|lead) (?:the )?([A-Z][A-Za-z]{1,30}) team\b/.exec(text);
    return team ? `${team[1]}s the ${team[2]} team` : null;
  })();
  return { name, role: role ? role.trim().slice(0, ROLE_MAX) : null };
}

/** "jobs@acme.com.Thanks": a capitalised word glued after the domain ends a sentence; it is not part of the address. */
function trimSentence(domain: string): string {
  const labels = domain.split(".");
  return labels.length >= 3 && /^[A-Z][a-z]+$/.test(labels[labels.length - 1]) ? labels.slice(0, -1).join(".") : domain;
}

const onDomain = (domain: string, allowed: string[]) => allowed.some((d) => domain === d || domain.endsWith(`.${d}`));

/**
 * The addresses in one post, each with the poster's name and role when the address is theirs.
 * companyDomain: fh_companies.domain of the company the post is linked to, or null; the post's header adds more.
 */
export function peopleFromHnPost(raw: unknown, companyDomain: string | null): HnPerson[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  const text = deobfuscate(raw.slice(0, SCAN_MAX));
  const allowed = [...(companyDomain ? [companyDomain.toLowerCase().replace(/^www\./, "")] : []), ...headerDomains(text)];
  const intro = introduction(text);
  const out: HnPerson[] = [];
  for (const m of text.matchAll(EMAIL)) {
    const at = m.index ?? 0;
    const window = text.slice(Math.max(0, at - 200), at);
    const token = window.slice(window.search(/\S*$/)); // the run of non-space characters the address starts in
    if (token.includes("://")) continue; // credentials inside a link
    const email = `${m[1]}@${trimSentence(m[2])}`.toLowerCase();
    if (NOT_ROUTE.test(email) || out.some((p) => p.email === email)) continue;
    const before = text.slice(Math.max(0, at - 40), at);
    const afterMe = /\bme\b[^.\n]{0,30}$/i.test(before);
    const [local, domain] = email.split("@");
    if (!afterMe && !onDomain(domain, allowed)) continue; // someone else's address, or a guess at whose
    const carriesName = intro.name !== null && intro.name.length >= 3 && local.includes(intro.name.toLowerCase());
    const afterName = intro.name !== null && new RegExp(String.raw`\b${intro.name}\b[^.\n]{0,30}$`).test(before);
    const own = !INBOX.test(local) && (carriesName || afterMe || afterName);
    out.push({ email, name: own ? intro.name : null, role: own ? intro.role : null });
  }
  return out;
}

/**
 * False when the post's first line names domains and none is the linked company's: HN posts are linked to companies
 * by name alone (fh_link_postings), so "Stream" at getstream.io can land on another company called Stream. The
 * people task skips such posts rather than file the poster under the wrong company.
 */
export function linkAgrees(text: string, companyDomain: string | null): boolean {
  if (!companyDomain) return true;
  const own = companyDomain.toLowerCase().replace(/^www\./, "");
  const named = headerDomains(text.slice(0, SCAN_MAX));
  return named.length === 0 || named.some((d) => d === own || d.endsWith(`.${own}`) || own.endsWith(`.${d}`));
}
