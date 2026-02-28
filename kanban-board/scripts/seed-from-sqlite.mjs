#!/usr/bin/env node
/**
 * One-time seed script: migrates all SQLite kanban DBs into Neon PostgreSQL.
 *
 * Usage:
 *   node scripts/seed-from-sqlite.mjs
 *
 * Requires:
 *   - .env with DATABASE_URL set (in kanban-board/)
 *   - sqlite3 CLI available on PATH
 *   - ~/.claude/kanban-dbs/*.db files to seed
 */

import { neon } from "@neondatabase/serverless";
import { execSync } from "child_process";
import { readdirSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set. Create kanban-board/.env first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const KANBAN_DBS_DIR = resolve(homedir(), ".claude", "kanban-dbs");

// ── helpers ──────────────────────────────────────────────────────────────────

/** Run sqlite3 -json and return parsed rows. Returns [] on empty table. */
function readSqliteDb(dbPath) {
  try {
    const out = execSync(`sqlite3 -json "${dbPath}" "SELECT * FROM tasks ORDER BY id"`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (!out) return [];
    return JSON.parse(out);
  } catch (err) {
    // sqlite3 exits non-zero on empty result in some versions
    const msg = err.stdout?.trim() || err.stderr?.trim() || err.message;
    if (msg === "" || msg === "[]") return [];
    throw err;
  }
}

/** Convert SQLite TEXT timestamp to a value Postgres accepts, or null. */
function ts(val) {
  if (!val || val === "") return null;
  return val; // PostgreSQL accepts "YYYY-MM-DD HH:MM:SS" as TIMESTAMPTZ
}

/** Safe integer conversion — never returns NaN. */
function toInt(val, def = 0) {
  if (val === null || val === undefined || val === "") return def;
  const n = Number(val);
  return Number.isNaN(n) ? def : Math.trunc(n);
}

/** Insert a single task row (id is omitted — SERIAL handles it). */
async function insertTask(project, row) {
  await sql.query(
    `INSERT INTO tasks (
       project, title, status, priority, description,
       plan, implementation_notes, tags, review_comments,
       plan_review_comments, test_results, agent_log, current_agent,
       plan_review_count, impl_review_count, level,
       attachments, notes, decision_log, done_when, rank,
       created_at, started_at, planned_at, reviewed_at, tested_at, completed_at
     ) VALUES (
       $1,  $2,  $3,  $4,  $5,
       $6,  $7,  $8,  $9,
       $10, $11, $12, $13,
       $14, $15, $16,
       $17, $18, $19, $20, $21,
       $22, $23, $24, $25, $26, $27
     )`,
    [
      project,
      row.title,
      row.status ?? "todo",
      row.priority ?? "medium",
      row.description ?? null,
      row.plan ?? null,
      row.implementation_notes ?? null,
      row.tags ?? null,
      row.review_comments ?? null,
      row.plan_review_comments ?? null,
      row.test_results ?? null,
      row.agent_log ?? null,
      row.current_agent ?? null,
      toInt(row.plan_review_count, 0),
      toInt(row.impl_review_count, 0),
      toInt(row.level, 3),
      row.attachments ?? null,
      row.notes ?? null,
      row.decision_log ?? null,
      row.done_when ?? null,
      toInt(row.rank, 0),
      ts(row.created_at),
      ts(row.started_at),
      ts(row.planned_at),
      ts(row.reviewed_at),
      ts(row.tested_at),
      ts(row.completed_at),
    ]
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

const dbFiles = readdirSync(KANBAN_DBS_DIR)
  .filter((f) => f.endsWith(".db"))
  .sort();

console.log(`Found ${dbFiles.length} DB files in ${KANBAN_DBS_DIR}\n`);

// Check for existing data in Neon to avoid double-seeding
const existingRows = await sql.query("SELECT DISTINCT project FROM tasks");
const existingProjects = new Set(Array.from(existingRows).map((row) => row.project));

if (existingProjects.size > 0) {
  console.log("⚠️  Existing projects in Neon:", [...existingProjects].join(", "));
  console.log("   Skipping those projects to avoid duplicates.\n");
}

let totalInserted = 0;

for (const dbFile of dbFiles) {
  const project = dbFile.replace(/\.db$/, "");
  const dbPath = resolve(KANBAN_DBS_DIR, dbFile);

  if (existingProjects.has(project)) {
    console.log(`[${project}] skipped (already in Neon)`);
    continue;
  }

  let rows;
  try {
    rows = readSqliteDb(dbPath);
  } catch (err) {
    console.error(`[${project}] ERROR reading SQLite: ${err.message}`);
    continue;
  }

  if (rows.length === 0) {
    console.log(`[${project}] 0 rows, skipping`);
    continue;
  }

  process.stdout.write(`[${project}] seeding ${rows.length} rows... `);
  for (const row of rows) {
    try {
      await insertTask(project, row);
    } catch (err) {
      console.error(`\n  ERROR on row id=${row.id}: ${err.message}`);
      throw err;
    }
  }
  console.log("done");
  totalInserted += rows.length;
}

console.log(`\nSeeding complete. Inserted ${totalInserted} rows total.`);
