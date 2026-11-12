// The skill vocabulary and the tagger live in the shared package, which the jobs worker also uses to tag every
// posting. A resume is tagged by the same code, so the two sides can never drift apart.
export { SKILLS, SKILLS_VERSION, type SkillRow } from "@foothold/core/skills";
export { MAX_TAGS, tagsOf } from "@foothold/core/tags";
