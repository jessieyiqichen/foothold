// What kind of work a posting is (its family) and the level its title states, read from the title alone.
// A person picks the families they want; skills then rank within them (log.md, 2026-11-12: ranking on skill tags
// alone put ML engineering roles first for a resume aimed at product work).
// The level here is a stopgap until the Judge reads the posting's text: about half of all titles state no level.
// Changing a rule: edit it, raise ROLES_VERSION, run the labelling worker. No Deno or Node imports.

export const ROLES_VERSION = 1;

export const FAMILIES = [
  { id: "product", label: "Product" },
  { id: "engineering", label: "Engineering" },
  { id: "data", label: "Data and analytics" },
  { id: "research", label: "Research" },
  { id: "design", label: "Design" },
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales and solutions" },
  { id: "customer", label: "Customer success and support" },
  { id: "operations", label: "Operations and strategy" },
  { id: "finance", label: "Finance" },
  { id: "people", label: "People and recruiting" },
  { id: "legal", label: "Legal" },
  { id: "other", label: "Other" },
] as const;
export type Family = (typeof FAMILIES)[number]["id"];

export const LEVELS = [
  { id: "intern", label: "Internship" },
  { id: "entry", label: "New grad or junior" },
  { id: "unspecified", label: "Level not in the title" },
  { id: "senior", label: "Senior" },
  { id: "management", label: "Management" },
] as const;
export type Level = (typeof LEVELS)[number]["id"];

/** A whole word: not glued to a letter or digit on either side. */
const whole = (pattern: string, flags = "i") => new RegExp(`(?<![A-Za-z0-9])(?:${pattern})(?![A-Za-z0-9])`, flags);

/** First match wins, so the order is the rule: "Product Designer" is design before it can be product, "Product
 *  Marketing Manager" marketing, "Sales Engineer" sales, "Technical Sourcer - Engineering" people. */
const FAMILY_RULES: [family: Family, re: RegExp][] = [
  ["design", whole("designers?|head of design|product design|design lead|ux|ui/ux|creative director|art director")],
  ["legal", whole("counsel|attorney|lawyer|paralegal|legal")],
  ["data", whole("data scien\\w+|data analy\\w+|analytics|business analyst|business intelligence|bi analyst|quantitative analyst|statistician|decision scien\\w+")],
  ["research", whole("research\\w*|scientists?")],
  ["sales", whole("account executives?|account managers?|account directors?|sales|business development|bdr|sdr|pre-?sales|solutions? (?:engineer\\w*|consultant|architect)|partnerships?|partner manager|channel|alliances|rvp|capture manager")],
  ["customer", whole("customer success|customer support|customer experience|customer service|customer relations|customer onboarding|client success|support (?:engineer|specialist|agent|associate)|implementation")],
  ["marketing", whole("marketing|marketer|demand generation|seo|sem|communications|community manager|brand manager|content (?:strategist|manager|writer)|public relations")],
  ["product", whole("product manage\\w+|product lead|head of product|product owner|product operations|product strateg\\w+|chief product officer")],
  ["product", whole("A?PM", "")],
  ["people", whole("recruit\\w+|sourcer|talent (?:acquisitions?|partner|operations|brand|sourc\\w+|manager|lead)|head of talent|people|human resources|hrbp|hr|compensation")],
  ["finance", whole("financ\\w+|accountants?|accounting|controller|fp&a|payable|receivable|tax|treasury|payroll|audit\\w*")],
  ["engineering", whole("engineer\\w*|developers?|sdet|devops|sre|architect|member of technical staff|programmer|full[- ]?stack|backend|frontend")],
  ["operations", whole("operations|ops|bizops|chief of staff|program manager|project manager|strateg\\w+|supply chain|procurement|office manager")],
];

/** The kind of work a title names, or "other" when it names none of the listed kinds. */
export function familyOf(title: string | null): Family {
  if (!title) return "other";
  for (const [family, re] of FAMILY_RULES) if (re.test(title)) return family;
  return "other";
}

/** Titles that manage people. "Manager" alone is not one: product, account, project and success managers are not. */
const MANAGEMENT = "directors?|head of|vp|rvp|vice president|president|chief \\w+ officer|c[efmopt]o|engineering manager|(?:senior|sr\\.?) manager|general manager";
const LEVEL_RULES: [level: Level, re: RegExp][] = [
  ["intern", whole("intern|interns|internship|co-?op|student|apprentice\\w*|fellowship")],
  ["entry", whole("new grad\\w*|graduate|junior|jr\\.?|entry[- ]level|early career|associate(?! (?:director|vp|rvp|vice|principal|general counsel|partner))")],
  ["management", whole(MANAGEMENT)],
  ["management", /^\s*manager\b/i],
  ["senior", whole("senior|sr\\.?|(?<!of )staff|principal|lead|distinguished")],
];

/** The level a title states. "unspecified" means the title does not say, not that the role is open to anyone. */
export function levelOf(title: string | null): Level {
  if (!title) return "unspecified";
  for (const [level, re] of LEVEL_RULES) if (re.test(title)) return level;
  return "unspecified";
}
