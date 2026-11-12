// The skill vocabulary and the tagger live with the jobs worker, which tags every posting with them. A resume is
// tagged by the same code, imported here rather than copied, so the two sides can never drift apart. Both files are
// plain TypeScript with no Deno or Node imports. This is the only file in src/ that reaches into supabase/.
export { SKILLS, SKILLS_VERSION, type SkillRow } from "../../../supabase/functions/fh-jobs/lib/skills";
export { MAX_TAGS, tagsOf } from "../../../supabase/functions/fh-jobs/lib/tags";
