#!/usr/bin/env node
/** PreToolUse hook for Foothold: the two rules that must never be missed (docs/ownership.md, AGENTS.md).
 *  1. Agents never touch env files, by any tool or shell command. The keys in them are the user's to place.
 *  2. Staging names files one by one: no `git add -A`, `git add .`, a whole directory, or `git commit -a`.
 *     Another agent's uncommitted work may be sitting in the tree.
 *  Claude Code runs this before every file tool and Bash call; exit 2 refuses the call and hands the reason back.
 *  A shell command is judged by its text, so this is a net, not a proof. */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ENV_REASON =
  "Blocked by the Foothold hook: agents do not read, copy or write env files (AGENTS.md, Never). Tell the user what is needed and let them place it.";
const ADD_REASON =
  "Blocked by the Foothold hook: stage files by name, one by one (docs/ownership.md). No `git add -A`, `git add .`, a directory, or `git commit -a`. Run `git status --short` first and add only your own files.";

const FILE_TOOLS = { Read: "file_path", Edit: "file_path", Write: "file_path", MultiEdit: "file_path", NotebookEdit: "notebook_path" };

/** ".env", ".env.local", "dir/.env.production" as a path token. Not "process.env" or "environment". */
const ENV_TOKEN = /(^|[\s"'`=(;|&<>/])\.env(\.[A-Za-z0-9_-]+)?($|[\s"'`);|&<>])/m;

export const isEnvPath = (filePath) =>
  typeof filePath === "string" && /^\.env(\.[A-Za-z0-9_-]+)?$/.test(path.basename(filePath));

/** The arguments of each `git add` in a command line, split on shell separators. */
function gitAddArgs(command) {
  const out = [];
  for (const part of command.split(/&&|\|\||[;|\n]/)) {
    const m = part.match(/\bgit\s+(?:-C\s+\S+\s+)?add(?:\s+(.*))?$/);
    if (m) out.push((m[1] ?? "").trim().split(/\s+/).filter(Boolean).map((a) => a.replace(/^["']|["']$/g, "")));
  }
  return out;
}

function isDirectory(p, root) {
  try {
    return fs.statSync(path.resolve(root, p)).isDirectory();
  } catch {
    return false; // a path that does not exist is not a directory we can stage
  }
}

export function stagesTooMuch(command, root, isDir = isDirectory) {
  if (/\bgit\s+(?:-C\s+\S+\s+)?commit\s+(?:\S+\s+)*-[a-zA-Z]*a[a-zA-Z]*(\s|$)/.test(command)) return true;
  for (const args of gitAddArgs(command)) {
    if (args.length === 0) return true;
    for (const a of args) {
      if (["-A", "--all", "-u", "--update", ".", "*", ":/"].includes(a)) return true;
      if (!a.startsWith("-") && (a.endsWith("/") || isDir(a, root))) return true;
    }
  }
  return false;
}

/** @returns {{allow: boolean, reason: string}} */
export function decide(toolName, toolInput, root, isDir = isDirectory) {
  const input = toolInput ?? {};
  const field = FILE_TOOLS[toolName];
  if (field) return isEnvPath(input[field]) ? { allow: false, reason: ENV_REASON } : { allow: true, reason: "" };
  if (toolName === "Bash") {
    const command = typeof input.command === "string" ? input.command : "";
    if (ENV_TOKEN.test(command)) return { allow: false, reason: ENV_REASON };
    if (stagesTooMuch(command, root, isDir)) return { allow: false, reason: ADD_REASON };
  }
  return { allow: true, reason: "" };
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  let event;
  try {
    event = JSON.parse(raw);
  } catch (error) {
    console.error("guard hook: could not parse the event, allowing the call", error);
    return;
  }
  const root = process.env.CLAUDE_PROJECT_DIR || event.cwd || process.cwd();
  const verdict = decide(event.tool_name, event.tool_input, root);
  if (!verdict.allow) {
    console.error(verdict.reason);
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
