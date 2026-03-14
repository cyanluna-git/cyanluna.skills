#!/usr/bin/env node
/**
 * Integration tests for Projects API endpoints
 *
 * Tests all 8 endpoints:
 *   GET    /api/projects
 *   POST   /api/projects
 *   GET    /api/projects/:id
 *   PATCH  /api/projects/:id
 *   DELETE /api/projects/:id
 *   GET    /api/projects/:id/links
 *   POST   /api/projects/:id/links
 *   DELETE /api/projects/:id/links
 *
 * Usage:
 *   node scripts/test-projects-api.mjs [--base-url <URL>] [--auth-token <TOKEN>]
 *
 * Shield · TDD tests for task #810
 */

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const BASE_URL = getArg("base-url", "https://cyanlunakanban.vercel.app").replace(/\/$/, "");
const AUTH_TOKEN = getArg("auth-token", "2+pg9CUzHgjjKDXxWNpMuRpnVPTTAZ5T042F+nwLz5M=");

const headers = { "Content-Type": "application/json", "X-Kanban-Auth": AUTH_TOKEN };

// ── Test framework ──────────────────────────────────────────────────────────

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

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = { method, headers: { ...headers } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const resp = await fetch(url, opts);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { _raw: text }; }
  return { status: resp.status, ok: resp.ok, data };
}

// ── Test IDs (use a prefix to avoid collisions with real data) ───────────────

const TEST_PREFIX = "__shield_test__";
const TEST_ID_A = `${TEST_PREFIX}proj_a`;
const TEST_ID_B = `${TEST_PREFIX}proj_b`;

