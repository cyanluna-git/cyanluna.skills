#!/usr/bin/env node
/**
 * Incremental sync: SQLite → Neon for specified projects.
 * Matches tasks by (project, title). For each SQLite task:
 *   - If not in Neon → INSERT
 *   - If in Neon and fields differ → UPDATE
 *
 * Usage:
 *   node scripts/sync-from-sqlite.mjs unify edwards.oqc.infra
 */

import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";
import { resolve } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const sql = neon(process.env.DATABASE_URL);
const KANBAN_DBS_DIR = resolve(homedir(), ".claude", "kanban-dbs");

const PROJECTS = process.argv.slice(2);
if (!PROJECTS.length) {
  console.error("Usage: node sync-from-sqlite.mjs <project1> [project2] ...");
  process.exit(1);
}

// Fields to compare & sync (excludes id, project, title — used as key)
const FIELDS = [
  "status", "priority", "description", "plan", "implementation_notes",
  "tags", "review_comments", "plan_review_comments", "test_results",
  "agent_log", "current_agent", "plan_review_count", "impl_review_count",
  "level", "attachments", "notes", "decision_log", "done_when", "rank",
  "created_at", "started_at", "planned_at", "reviewed_at", "tested_at", "completed_at",
];

function readSqlite(dbPath) {
  const out = execSync(`sqlite3 -json "${dbPath}" "SELECT * FROM tasks ORDER BY id"`, {
    encoding: "utf8", stdio: ["pipe", "pipe", "pipe"],
  }).trim();
  return out ? JSON.parse(out) : [];
}

function toInt(val, def = 0) {
  if (val === null || val === undefined || val === "") return def;
  const n = Number(val);
  return Number.isNaN(n) ? def : Math.trunc(n);
}

function ts(val) {
  if (!val || val === "") return null;
  return val;
}

function normalize(row) {
  return {
    status:               row.status ?? "todo",
    priority:             row.priority ?? "medium",
    description:          row.description ?? null,
    plan:                 row.plan ?? null,
    implementation_notes: row.implementation_notes ?? null,
    tags:                 row.tags ?? null,
    review_comments:      row.review_comments ?? null,
    plan_review_comments: row.plan_review_comments ?? null,
    test_results:         row.test_results ?? null,
    agent_log:            row.agent_log ?? null,
    current_agent:        row.current_agent ?? null,
    plan_review_count:    toInt(row.plan_review_count, 0),
    impl_review_count:    toInt(row.impl_review_count, 0),
    level:                toInt(row.level, 3),
    attachments:          row.attachments ?? null,
    notes:                row.notes ?? null,
    decision_log:         row.decision_log ?? null,
    done_when:            row.done_when ?? null,
    rank:                 toInt(row.rank, 0),
    created_at:           ts(row.created_at),
    started_at:           ts(row.started_at),
    planned_at:           ts(row.planned_at),
    reviewed_at:          ts(row.reviewed_at),
    tested_at:            ts(row.tested_at),
    completed_at:         ts(row.completed_at),
  };
}

function diff(sqlite, neon) {
  return FIELDS.filter((f) => {
    const a = String(sqlite[f] ?? "");
    const b = String(neon[f] ?? "");
    return a !== b;
  });
}

for (const project of PROJECTS) {
  const dbPath = resolve(KANBAN_DBS_DIR, `${project}.db`);
  console.log(`\n=== ${project} ===`);

  // Load SQLite
  let sqliteRows;
  try { sqliteRows = readSqlite(dbPath); }
  catch (e) { console.error(`  ERROR reading SQLite: ${e.message}`); continue; }

  // Load Neon (keyed by title)
  const neonRows = await sql.query(
    "SELECT * FROM tasks WHERE project = $1", [project]
  );
  const neonByTitle = new Map(neonRows.map((r) => [r.title, r]));

  let inserted = 0, updated = 0, skipped = 0;

  for (const row of sqliteRows) {
    const s = normalize(row);
    const neonRow = neonByTitle.get(row.title);

    if (!neonRow) {
      // INSERT new task
      await sql.query(
        `INSERT INTO tasks (
           project, title, status, priority, description,
           plan, implementation_notes, tags, review_comments,
           plan_review_comments, test_results, agent_log, current_agent,
           plan_review_count, impl_review_count, level,
           attachments, notes, decision_log, done_when, rank,
           created_at, started_at, planned_at, reviewed_at, tested_at, completed_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
           $14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
         )`,
        [project, row.title, s.status, s.priority, s.description,
         s.plan, s.implementation_notes, s.tags, s.review_comments,
         s.plan_review_comments, s.test_results, s.agent_log, s.current_agent,
         s.plan_review_count, s.impl_review_count, s.level,
         s.attachments, s.notes, s.decision_log, s.done_when, s.rank,
         s.created_at, s.started_at, s.planned_at, s.reviewed_at, s.tested_at, s.completed_at]
      );
      console.log(`  [INSERT] "${row.title}"`);
      inserted++;
      continue;
    }

    // Compare
    const changed = diff(s, neonRow);
    if (changed.length === 0) { skipped++; continue; }

    // UPDATE changed fields only
    let p = 1;
    const setClauses = changed.map((f) => `${f} = $${p++}`);
    const values = changed.map((f) => s[f]);
    values.push(neonRow.id); // WHERE id = $N

    await sql.query(
      `UPDATE tasks SET ${setClauses.join(", ")} WHERE id = $${p}`,
      values
    );
    console.log(`  [UPDATE] "${row.title}" — changed: ${changed.join(", ")}`);
    updated++;
  }

  console.log(`  → inserted: ${inserted}, updated: ${updated}, unchanged: ${skipped}`);
}

console.log("\nSync complete.");
