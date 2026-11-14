// People from HN "Who is hiring" posts: the addresses a poster wrote in their own post, and, when they said it, their
// name and role. Only what the post itself says; nothing is guessed, looked up or checked by sending mail.
// No Deno or Node imports, so vitest tests this code and the Edge Function runs it unchanged.

export interface HnPerson {
  email: string;
  /** The first name the poster gave ("I'm Caleb"), only on their own address. */
  name: string | null;
  /** What the poster said they do ("co-founder/CTO"), only on their own address. */
  role: string | null;
}

const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const EMAIL_MAX = 320;
const ROLE_MAX = 100;
/** Local parts that name an inbox, not a person: the poster's name never goes on these. */
const INBOX = /^(jobs?|careers?|hiring|hire|hr|recruit\w*|talent|hello|hi|info|team|apply|applications?|work|contact|people|join|founders?)$/;
/** Addresses written as examples, not as a route. */
const PLACEHOLDER = /@(example|company|domain|email|yourcompany)\.com$|^(you|your\.?name|name|first\.?last)@/;
/** Capitalised words that follow "I'm" without being a name. */
const NOT_NAMES = new Set(["Hiring", "Happy", "Looking", "Based", "Building", "Back", "Excited", "Not", "Also", "The", "A", "An", "Here", "Still", "Currently", "Now", "On", "In"]);
/** "Contact me at acme dot com" is a website, not an address for "me". */
const PRONOUNS = /^(me|us|you|him|her|them|it|email|mail|contact|reach|write)$/i;
const ROLE = String.raw`(?:co-?founder(?:\s*(?:\/|and|&)\s*(?:CEO|CTO|COO|CPO))?|founder(?:\s*(?:\/|and|&)\s*(?:CEO|CTO|COO|CPO))?|CEO|CTO|COO|CPO|CFO|VP(?: of|,)? [A-Z][A-Za-z]+|head of [A-Za-z]+|(?:hiring|engineering) manager|recruiter|tech lead)`;

/** "jobs[at]acme.org", "jason [at] acme [dot] com", "bk at proton dot me" and the like, written back as addresses. */
export function deobfuscate(text: string): string {
  const at = String.raw`\s*[\[({<]\s*at\s*[\])}>]\s*`;
  const dot = String.raw`\s*[\[({<]\s*dot\s*[\])}>]\s*`;
  return text
    .replace(new RegExp(at, "gi"), "@")
    .replace(new RegExp(dot, "gi"), ".")
    // Bare words need a "dot" after the domain, so "we work at Acme" is left as it is.
    .replace(/\b([a-z0-9._%+-]+)\s+at\s+([a-z0-9-]+(?:\s+dot\s+[a-z0-9-]+)+)\b/gi, (m, user: string, host: string) =>
      PRONOUNS.test(user) ? m : `${user}@${host.replace(/\s+dot\s+/gi, ".")}`);
}

/** The poster's own introduction: a first name and a role, each null when not said. */
function introduction(text: string): { name: string | null; role: string | null } {
  const named = new RegExp(String.raw`\b(?:I'?m|I am|my name is)\s+([A-Z][a-z]{1,30})\b(?:,?\s+(?:the\s+|a\s+|our\s+)?(${ROLE}))?`).exec(text);
  const name = named && !NOT_NAMES.has(named[1]) ? named[1] : null;
  let role = name && named?.[2] ? named[2] : null;
  role ??= new RegExp(String.raw`\b(?:I'?m|I am)\s+(?:the|a|an)\s+(${ROLE})`, "i").exec(text)?.[1] ?? null;
  role ??= (() => {
    const team = /\bI (run|lead) (?:the )?([A-Z][A-Za-z]{1,30}) team\b/.exec(text);
    return team ? `${team[1]}s the ${team[2]} team` : null;
  })();
  return { name, role: role ? role.trim().slice(0, ROLE_MAX) : null };
}

/** The addresses in one post, each with the poster's name and role when the address is theirs. */
export function peopleFromHnPost(raw: unknown): HnPerson[] {
  if (typeof raw !== "string" || raw.length === 0) return [];
  const text = deobfuscate(raw);
  const emails: { email: string; at: number }[] = [];
  for (const m of text.matchAll(EMAIL)) {
    const email = m[0].toLowerCase().replace(/\.+$/, "");
    if (email.length > EMAIL_MAX || PLACEHOLDER.test(email) || emails.some((e) => e.email === email)) continue;
    emails.push({ email, at: m.index ?? 0 });
  }
  const intro = introduction(text);
  const personal = emails.filter((e) => !INBOX.test(e.email.split("@")[0]));
  return emails.map(({ email, at }) => {
    const local = email.split("@")[0];
    if (INBOX.test(local)) return { email, name: null, role: null };
    const carriesName = intro.name !== null && local.includes(intro.name.toLowerCase());
    const afterMe = /\bme\b[^.\n]{0,30}$/i.test(text.slice(Math.max(0, at - 40), at));
    const only = personal.length === 1;
    if (!carriesName && !(only && (afterMe || intro.role !== null))) return { email, name: null, role: null };
    return { email, name: carriesName ? intro.name : null, role: intro.role };
  });
}
