// Builds the eval set: 20 Hacker News "Who is hiring" comments kept from the first 40, and 20 roles from company job
// boards, sampled from fh_postings on 2026-11-10 (one per company, by title: 7 junior-looking, 7 neutral, 6
// senior-looking, ordered by a hash so the pick is repeatable). The role text is fetched again through the worker's
// own parsers, so it is the same text the database holds. Run: npx vite-node evals/new-grad/build-set.ts
import { readFileSync, writeFileSync } from "node:fs";
import { type Ats, boardUrl, PARSERS } from "../../supabase/functions/fh-jobs/lib/parse";

const DIR = new URL(".", import.meta.url);
const KEEP_HN = ["Charly", "SwingVision", "Odoo", "CNH", "vvd", "Diffusion", "Datadog", "SingleStore", "MixRank",
  "Superset", "Solution Street", "Juro", "CreativeLens", "Brilliant.org", "Greenzie", "Software Engineer — Remote",
  "Paramark", "Beacon AI", "Mainmatter", "Mastra"];

/** [source_id, company, pre-label, reason]. Pre-labels are Claude's, made from the title and the requirement lines. */
const ATS: [string, string, string, string][] = [
  ["ashby:encord:fa922dac-6219-4379-be99-29c8ea59b813", "Encord", "Maybe", "'1–3 years of professional experience': one year is the floor. Your call"],
  ["ashby:ramp:b39ceb08-a0a7-4f8b-a760-2fb88e209956", "Ramp", "Yes", "Intern: 'currently pursuing a degree'"],
  ["ashby:flip:6672112f-096c-4e85-a1c9-abfcedf0d666", "Flip", "Yes", "Intern: 'currently studying or recently graduated'"],
  ["ashby:clearco:1caf6e10-704c-4480-94f1-df72f83fe42f", "Clearco", "No", "Titled Associate, but '2-4 years of experience'"],
  ["ashby:pivotrobotics:5b7e7074-aace-4b9a-9db8-245c8ad66a69", "Pivot Robotics", "Yes", "Internship, 'no prior robotics experience required'; open only to one university's students"],
  ["ashby:swarmaero:31565a0a-c55e-4d70-832d-8a4b5e5528ad", "Swarm Aero", "Yes", "Summer 2027 intern: 'currently pursuing a degree'"],
  ["lever:waabi:480d9d41-33d0-429a-8883-7f9ec305a30f", "Waabi", "Yes", "Internship/Co-op 2027"],
  ["greenhouse:earli:4538764004", "Earli", "Maybe", "A talent community, not a role; no level"],
  ["ashby:runlayer:53cb00c4-9ff5-44fa-9631-154988894834", "Runlayer", "No", "'5+ years in a customer-facing technical role'"],
  ["greenhouse:nex:5457814008", "Nex", "Maybe", "Asks for teaching experience and a certification, no years"],
  ["ashby:pocket:d4f2f5e9-d96b-489d-a641-227169d5b321", "Pocket", "Maybe", "Founding AE, '1+ years selling B2B'. Your call"],
  ["greenhouse:oklo:6227574004", "Oklo", "Maybe", "Asks for design experience on process equipment, no years"],
  ["ashby:vectorsolutions:c2386911-c422-4500-b60b-d4fb82ca5e6a", "Vector Solutions", "No", "'2–4 years of experience in commission operations'"],
  ["ashby:engram:7862c3bb-3447-4e48-bdb1-2d3e97964c14", "Engram", "Maybe", "No years or level stated"],
  ["ashby:sketchpro:303d4546-efcb-4d88-b43d-a6dd3205049a", "SketchPro.ai", "Maybe", "'Previous startup experience preferred', nothing required"],
  ["lever:velo3d:5cf23f51-bd8f-49a5-9548-74ab69d09381", "Velo3D", "No", "Account manager; industry experience in design and manufacturing needed"],
  ["ashby:primeintellect:297d925e-5a42-40bd-b02f-5c928d226f18", "Prime Intellect", "No", "'3+ years hands-on experience with GPU clusters'"],
  ["greenhouse:andesite:5226868007", "Andesite", "No", "'10+ years of quota-carrying sales experience'"],
  ["greenhouse:bitmovin:8729522002", "Bitmovin", "No", "'Must-Have Experience' in technical account management"],
  ["greenhouse:nabis:5921161004", "Nabis", "No", "Senior; '4+ years of experience', '4+ years managing a team'"],
];

