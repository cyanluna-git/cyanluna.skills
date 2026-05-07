#!/usr/bin/env node
/**
 * Seed projects table from ~/dev/.gitmodules
 *
 * Usage:
 *   node scripts/seed-projects.mjs --base-url <URL> --auth-token <TOKEN> --dev-root ~/dev
 *
 * Defaults:
 *   --base-url   https://cyanlunakanban.vercel.app
 *   --dev-root   ~/dev
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename, dirname } from "path";
import { homedir } from "os";

// ── Parse CLI args ──────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const BASE_URL = getArg("base-url", "https://cyanlunakanban.vercel.app").replace(/\/$/, "");
const AUTH_TOKEN = getArg("auth-token", "");
const DEV_ROOT = getArg("dev-root", resolve(homedir(), "dev"));

const headers = { "Content-Type": "application/json" };
if (AUTH_TOKEN) headers["X-Kanban-Auth"] = AUTH_TOKEN;

// ── Parse .gitmodules ───────────────────────────────────────────────────────

const gitmodulesPath = resolve(DEV_ROOT, ".gitmodules");
if (!existsSync(gitmodulesPath)) {
  console.error(`ERROR: .gitmodules not found at ${gitmodulesPath}`);
  process.exit(1);
}

const raw = readFileSync(gitmodulesPath, "utf8");
const modules = [];
let current = null;

for (const line of raw.split("\n")) {
  const subMatch = line.match(/^\[submodule\s+"([^"]+)"\]/);
  if (subMatch) {
    current = { name: subMatch[1], path: "", url: "" };
    modules.push(current);
    continue;
  }
  if (!current) continue;
  const pathMatch = line.match(/^\s+path\s*=\s*(.+)$/);
  if (pathMatch) current.path = pathMatch[1].trim();
  const urlMatch = line.match(/^\s+url\s*=\s*(.+)$/);
  if (urlMatch) current.url = urlMatch[1].trim();
}

console.log(`Found ${modules.length} submodules in .gitmodules`);

// ── Categorize projects ─────────────────────────────────────────────────────

function categorize(mod) {
  if (mod.path.startsWith("edwards/")) return "edwards";
  if (mod.name.includes("skills") || mod.name.includes("kanban")) return "skills";
  if (mod.name.includes("tools") || mod.name.includes("assist") || mod.name.includes("gmail") || mod.name.includes("jira")) return "tools";
  if (mod.name === "community.skills") return "community";
  // personal projects
  return "personal";
}

function readFileSafe(filePath) {
  try { return readFileSync(filePath, "utf8"); } catch { return null; }
}

function extractPurpose(claudeMd, readmeMd) {
  // Try CLAUDE.md first — look for description or first paragraph
  if (claudeMd) {
    const lines = claudeMd.split("\n").filter(l => l.trim());
    // Look for a line starting with description-like patterns
    for (const line of lines.slice(0, 20)) {
      if (line.match(/^#+\s/) || line.startsWith("---") || line.startsWith("```")) continue;
      if (line.length > 15 && line.length < 500) return line.trim().slice(0, 300);
    }
  }
  // Fall back to README
  if (readmeMd) {
    const lines = readmeMd.split("\n").filter(l => l.trim());
    for (const line of lines.slice(0, 15)) {
      if (line.match(/^#+\s/) || line.startsWith("---") || line.startsWith("```") || line.startsWith("![")) continue;
      if (line.length > 15 && line.length < 500) return line.trim().slice(0, 300);
    }
  }
  return null;
}

function extractStack(claudeMd) {
  if (!claudeMd) return null;
  const stackPatterns = [
    /(?:stack|tech|framework|built\s+with)[:\s]*([^\n]+)/i,
    /(?:typescript|javascript|python|react|vue|next|node|vite|express|django|flask)/i,
  ];
  for (const pat of stackPatterns) {
    const m = claudeMd.match(pat);
    if (m) return m[1] ? m[1].trim().slice(0, 200) : m[0].trim();
  }
  return null;
}

// ── Build project payloads ──────────────────────────────────────────────────

const projects = modules.map((mod) => {
  const projectDir = resolve(DEV_ROOT, mod.path);
  // Prefer .claude/CLAUDE.md (common convention), fall back to root CLAUDE.md
  const claudeMd =
    readFileSafe(resolve(projectDir, ".claude", "CLAUDE.md")) ||
    readFileSafe(resolve(projectDir, "CLAUDE.md"));
  const readmeMd = readFileSafe(resolve(projectDir, "README.md"));

  return {
    id: mod.path.includes("/") ? basename(mod.path) : mod.name,
    name: mod.name,
    purpose: extractPurpose(claudeMd, readmeMd),
    stack: extractStack(claudeMd),
    status: "active",
    category: categorize(mod),
    repo_url: mod.url,
  };
});

// ── Relationships ───────────────────────────────────────────────────────────

const relationships = [
  { source: "cyanluna.skills", target: "cyanluna.tools", relation: "extends" },
  { source: "community.skills", target: "cyanluna.skills", relation: "extends" },
  { source: "cyanluna.skills", target: "cyanluna.obsidian.vault", relation: "shares_data" },
  { source: "assist-hub", target: "assist.11th", relation: "serves" },
  { source: "jira.javis", target: "act.automation", relation: "serves" },
  { source: "edwards.oqc.infra", target: "unify", relation: "serves" },
];

// ── API calls ───────────────────────────────────────────────────────────────

async function apiCall(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(url, opts);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!resp.ok) {
    console.error(`  ERROR ${resp.status}: ${method} ${path} → ${text.slice(0, 200)}`);
  }
  return { ok: resp.ok, status: resp.status, data };
}

async function main() {
  console.log(`\nSeeding ${projects.length} projects to ${BASE_URL}...\n`);

  // Upsert projects
  for (const proj of projects) {
    const { ok, data } = await apiCall("POST", "/api/projects", proj);
    const status = ok ? "OK" : "FAIL";
    console.log(`  [${status}] ${proj.category}/${proj.id} — ${proj.name}`);
  }

  // Create links (only for projects that exist)
  const projectIds = new Set(projects.map((p) => p.id));
  console.log(`\nCreating ${relationships.length} relationships...\n`);
  for (const rel of relationships) {
    if (!projectIds.has(rel.source) || !projectIds.has(rel.target)) {
      console.log(`  [SKIP] ${rel.source} → ${rel.target} (${rel.relation}) — project not found`);
      continue;
    }
    const { ok } = await apiCall("POST", `/api/projects/${encodeURIComponent(rel.source)}/links`, {
      target_id: rel.target,
      relation: rel.relation,
    });
    const status = ok ? "OK" : "FAIL";
    console.log(`  [${status}] ${rel.source} → ${rel.target} (${rel.relation})`);
  }

  // Verify
  const { ok, data } = await apiCall("GET", "/api/projects");
  if (ok) {
    const byCategory = {};
    for (const p of data.projects || []) {
      const cat = p.category || "uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    console.log(`\nVerification: ${(data.projects || []).length} projects total`);
    for (const [cat, count] of Object.entries(byCategory).sort()) {
      console.log(`  ${cat}: ${count}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
