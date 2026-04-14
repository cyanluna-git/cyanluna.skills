#!/usr/bin/env node
/**
 * Local integration tests for Projects API (task #810)
 * Invokes the handler directly via mock req/res — no HTTP server needed.
 * Requires DATABASE_URL in .env (or environment).
 *
 * Shield · TDD tests for kanban task #810
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env ────────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../.env");
try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
  }
} catch { /* .env not found — rely on process.env */ }

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Provide .env or set the env var.");
  process.exit(1);
}

// Allow localhost bypass (no auth token needed for local test)
process.env.KANBAN_ALLOW_INSECURE_LOCAL_DEV = "1";

// Import handler (ES module)
const { default: handler } = await import("../lib/vercel-api-handler.js");

// ── Mock req/res ─────────────────────────────────────────────────────────────

function makeReq(method, url, body) {
  const bodyStr = body ? JSON.stringify(body) : "";
  const listeners = {};
  const req = {
    method,
    url,
    headers: {
      host: "localhost:3000",
      "content-type": "application/json",
      "content-length": String(Buffer.byteLength(bodyStr)),
    },
    on(event, cb) { listeners[event] = cb; return req; },
    emit(event, data) { if (listeners[event]) listeners[event](data); },
    _bodyStr: bodyStr,
  };
  // Simulate async body stream
  setTimeout(() => {
    if (listeners.data && bodyStr) req.emit("data", Buffer.from(bodyStr));
    if (listeners.end) req.emit("end");
  }, 0);
  return req;
}

function makeRes() {
  const res = {
    statusCode: 200,
    _headers: {},
    _body: "",
    setHeader(k, v) { res._headers[k] = v; },
    end(data) { res._body = data; res._resolved = true; },
    _json() { return JSON.parse(res._body); },
  };
  return res;
}

async function call(method, url, body) {
  const req = makeReq(method, url, body);
  const res = makeRes();
  await handler(req, res);
  let data;
  try { data = JSON.parse(res._body); } catch { data = { _raw: res._body }; }
  return { status: res.statusCode, ok: res.statusCode < 400, data };
}

// ── Test framework ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    failed++;
    console.log(`  ✗ FAIL: ${message}`);
    return false;
  }
  passed++;
  console.log(`  ✓ PASS: ${message}`);
  return true;
}