interface Row { n: number; source: "hn" | "ats"; id: string; company: string; title: string | null; url: string; text: string; prelabel: string; reason: string; label: null }

async function atsRow(sourceId: string, company: string, prelabel: string, reason: string): Promise<Omit<Row, "n">> {
  const [ats, slug, ...rest] = sourceId.split(":");
  const jobId = rest.join(":");
  const res = await fetch(boardUrl(ats as Ats, slug), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${sourceId}: the board answered HTTP ${res.status}`);
  const job = PARSERS[ats as Ats](await res.json()).find((j) => j.id === jobId);
  if (!job) throw new Error(`${sourceId}: the role is no longer on the board`);
  return { source: "ats", id: sourceId, company, title: job.title, url: job.url, text: job.text, prelabel, reason, label: null };
}

const first40 = JSON.parse(readFileSync(new URL("postings-hn40.json", DIR), "utf8")) as
  { hn_id: number; text: string; prelabel: string; reason: string }[];
const hn = KEEP_HN.map((start) => {
  const r = first40.find((p) => p.text.startsWith(start));
  if (!r) throw new Error(`HN posting starting "${start}" is not in postings-hn40.json`);
  return { source: "hn" as const, id: String(r.hn_id), company: r.text.split("|")[0].trim().slice(0, 60), title: null,
    url: `https://news.ycombinator.com/item?id=${r.hn_id}`, text: r.text, prelabel: r.prelabel, reason: r.reason, label: null };
});
const ats = await Promise.all(ATS.map((a) => atsRow(...a)));
const rows: Row[] = [...hn, ...ats].map((r, i) => ({ n: i + 1, ...r }));
writeFileSync(new URL("postings.json", DIR), JSON.stringify(rows, null, 1) + "\n");

const cell = (s: string) => s.replace(/\|/g, "/").replace(/\s+/g, " ");
const count = (k: string) => rows.filter((r) => r.prelabel === k).length;
const md = [
  "# New-grad eval set: 40 postings", "",
  "20 Hacker News \"Who is hiring\" comments (October and November 2026) and 20 roles from company job boards (Ashby, Greenhouse, Lever), sampled from the database on 2026-11-10. Built by `build-set.ts`.", "",
  "Rule: **Yes** = it says it hires new grads, juniors, interns or people with 0 to 2 years. **No** = it requires experience or carries a senior, lead or staff title. **Maybe** = neither, or mixed.", "",
  "How to review: read `Pre-label` and `Reason`; where you disagree, write your answer in `Your label`. Leave it blank to accept. The pre-labels are Claude's, made from the title and the requirement lines, not the whole text. They are not the ground truth until you have gone through them.", "",
  "| # | From | Company | Role | Pre-label | Reason | Your label | Posting |", "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.n} | ${r.source === "hn" ? "HN" : "Job board"} | ${cell(r.company)} | ${cell(r.title ?? r.text.slice(0, 60) + "…")} | ${r.prelabel} | ${cell(r.reason)} |  | [open](${r.url}) |`),
  "", `Pre-labels: Yes ${count("Yes")} · Maybe ${count("Maybe")} · No ${count("No")}`, "",
  "Full text of every posting is in `postings.json` (`text`). `label` there stays empty until this sheet is reviewed.", "",
];
writeFileSync(new URL("review.md", DIR), md.join("\n"));
console.log(`wrote ${rows.length} postings: HN ${hn.length}, job boards ${ats.length}`);