async function cleanup() {
  // Delete test projects — CASCADE removes links too
  await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_B)}`);
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function testListProjects() {
  console.log("\n[1] GET /api/projects — list all");
  const { status, data } = await api("GET", "/api/projects");
  assertEqual(status, 200, "status code");
  assertHas(data, "projects", "response shape");
  assertArray(data.projects, "projects field");
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    const sample = data.projects[0];
    assertHas(sample, "id", "project has id");
    assertHas(sample, "name", "project has name");
    assertHas(sample, "links", "project has links array");
    assertArray(sample.links, "links is array");
  }
}

async function testCreateProject() {
  console.log("\n[2] POST /api/projects — create project A");
  const { status, data } = await api("POST", "/api/projects", {
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
    assertEqual(data.project.id, TEST_ID_A, "project id");
    assertEqual(data.project.name, "Shield Test Project A", "project name");
    assertEqual(data.project.status, "active", "default status");
    assertEqual(data.project.category, "test", "category");
  }
}

async function testCreateProjectB() {
  console.log("\n[3] POST /api/projects — create project B (for link tests)");
  const { status, data } = await api("POST", "/api/projects", {
    id: TEST_ID_B,
    name: "Shield Test Project B",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
  if (data.project) {
    // status should default to 'active'
    assertEqual(data.project.status, "active", "default status when omitted");
    // purpose/stack/category should be null when omitted
    assert(data.project.purpose === null || data.project.purpose === undefined, "purpose is null when omitted");
  }
}

async function testUpsertIdempotency() {
  console.log("\n[4] POST /api/projects — upsert idempotency (same id, updated name)");
  // Second POST with same id should update
  const { status, data } = await api("POST", "/api/projects", {
    id: TEST_ID_A,
    name: "Shield Test Project A (updated)",
    purpose: "Updated purpose",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
  if (data.project) {
    assertEqual(data.project.id, TEST_ID_A, "id unchanged");
    assertEqual(data.project.name, "Shield Test Project A (updated)", "name updated");
    assertEqual(data.project.purpose, "Updated purpose", "purpose updated");
    // repo_url was set in first POST; COALESCE means it should be preserved
    // when EXCLUDED.repo_url is not null it wins, but here we don't pass repo_url
    // so COALESCE(NULL, existing) = existing
    assertEqual(data.project.repo_url, "https://github.com/test/proj-a", "repo_url preserved via COALESCE");
  }
}

async function testCreateProjectMissingId() {
  console.log("\n[5] POST /api/projects — missing required field: id");
  const { status, data } = await api("POST", "/api/projects", {
    name: "No ID Project",
  });
  assertEqual(status, 400, "status 400 for missing id");
  assertHas(data, "error", "error message present");
}

async function testCreateProjectMissingName() {
  console.log("\n[6] POST /api/projects — missing required field: name");
  const { status, data } = await api("POST", "/api/projects", {
    id: "no-name-proj",
  });
  assertEqual(status, 400, "status 400 for missing name");
  assertHas(data, "error", "error message present");
}

async function testGetProjectById() {
  console.log("\n[7] GET /api/projects/:id — existing project");
  const { status, data } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  assertEqual(status, 200, "status code");
  assertEqual(data.id, TEST_ID_A, "correct project returned");
  assertHas(data, "task_counts", "task_counts included");
  assertHas(data, "links", "links included");
  assertArray(data.links, "links is array");
}

async function testGetProjectByIdNotFound() {
  console.log("\n[8] GET /api/projects/:id — non-existent project");
  const { status, data } = await api("GET", "/api/projects/__nonexistent_xyz_12345__");
  assertEqual(status, 404, "status 404");
  assertHas(data, "error", "error message present");
}

async function testPatchProject() {
  console.log("\n[9] PATCH /api/projects/:id — update fields");
  const { status, data } = await api("PATCH", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, {
    stack: "Node.js, PostgreSQL, Neon",
    status: "inactive",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");

  // Verify changes were persisted
  const { data: proj } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  assertEqual(proj.stack, "Node.js, PostgreSQL, Neon", "stack updated");
  assertEqual(proj.status, "inactive", "status updated");
}

async function testPatchProjectNoFields() {
  console.log("\n[10] PATCH /api/projects/:id — no fields (should 400)");
  const { status, data } = await api("PATCH", `/api/projects/${encodeURIComponent(TEST_ID_A)}`, {});
  assertEqual(status, 400, "status 400 for empty PATCH");
  assertHas(data, "error", "error message present");
}

async function testCreateLink() {
  console.log("\n[11] POST /api/projects/:id/links — create link A→B");
  const { status, data } = await api("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    relation: "extends",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
}

async function testCreateLinkDuplicate() {
  console.log("\n[12] POST /api/projects/:id/links — duplicate link (ON CONFLICT DO NOTHING → still 200)");
  const { status, data } = await api("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    relation: "extends",
  });
  assertEqual(status, 200, "status 200 for duplicate link (idempotent)");
  assert(data.success, "success flag on duplicate");
}

async function testCreateLinkMissingTargetId() {
  console.log("\n[13] POST /api/projects/:id/links — missing target_id");
  const { status, data } = await api("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    relation: "serves",
  });
  assertEqual(status, 400, "status 400 for missing target_id");
  assertHas(data, "error", "error message present");
}

async function testCreateLinkMissingRelation() {
  console.log("\n[14] POST /api/projects/:id/links — missing relation");
  const { status, data } = await api("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
  });
  assertEqual(status, 400, "status 400 for missing relation");
  assertHas(data, "error", "error message present");
}

async function testGetLinks() {
  console.log("\n[15] GET /api/projects/:id/links — list links");
  const { status, data } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`);
  assertEqual(status, 200, "status code");
  assertHas(data, "links", "links key present");
  assertArray(data.links, "links is array");
  assert(data.links.length >= 1, "at least 1 link (extends link created above)");
  const link = data.links.find(l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B && l.relation === "extends");
  assert(link !== undefined, "correct link found in list");
}

async function testGetLinksAppearsOnBothProjects() {
  console.log("\n[16] GET /api/projects/:id/links — link appears on target side too");
  const { status, data } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_B)}/links`);
  assertEqual(status, 200, "status code");
  assert(Array.isArray(data.links) && data.links.length >= 1, "link appears when queried from target side");
}

async function testGetProjectIncludesLinks() {
  console.log("\n[17] GET /api/projects/:id — links embedded in single-project response");
  const { data } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  assertArray(data.links, "links array present in project detail");
  const link = data.links.find(l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B);
  assert(link !== undefined, "link is embedded in project detail response");
}

async function testListProjectsIncludesLinks() {
  console.log("\n[18] GET /api/projects — links included in list response");
  const { data } = await api("GET", "/api/projects");
  if (Array.isArray(data.projects)) {
    const projA = data.projects.find(p => p.id === TEST_ID_A);
    if (projA) {
      assertArray(projA.links, "links embedded in list response");
      assert(projA.links.length >= 1, "link count >= 1 in list response");
    } else {
      assert(false, "test project A not found in list — cannot verify links in list");
    }
  }
}

async function testDeleteLink() {
  console.log("\n[19] DELETE /api/projects/:id/links — delete link A→B extends");
  const { status, data } = await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    relation: "extends",
  });
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");

  // Verify link is gone
  const { data: linkData } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`);
  const link = (linkData.links || []).find(l => l.source_id === TEST_ID_A && l.target_id === TEST_ID_B && l.relation === "extends");
  assert(link === undefined, "link removed after delete");
}