function assertEqual(actual, expected, label) {
  return assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertHas(obj, key, label) {
  return assert(Object.prototype.hasOwnProperty.call(obj, key), `${label}: expected key "${key}" in response`);
}

function assertArray(value, label) {
  return assert(Array.isArray(value), `${label}: expected array, got ${typeof value}`);
}

// ── Test IDs ─────────────────────────────────────────────────────────────────

const TEST_ID_A = "__shield_test__proj_a";
const TEST_ID_B = "__shield_test__proj_b";

async function cleanup() {
  await call("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, null);
  await call("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_B)}`, null);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testListProjects() {
  console.log("\n[1] GET /api/projects — list all");
  const { status, data } = await call("GET", "/api/projects", null);
  assertEqual(status, 200, "status code");
  assertHas(data, "projects", "response has projects key");
  assertArray(data.projects, "projects is array");
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    const sample = data.projects[0];
    assertHas(sample, "id", "project has id");
    assertHas(sample, "name", "project has name");
    assertHas(sample, "links", "project has links");
    assertArray(sample.links, "links is array");
  }
}

async function testCreateProject() {
  console.log("\n[2] POST /api/projects — create project A");
  const { status, data } = await call("POST", "/api/projects", {
    id: TEST_ID_A,
    name: "Shield Test Project A",
    purpose: "Integration test target",
    stack: "Node.js, PostgreSQL",
    status: "active",
    category: "test",
    repo_url: "https://github.com/test/proj-a",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
  assertHas(data, "project", "project in response");
  if (data.project) {
    assertEqual(data.project.id, TEST_ID_A, "project id matches");
    assertEqual(data.project.name, "Shield Test Project A", "name matches");
    assertEqual(data.project.status, "active", "status matches");
    assertEqual(data.project.category, "test", "category matches");
    assertEqual(data.project.repo_url, "https://github.com/test/proj-a", "repo_url matches");
  }
}

async function testCreateProjectB() {
  console.log("\n[3] POST /api/projects — create project B (minimal fields)");
  const { status, data } = await call("POST", "/api/projects", {
    id: TEST_ID_B,
    name: "Shield Test Project B",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
  if (data.project) {
    assertEqual(data.project.id, TEST_ID_B, "id matches");
    // status defaults to 'active' when not provided
    assertEqual(data.project.status, "active", "default status is 'active'");
    assert(data.project.purpose === null || data.project.purpose === undefined, "purpose is null when omitted");
    assert(data.project.stack === null || data.project.stack === undefined, "stack is null when omitted");
  }
}

async function testUpsertIdempotency() {
  console.log("\n[4] POST /api/projects — upsert (same id updates name and purpose)");
  const { status, data } = await call("POST", "/api/projects", {
    id: TEST_ID_A,
    name: "Shield Test Project A (updated)",
    purpose: "Updated purpose",
    // repo_url intentionally omitted — COALESCE should preserve existing value
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
  if (data.project) {
    assertEqual(data.project.id, TEST_ID_A, "id unchanged");
    assertEqual(data.project.name, "Shield Test Project A (updated)", "name updated");
    assertEqual(data.project.purpose, "Updated purpose", "purpose updated");
    // COALESCE(EXCLUDED.repo_url, projects.repo_url) — since EXCLUDED.repo_url is null, keeps existing
    assertEqual(data.project.repo_url, "https://github.com/test/proj-a", "repo_url preserved by COALESCE");
  }
}

async function testCreateProjectMissingId() {
  console.log("\n[5] POST /api/projects — missing id → 400");
  const { status, data } = await call("POST", "/api/projects", { name: "No ID" });
  assertEqual(status, 400, "status 400");
  assertHas(data, "error", "error message present");
  assert(typeof data.error === "string" && data.error.length > 0, "error message non-empty");
}

async function testCreateProjectMissingName() {
  console.log("\n[6] POST /api/projects — missing name → 400");
  const { status, data } = await call("POST", "/api/projects", { id: "no-name-id" });
  assertEqual(status, 400, "status 400");
  assertHas(data, "error", "error message present");
}

async function testGetProjectById() {
  console.log("\n[7] GET /api/projects/:id — existing project");
  const { status, data } = await call("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, null);
  assertEqual(status, 200, "status code");
  assertEqual(data.id, TEST_ID_A, "correct project returned");
  assertHas(data, "task_counts", "task_counts present");
  assertHas(data, "links", "links present");
  assertArray(data.links, "links is array");
  assert(typeof data.task_counts === "object" && data.task_counts !== null, "task_counts is object");
}

async function testGetProjectByIdNotFound() {
  console.log("\n[8] GET /api/projects/:id — non-existent id → 404");
  const { status, data } = await call("GET", "/api/projects/__nonexistent_xyz_12345__", null);
  assertEqual(status, 404, "status 404");
  assertHas(data, "error", "error message present");
}

async function testPatchProject() {
  console.log("\n[9] PATCH /api/projects/:id — update fields");
  const { status, data } = await call("PATCH", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, {
    stack: "Node.js, PostgreSQL",
    status: "inactive",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");

  // Verify persistence
  const { data: proj } = await call("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, null);
  assertEqual(proj.stack, "Node.js, PostgreSQL", "stack updated");
  assertEqual(proj.status, "inactive", "status updated");
}

async function testPatchProjectNoFields() {
  console.log("\n[10] PATCH /api/projects/:id — empty body → 400");
  const { status, data } = await call("PATCH", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, {});
  assertEqual(status, 400, "status 400");
  assertHas(data, "error", "error message present");
}

async function testCreateLink() {
  console.log("\n[11] POST /api/projects/:id/links — create A→B extends");
  const { status, data } = await call(
    "POST",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { target_id: TEST_ID_B, relation: "extends" }
  );
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
}

async function testCreateLinkDuplicate() {
  console.log("\n[12] POST /api/projects/:id/links — duplicate link → still 200 (ON CONFLICT DO NOTHING)");
  const { status, data } = await call(
    "POST",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { target_id: TEST_ID_B, relation: "extends" }
  );
  assertEqual(status, 200, "status 200 for duplicate");
  assert(data.success, "success flag on duplicate");
}

async function testCreateLinkMissingTargetId() {
  console.log("\n[13] POST /api/projects/:id/links — missing target_id → 400");
  const { status, data } = await call(
    "POST",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { relation: "serves" }
  );
  assertEqual(status, 400, "status 400");
  assertHas(data, "error", "error message present");
}

async function testCreateLinkMissingRelation() {
  console.log("\n[14] POST /api/projects/:id/links — missing relation → 400");
  const { status, data } = await call(
    "POST",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { target_id: TEST_ID_B }
  );
  assertEqual(status, 400, "status 400");
  assertHas(data, "error", "error message present");
}

async function testGetLinks() {
  console.log("\n[15] GET /api/projects/:id/links — list links for source");
  const { status, data } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    null
  );
  assertEqual(status, 200, "status code");
  assertHas(data, "links", "links key present");
  assertArray(data.links, "links is array");
  assert(data.links.length >= 1, "at least 1 link");
  const link = data.links.find(
    l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B && l.relation === "extends"
  );
  assert(link !== undefined, "extends link found");
}

async function testGetLinksFromTargetSide() {
  console.log("\n[16] GET /api/projects/:id/links — link appears on target side too");
  const { status, data } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_B)}/links`,
    null
  );
  assertEqual(status, 200, "status code");
  assert(Array.isArray(data.links) && data.links.length >= 1, "link shows on target side");
  const link = data.links.find(
    l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B
  );
  assert(link !== undefined, "correct link found from target side");
}

async function testGetProjectIncludesLinks() {
  console.log("\n[17] GET /api/projects/:id — links embedded in detail response");
  const { data } = await call("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, null);
  assertArray(data.links, "links array in detail response");
  const link = data.links.find(
    l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B
  );
  assert(link !== undefined, "link embedded in project detail");
}

async function testListProjectsIncludesLinks() {
  console.log("\n[18] GET /api/projects — links in list response");
  const { data } = await call("GET", "/api/projects", null);
  if (Array.isArray(data.projects)) {
    const projA = data.projects.find(p => p.id === TEST_ID_A);
    if (projA) {
      assertArray(projA.links, "links in list response");
      assert(projA.links.length >= 1, "link count >= 1 in list");
    } else {
      assert(false, "test project A not found in list");
    }
  }
}

async function testDeleteLink() {
  console.log("\n[19] DELETE /api/projects/:id/links — delete A→B extends");
  const { status, data } = await call(
    "DELETE",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { target_id: TEST_ID_B, relation: "extends" }
  );
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");

  // Verify link is gone
  const { data: linkData } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    null
  );
  const remaining = (linkData.links || []).find(
    l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B && l.relation === "extends"
  );
  assert(remaining === undefined, "link removed after delete");
}

async function testDeleteLinkMissingFields() {
  console.log("\n[20] DELETE /api/projects/:id/links — missing relation → 400");
  const { status, data } = await call(
    "DELETE",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    { target_id: TEST_ID_B }
  );
  assertEqual(status, 400, "status 400 for missing relation");
  assertHas(data, "error", "error message present");
}

async function testCascadeDelete() {
  console.log("\n[21] DELETE /api/projects/:id — CASCADE removes links");
  // Add a new link for cascade test
  await call("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    relation: "shares_data",
  });

  const { data: before } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`,
    null
  );
  const linkBefore = (before.links || []).find(l => l.relation === "shares_data");
  assert(linkBefore !== undefined, "link exists before cascade delete");

  // Delete project A
  const { status: delStatus, data: delData } = await call(
    "DELETE",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}`,
    null
  );
  assertEqual(delStatus, 200, "delete returns 200");
  assert(delData.success, "success flag on delete");

  // Project A should now 404
  const { status: getStatus } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_A)}`,
    null
  );
  assertEqual(getStatus, 404, "deleted project returns 404");

  // Links on B side should be gone (CASCADE)
  const { data: after } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_B)}/links`,
    null
  );
  const orphan = (after.links || []).find(
    l => l.source_id === TEST_ID_A || l.target_id === TEST_ID_A
  );
  assert(orphan === undefined, "links CASCADE deleted when project deleted");
}

async function testDeleteProjectB() {
  console.log("\n[22] DELETE /api/projects/:id — cleanup project B");
  const { status, data } = await call(
    "DELETE",
    `/api/projects/${encodeURIComponent(TEST_ID_B)}`,
    null
  );
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");

  // Confirm gone
  const { status: getStatus } = await call(
    "GET",
    `/api/projects/${encodeURIComponent(TEST_ID_B)}`,
    null
  );
  assertEqual(getStatus, 404, "project B gone after delete");
}

// ── Seed script pure logic tests (no network) ────────────────────────────────

async function testSeedScriptCategorize() {
  console.log("\n[23] Seed script: categorize() logic");

  function categorize(mod) {
    if (mod.path.startsWith("edwards/")) return "edwards";
    if (mod.name.includes("skills") || mod.name.includes("kanban")) return "skills";
    if (mod.name.includes("tools") || mod.name.includes("assist") || mod.name.includes("gmail") || mod.name.includes("jira")) return "tools";
    if (mod.name === "community.skills") return "community";
    return "personal";
  }

  const cases = [
    [{ path: "edwards/oqc.infra", name: "edwards.oqc.infra" }, "edwards", "edwards/ prefix"],
    [{ path: "cyanluna.skills", name: "cyanluna.skills" }, "skills", "'skills' in name"],
    [{ path: "kanban-board", name: "kanban-board" }, "skills", "'kanban' in name"],
    [{ path: "assist-hub", name: "assist-hub" }, "tools", "'assist' in name"],
    [{ path: "tools/gmail", name: "gmail.tools" }, "tools", "'gmail' in name"],
    [{ path: "tools/jira", name: "jira.javis" }, "tools", "'jira' in name"],
    [{ path: "community.skills", name: "community.skills" }, "community", "exact community.skills"],
    [{ path: "my-project", name: "my-project" }, "personal", "fallback personal"],
  ];

  for (const [mod, expected, label] of cases) {
    assertEqual(categorize(mod), expected, `categorize: ${label}`);
  }
}

async function testSeedScriptExtractPurpose() {
  console.log("\n[24] Seed script: extractPurpose() logic");

  function extractPurpose(claudeMd, readmeMd) {
    if (claudeMd) {
      const lines = claudeMd.split("\n").filter(l => l.trim());
      for (const line of lines.slice(0, 20)) {
        if (line.match(/^#+\s/) || line.startsWith("---") || line.startsWith("```")) continue;
        if (line.length > 15 && line.length < 500) return line.trim().slice(0, 300);
      }
    }
    if (readmeMd) {
      const lines = readmeMd.split("\n").filter(l => l.trim());
      for (const line of lines.slice(0, 15)) {
        if (line.match(/^#+\s/) || line.startsWith("---") || line.startsWith("```") || line.startsWith("![")) continue;
        if (line.length > 15 && line.length < 500) return line.trim().slice(0, 300);
      }
    }
    return null;
  }

  assertEqual(extractPurpose("# Heading\nThis is the purpose.", null), "This is the purpose.", "skips h1, picks next");
  assertEqual(extractPurpose("---\nThis is the purpose.", null), "This is the purpose.", "skips --- separator");
  assertEqual(extractPurpose("```yaml\n```\nThis is the purpose.", null), "This is the purpose.", "skips code fence");
  assertEqual(extractPurpose("Short", "A proper description that exceeds 15 characters"), "A proper description that exceeds 15 characters", "falls to README for short CLAUDE.md");
  assertEqual(extractPurpose(null, "README description here"), "README description here", "uses README when no CLAUDE.md");
  assertEqual(extractPurpose(null, null), null, "returns null for both null");
  assertEqual(extractPurpose(null, "![badge](url)\nReal description here"), "Real description here", "README skips image lines");
  assertEqual(extractPurpose("x".repeat(501), "Fallback description line"), "Fallback description line", "skips oversized lines");

  // Truncation at 300 chars
  const longLine = "A".repeat(400);
  const result = extractPurpose(longLine, null);
  assert(result !== null && result.length === 300, "truncates to 300 chars");
}

async function testSeedScriptExtractStack() {
  console.log("\n[25] Seed script: extractStack() logic");

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

  const s1 = extractStack("Stack: TypeScript, React, Vite");
  assert(s1 !== null && s1.includes("TypeScript"), "extracts from 'Stack:' pattern");

  const s2 = extractStack("Tech: Python, Django");
  assert(s2 !== null, "extracts from 'Tech:' pattern");

  const s3 = extractStack("This project uses TypeScript and React.");
  assertEqual(s3, "TypeScript", "falls back to keyword match");

  assertEqual(extractStack("No technology info here at all."), null, "returns null when no match");
  assertEqual(extractStack(null), null, "returns null for null input");
}

async function testSeedScriptGitmodulesParser() {
  console.log("\n[26] Seed script: .gitmodules parser");

  function parseGitmodules(raw) {
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
    return modules;
  }

  const sample = `[submodule "cyanluna.skills"]
\tpath = cyanluna.skills
\turl = https://github.com/cyan/cyanluna.skills.git

[submodule "edwards/oqc.infra"]
\tpath = edwards/oqc.infra
\turl = git@github.com:cyan/edwards.git`;

  const result = parseGitmodules(sample);
  assertEqual(result.length, 2, "parses 2 submodules");
  assertEqual(result[0].name, "cyanluna.skills", "first name");
  assertEqual(result[0].path, "cyanluna.skills", "first path");
  assertEqual(result[0].url, "https://github.com/cyan/cyanluna.skills.git", "first url");
  assertEqual(result[1].name, "edwards/oqc.infra", "second name (slash allowed)");
  assertEqual(result[1].path, "edwards/oqc.infra", "second path");

  const empty = parseGitmodules("");
  assertEqual(empty.length, 0, "empty string → empty array");

  const partial = parseGitmodules('[submodule "partial"]\n');
  assertEqual(partial.length, 1, "partial entry parsed");
  assertEqual(partial[0].name, "partial", "partial name");
  assertEqual(partial[0].path, "", "partial path empty");
  assertEqual(partial[0].url, "", "partial url empty");
}

// ── Run all ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nShield Local Integration Tests (task #810)");
  console.log(`DB: ${process.env.DATABASE_URL?.slice(0, 50)}...`);
  console.log("─".repeat(60));

  // Cleanup stale test data first
  await cleanup();

  // Network tests (real PostgreSQL DB via handler)
  await testListProjects();
  await testCreateProject();
  await testCreateProjectB();
  await testUpsertIdempotency();
  await testCreateProjectMissingId();
  await testCreateProjectMissingName();
  await testGetProjectById();
  await testGetProjectByIdNotFound();
  await testPatchProject();
  await testPatchProjectNoFields();
  await testCreateLink();
  await testCreateLinkDuplicate();
  await testCreateLinkMissingTargetId();
  await testCreateLinkMissingRelation();
  await testGetLinks();
  await testGetLinksFromTargetSide();
  await testGetProjectIncludesLinks();
  await testListProjectsIncludesLinks();
  await testDeleteLink();
  await testDeleteLinkMissingFields();
  await testCascadeDelete();
  await testDeleteProjectB();

  // Pure logic tests
  await testSeedScriptCategorize();
  await testSeedScriptExtractPurpose();
  await testSeedScriptExtractStack();
  await testSeedScriptGitmodulesParser();

  // Summary
  const total = passed + failed;
  console.log("\n" + "─".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed (${total} total)`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(2);
});
