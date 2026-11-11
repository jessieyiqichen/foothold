import { describe, expect, it } from "vitest";
// @ts-expect-error the hook is plain JavaScript run by Claude Code, with no type file
import { decide, isEnvPath, stagesTooMuch } from "../../../.claude/hooks/guard.mjs";

const ROOT = "/repo";
const dirs = new Set(["docs", "supabase/functions/fh-jobs", "src"]);
const isDir = (p: string) => dirs.has(p.replace(/\/$/, ""));
const bash = (command: string) => decide("Bash", { command }, ROOT, isDir).allow;

describe("env files", () => {
  it("refuses file tools on any env file", () => {
    for (const p of [".env", ".env.local", "/repo/.env.production", "apps/web/.env.test"]) {
      expect(isEnvPath(p)).toBe(true);
      expect(decide("Read", { file_path: p }, ROOT, isDir).allow).toBe(false);
      expect(decide("Write", { file_path: p }, ROOT, isDir).allow).toBe(false);
    }
  });
  it("refuses shell commands that name an env file, however they touch it", () => {
    // 2026-11-10: `cp ../dbs-a5/.env.local .env.local` got past the Read/Edit deny rules
    expect(bash("cp ~/projects/dbs-a5/.env.local .env.local")).toBe(false);
    expect(bash("cat .env")).toBe(false);
    expect(bash("grep -c GEMINI .env.local")).toBe(false);
    expect(bash("source ./.env && npm test")).toBe(false);
  });
  it("lets through things that only look similar", () => {
    expect(isEnvPath("src/lib/env.ts")).toBe(false);
    expect(bash("node -e 'console.log(process.env.HOME)'")).toBe(true);
    expect(bash("npm run dev -- --environment test")).toBe(true);
    expect(decide("Edit", { file_path: "README.md" }, ROOT, isDir).allow).toBe(true);
  });
});

describe("staging", () => {
  it("refuses adding everything, a directory, or committing all tracked changes", () => {
    for (const c of ["git add -A", "git add --all", "git add .", "git add -u", "git add docs/", "git add docs",
      "git status && git add supabase/functions/fh-jobs", "git add", "git commit -am 'x'", "git commit -a -m x",
      "git -C /repo add ."]) {
      expect(stagesTooMuch(c, ROOT, isDir), c).toBe(true);
      expect(bash(c), c).toBe(false);
    }
  });
  it("allows adding files by name and ordinary commits", () => {
    for (const c of ["git add README.md docs/v1-plan.md", "git add supabase/functions/fh-jobs/index.ts && git commit -m 'feat: x'",
      "git commit -m 'docs: add a thing'", "git commit --amend -m x", "git status --short", "echo add -A"]) {
      expect(bash(c), c).toBe(true);
    }
  });
});