async function testDeleteLinkMissingFields() {
  console.log("\n[20] DELETE /api/projects/:id/links — missing fields (should 400)");
  const { status, data } = await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    // relation omitted
  });
  assertEqual(status, 400, "status 400 for missing relation");
  assertHas(data, "error", "error message present");
}

async function testCascadeDeleteLinksOnProjectDelete() {
  console.log("\n[21] DELETE /api/projects/:id — CASCADE deletes links");
  // Re-create link for cascade test
  await api("POST", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`, {
    target_id: TEST_ID_B,
    relation: "shares_data",
  });

  // Confirm link exists
  const { data: before } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}/links`);
  const linkBefore = (before.links || []).find(l => l.relation === "shares_data");
  assert(linkBefore !== undefined, "link exists before cascade delete");

  // Delete project A
  const { status, data } = await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  assertEqual(status, 200, "delete project A status 200");
  assert(data.success, "success flag on delete");

  // Project A should be gone
  const { status: getStatus } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_A)}`);
  assertEqual(getStatus, 404, "project A is 404 after delete");

  // Links involving A should be gone (CASCADE)
  // Check from B's side — the link A→B should be gone
  const { data: after } = await api("GET", `/api/projects/${encodeURIComponent(TEST_ID_B)}/links`);
  const linkAfter = (after.links || []).find(l => l.source_id === TEST_ID_A || l.target_id === TEST_ID_A);
  assert(linkAfter === undefined, "links CASCADE deleted when project A deleted");
}

async function testDeleteProjectB() {
  console.log("\n[22] DELETE /api/projects/:id — cleanup project B");
  const { status, data } = await api("DELETE", `/api/projects/${encodeURIComponent(TEST_ID_B)}`);
  assertEqual(status, 200, "status code");
  assert(data.success, "success flag");
}

// ── Seed script logic tests (pure function, no network) ─────────────────────

async function testSeedScriptCategorize() {
  console.log("\n[23] Seed script: categorize() function logic");

  // Replicate categorize() logic from seed-projects.mjs
  function categorize(mod) {
    if (mod.path.startsWith("edwards/")) return "edwards";
    if (mod.name.includes("skills") || mod.name.includes("kanban")) return "skills";
    if (mod.name.includes("tools") || mod.name.includes("assist") || mod.name.includes("gmail") || mod.name.includes("jira")) return "tools";
    if (mod.name === "community.skills") return "community";
    return "personal";
  }

  const cases = [
    [{ path: "edwards/oqc.infra", name: "edwards.oqc.infra" }, "edwards", "edwards/ path"],
    [{ path: "cyanluna.skills", name: "cyanluna.skills" }, "skills", "skills in name"],
    [{ path: "kanban-board", name: "kanban-board" }, "skills", "kanban in name"],
    [{ path: "tools/assist-hub", name: "assist-hub" }, "tools", "assist in name"],
    [{ path: "tools/gmail-tool", name: "gmail.tools" }, "tools", "gmail in name"],
    [{ path: "tools/jira", name: "jira.javis" }, "tools", "jira in name"],
    [{ path: "community.skills", name: "community.skills" }, "community", "exact community.skills"],
    [{ path: "some-personal", name: "my-project" }, "personal", "fallback personal"],
  ];

  for (const [mod, expected, label] of cases) {
    assertEqual(categorize(mod), expected, `categorize: ${label}`);
  }
}

async function testSeedScriptExtractPurpose() {
  console.log("\n[24] Seed script: extractPurpose() function logic");

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

  // Headings are skipped
  assertEqual(
    extractPurpose("# Title\nActual description here", null),
    "Actual description here",
    "skips h1 heading, picks first plain line"
  );

  // --- is skipped
  assertEqual(
    extractPurpose("---\nSome content here", null),
    "Some content here",
    "skips frontmatter separator"
  );

  // Code fences are skipped
  assertEqual(
    extractPurpose("```yaml\nfoo: bar\n```\nDescription", null),
    "Description",
    "skips code fences"
  );

  // Short lines (<=15 chars) are skipped
  assertEqual(
    extractPurpose("Short", "A proper description that is longer than 15 characters"),
    "A proper description that is longer than 15 characters",
    "falls through short CLAUDE.md to README"
  );

  // Falls back to README when CLAUDE.md is null
  assertEqual(
    extractPurpose(null, "README description here"),
    "README description here",
    "falls back to README when claudeMd is null"
  );

  // Returns null when both are null
  assertEqual(
    extractPurpose(null, null),
    null,
    "returns null when both inputs are null"
  );

  // README skips image lines
  assertEqual(
    extractPurpose(null, "![badge](url)\nReal description here"),
    "Real description here",
    "README skips image markdown lines"
  );

  // Long lines (>=500) are skipped
  const tooLong = "x".repeat(501);
  assertEqual(
    extractPurpose(tooLong, "Fallback description line"),
    "Fallback description line",
    "skips lines >= 500 chars"
  );
}

async function testSeedScriptExtractStack() {
  console.log("\n[25] Seed script: extractStack() function logic");

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

  // Matches "stack:" pattern
  const stackResult = extractStack("Stack: TypeScript, React, Vite");
  assert(stackResult !== null, "extracts stack from 'Stack: ...' pattern");
  assert(stackResult.includes("TypeScript"), "stack includes TypeScript");

  // Matches "tech:" pattern
  const techResult = extractStack("Tech: Python, Django");
  assert(techResult !== null, "extracts from 'tech:' pattern");

  // Falls back to technology keyword match
  const keywordResult = extractStack("This project uses TypeScript and React.");
  assert(keywordResult !== null, "matches TypeScript keyword fallback");
  assertEqual(keywordResult, "TypeScript", "returns matched keyword");

  // Returns null if no match
  assertEqual(extractStack("No technology info here."), null, "returns null when no match");
  assertEqual(extractStack(null), null, "returns null for null input");
}

async function testSeedScriptGitmodulesParser() {
  console.log("\n[26] Seed script: .gitmodules parser logic");

  // Replicate the parser
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

  const sample = `
[submodule "cyanluna.skills"]
\tpath = cyanluna.skills
\turl = https://github.com/cyan/cyanluna.skills.git

[submodule "edwards/oqc.infra"]
\tpath = edwards/oqc.infra
\turl = git@github.com:cyan/edwards-oqc-infra.git
`.trim();

  const result = parseGitmodules(sample);

  assertEqual(result.length, 2, "parses 2 submodules");
  assertEqual(result[0].name, "cyanluna.skills", "first submodule name");
  assertEqual(result[0].path, "cyanluna.skills", "first submodule path");
  assertEqual(result[0].url, "https://github.com/cyan/cyanluna.skills.git", "first submodule url");
  assertEqual(result[1].name, "edwards/oqc.infra", "second submodule name (slash in name)");
  assertEqual(result[1].path, "edwards/oqc.infra", "second submodule path");

  // Edge: empty content
  const empty = parseGitmodules("");
  assertEqual(empty.length, 0, "empty string returns empty array");

  // Edge: submodule with only name (no path/url)
  const partial = parseGitmodules('[submodule "partial"]\n');
  assertEqual(partial.length, 1, "partial entry still parsed");
  assertEqual(partial[0].name, "partial", "partial entry has name");
  assertEqual(partial[0].path, "", "partial entry path is empty string");
}

// ── Run all tests ─────────────────────────────────────────────────────────

async function main() {
  console.log(`\nShield API Integration Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`${"─".repeat(60)}`);

  // Cleanup first (remove any stale test data)
  await cleanup();

  // Network integration tests
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
  await testGetLinksAppearsOnBothProjects();
  await testGetProjectIncludesLinks();
  await testListProjectsIncludesLinks();
  await testDeleteLink();
  await testDeleteLinkMissingFields();
  await testCascadeDeleteLinksOnProjectDelete();
  await testDeleteProjectB();

  // Pure logic tests (no network)
  await testSeedScriptCategorize();
  await testSeedScriptExtractPurpose();
  await testSeedScriptExtractStack();
  await testSeedScriptGitmodulesParser();

  // Summary
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) console.log(`  ✗ ${f}`);
  }

  // Exit with error code if any test failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(2);
});
