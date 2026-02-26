import { spawn } from "child_process";
import Database from "better-sqlite3";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Per-project DBs: ~/.claude/kanban-dbs/{project}.db
const DBS_DIR =
  process.env.KANBAN_DBS_DIR ||
  path.resolve(os.homedir(), ".claude", "kanban-dbs");

const IMAGES_DIR =
  process.env.KANBAN_IMAGES ||
  path.resolve(os.homedir(), ".claude", "kanban-images");

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Valid status transitions per pipeline level
function getTransitions(level: number): Record<string, string[]> {
  if (level === 1) {
    // L1 Quick: Req → Impl → Done
    return {
      todo: ["impl"],
      impl: ["done"],
      done: [],
    };
  }
  if (level === 2) {
    // L2 Standard: Req → Plan → Impl → Review Impl → Done
    return {
      todo:        ["plan"],
      plan:        ["impl", "todo"],
      impl:        ["impl_review"],
      impl_review: ["done", "impl"],
      done:        [],
    };
  }
  // L3 Full pipeline (default)
  return {
    todo:        ["plan"],
    plan:        ["plan_review", "todo"],
    plan_review: ["impl", "plan"],
    impl:        ["impl_review"],
    impl_review: ["test", "impl"],
    test:        ["done", "impl"],
    done:        [],
  };
}

// Project name → DB connection cache
const _dbs = new Map<string, Database.Database>();

function sanitizeProject(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getDb(project: string): Database.Database {
  const safe = sanitizeProject(project);
  if (_dbs.has(safe)) return _dbs.get(safe)!;

  if (!fs.existsSync(DBS_DIR)) fs.mkdirSync(DBS_DIR, { recursive: true });

  const dbPath = path.join(DBS_DIR, `${safe}.db`);
  const db = new Database(dbPath);
  db.pragma("journal_mode = DELETE");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      description TEXT,
      plan TEXT,
      implementation_notes TEXT,
      tags TEXT,
      review_comments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      started_at TEXT,
      reviewed_at TEXT,
      completed_at TEXT
    );
  `);

  // Migrate existing DB: add new columns if missing
  try { db.exec(`ALTER TABLE tasks ADD COLUMN review_comments TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN reviewed_at TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN plan TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN implementation_notes TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN rank INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN plan_review_comments TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN test_results TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN agent_log TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN current_agent TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN plan_review_count INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN impl_review_count INTEGER NOT NULL DEFAULT 0`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN planned_at TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN tested_at TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN level INTEGER NOT NULL DEFAULT 3`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN attachments TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN notes TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN decision_log TEXT`); } catch { /* exists */ }
  try { db.exec(`ALTER TABLE tasks ADD COLUMN done_when TEXT`); } catch { /* exists */ }

  // Backfill rank for existing rows (rank=0) with 1000-unit spacing per project+status group
  db.exec(`
    UPDATE tasks SET rank = (
      SELECT COUNT(*) FROM tasks t2
      WHERE t2.project = tasks.project
        AND t2.status = tasks.status
        AND t2.id <= tasks.id
    ) * 1000
    WHERE rank = 0
  `);

  // Migrate Korean priority values to English
  db.exec(`UPDATE tasks SET priority = 'high' WHERE priority = '높음'`);
  db.exec(`UPDATE tasks SET priority = 'medium' WHERE priority = '중간'`);
  db.exec(`UPDATE tasks SET priority = 'low' WHERE priority = '낮음'`);

  // Migrate old 4-column statuses to 7-column pipeline
  db.exec(`UPDATE tasks SET status = 'impl' WHERE status = 'inprogress'`);
  db.exec(`UPDATE tasks SET status = 'impl_review' WHERE status = 'review'`);

  _dbs.set(safe, db);
  return db;
}

// Scan all .db files in DBS_DIR (exclude WAL/SHM sidecar files)
function getAllDbFiles(): string[] {
  if (!fs.existsSync(DBS_DIR)) return [];
  return fs.readdirSync(DBS_DIR).filter(
    (f) => f.endsWith(".db") && !f.endsWith("-wal") && !f.endsWith("-shm")
  );
}

function renumberRanks(db: Database.Database, project: string, status: string) {
  const rows = db
    .prepare("SELECT id FROM tasks WHERE project = ? AND status = ? ORDER BY rank, id")
    .all(project, status) as { id: number }[];
  const stmt = db.prepare("UPDATE tasks SET rank = ? WHERE id = ?");
  for (let i = 0; i < rows.length; i++) {
    stmt.run((i + 1) * 1000, rows[i].id);
  }
}

interface Task {
  id: number;
  project: string;
  title: string;
  status: string;
  priority: string;
  rank: number;
  description: string | null;
  plan: string | null;
  implementation_notes: string | null;
  tags: string | null;
  review_comments: string | null;
  plan_review_comments: string | null;
  test_results: string | null;
  agent_log: string | null;
  current_agent: string | null;
  plan_review_count: number;
  impl_review_count: number;
  level: number;
  attachments: string | null;
  notes: string | null;
  decision_log: string | null;
  done_when: string | null;
  created_at: string;
  started_at: string | null;
  planned_at: string | null;
  reviewed_at: string | null;
  tested_at: string | null;
  completed_at: string | null;
}

interface Board {
  todo: Task[];
  plan: Task[];
  plan_review: Task[];
  impl: Task[];
  impl_review: Task[];
  test: Task[];
  done: Task[];
  projects: string[];
}

// Alias mapping for backward compatibility (old 4-column → new 7-column)
const STATUS_ALIASES: Record<string, string> = {
  inprogress: "impl",
  review: "impl_review",
};

function normalizeStatus(status: string): string {
  return STATUS_ALIASES[status] || status;
}

export function kanbanApiPlugin(): Plugin {
  return {
    name: "kanban-api",
    configureServer(server: ViteDevServer) {
      function parseBody(req: any): Promise<any> {
        return new Promise((resolve) => {
          let body = "";
          req.on("data", (chunk: string) => (body += chunk));
          req.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve({});
            }
          });
        });
      }

      server.middlewares.use(async (req, res, next) => {
        const reqUrl = new URL(req.url || "/", "http://localhost");
        const pathname = reqUrl.pathname;

        // GET /api/info  (project directory name)
        if (pathname === "/api/info") {
          const projectName = path.basename(path.resolve(__dirname, "..", ".."));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ projectName }));
          return;
        }

        // GET /api/board?project=xxx  (or all projects if no param)
        if (pathname === "/api/board") {
          const projectParam = reqUrl.searchParams.get("project");
          const allFiles = getAllDbFiles();

          // Always collect ALL project names from all DBs (filter dropdown must always show all options)
          const projectSet = new Set<string>();
          for (const file of allFiles) {
            const pName = path.basename(file, ".db");
            const pDb = getDb(pName);
            const dbProjects = pDb
              .prepare("SELECT DISTINCT project FROM tasks")
              .all() as { project: string }[];
            for (const t of dbProjects) projectSet.add(t.project);
            if (dbProjects.length === 0) projectSet.add(pName);
          }
          const projects = [...projectSet].sort();

          // Load tasks — filtered by project or all
          let tasks: Task[];
          if (projectParam) {
            const db = getDb(projectParam);
            tasks = db
              .prepare("SELECT * FROM tasks WHERE project = ? ORDER BY rank, id")
              .all(projectParam) as Task[];
          } else {
            tasks = [];
            for (const file of allFiles) {
              const pName = path.basename(file, ".db");
              const db = getDb(pName);
              const dbTasks = db
                .prepare("SELECT * FROM tasks ORDER BY rank, id")
                .all() as Task[];
              tasks.push(...dbTasks);
            }
          }

          const grouped = new Map<string, Task[]>();
          for (const t of tasks) {
            const arr = grouped.get(t.status);
            if (arr) arr.push(t);
            else grouped.set(t.status, [t]);
          }
          const board: Board = {
            todo: grouped.get("todo") || [],
            plan: grouped.get("plan") || [],
            plan_review: grouped.get("plan_review") || [],
            impl: grouped.get("impl") || [],
            impl_review: grouped.get("impl_review") || [],
            test: grouped.get("test") || [],
            done: grouped.get("done") || [],
            projects,
          };

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(board));
          return;
        }

        // Route: /api/task/:id  (single task by id)
        const taskMatch = pathname.match(/^\/api\/task\/(\d+)$/);
        if (taskMatch) {
          const id = taskMatch[1];
          const projectParam = reqUrl.searchParams.get("project");

          // GET /api/task/:id  — scan all DBs if no project param
          if (req.method === "GET") {
            let task: Task | undefined;
            if (projectParam) {
              const db = getDb(projectParam);
              task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
            } else {
              for (const file of getAllDbFiles()) {
                const projectName = path.basename(file, ".db");
                const db = getDb(projectName);
                const found = db
                  .prepare("SELECT * FROM tasks WHERE id = ?")
                  .get(id) as Task | undefined;
                if (found) { task = found; break; }
              }
            }

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(task));
            return;
          }

          // PATCH /api/task/:id?project=xxx  (move status, edit)
          if (req.method === "PATCH") {
            if (!projectParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "project query param required" }));
              return;
            }
            const body = await parseBody(req);
            if (body.status !== undefined) body.status = normalizeStatus(body.status);
            const db = getDb(projectParam);

            // Status transition validation
            if (body.status !== undefined) {
              const task = db
                .prepare("SELECT status, level FROM tasks WHERE id = ?")
                .get(id) as { status: string; level: number } | undefined;
              if (task) {
                const transitions = getTransitions(task.level);
                const allowed = transitions[task.status];
                if (allowed && !allowed.includes(body.status)) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({
                    error: `Invalid transition: ${task.status} -> ${body.status} (L${task.level})`,
                    allowed,
                  }));
                  return;
                }
              }
            }

            const sets: string[] = [];
            const values: any[] = [];

            if (body.status !== undefined) {
              sets.push("status = ?");
              values.push(body.status);
              if (body.status === "plan") {
                sets.push("started_at = COALESCE(started_at, datetime('now'))");
              } else if (body.status === "plan_review") {
                sets.push("planned_at = datetime('now')");
              } else if (body.status === "test") {
                sets.push("tested_at = datetime('now')");
              } else if (body.status === "done") {
                sets.push("completed_at = datetime('now')");
              } else if (body.status === "todo") {
                sets.push("started_at = NULL");
                sets.push("planned_at = NULL");
                sets.push("completed_at = NULL");
                sets.push("reviewed_at = NULL");
                sets.push("tested_at = NULL");
              }
            }
            if (body.title !== undefined) { sets.push("title = ?"); values.push(body.title); }
            if (body.priority !== undefined) { sets.push("priority = ?"); values.push(body.priority); }
            if (body.description !== undefined) { sets.push("description = ?"); values.push(body.description); }
            if (body.plan !== undefined) { sets.push("plan = ?"); values.push(body.plan); }
            if (body.implementation_notes !== undefined) {
              sets.push("implementation_notes = ?");
              values.push(body.implementation_notes);
            }
            if (body.tags !== undefined) {
              sets.push("tags = ?");
              values.push(typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags));
            }
            if (body.review_comments !== undefined) {
              sets.push("review_comments = ?");
              values.push(typeof body.review_comments === "string" ? body.review_comments : JSON.stringify(body.review_comments));
            }
            if (body.plan_review_comments !== undefined) {
              sets.push("plan_review_comments = ?");
              values.push(typeof body.plan_review_comments === "string" ? body.plan_review_comments : JSON.stringify(body.plan_review_comments));
            }
            if (body.test_results !== undefined) {
              sets.push("test_results = ?");
              values.push(typeof body.test_results === "string" ? body.test_results : JSON.stringify(body.test_results));
            }
            if (body.agent_log !== undefined) {
              sets.push("agent_log = ?");
              values.push(typeof body.agent_log === "string" ? body.agent_log : JSON.stringify(body.agent_log));
            }
            if (body.current_agent !== undefined) { sets.push("current_agent = ?"); values.push(body.current_agent); }
            if (body.reviewed_at !== undefined) { sets.push("reviewed_at = ?"); values.push(body.reviewed_at); }
            if (body.rank !== undefined) { sets.push("rank = ?"); values.push(body.rank); }
            if (body.level !== undefined) { sets.push("level = ?"); values.push(body.level); }
            if (body.decision_log !== undefined) { sets.push("decision_log = ?"); values.push(body.decision_log); }
            if (body.done_when !== undefined) { sets.push("done_when = ?"); values.push(body.done_when); }

            if (sets.length > 0) {
              values.push(id);
              db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...values);
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // DELETE /api/task/:id?project=xxx
          if (req.method === "DELETE") {
            if (!projectParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "project query param required" }));
              return;
            }
            const db = getDb(projectParam);

            // Delete associated attachment files
            const task = db
              .prepare("SELECT attachments FROM tasks WHERE id = ?")
              .get(id) as { attachments: string | null } | undefined;
            if (task?.attachments) {
              try {
                const atts = JSON.parse(task.attachments);
                for (const a of atts) {
                  try { fs.unlinkSync(path.join(IMAGES_DIR, a.storedName)); } catch { /* ok */ }
                }
              } catch { /* ok */ }
            }

            db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
            return;
          }
        }

        // PATCH /api/task/:id/reorder?project=xxx
        const reorderMatch = pathname.match(/^\/api\/task\/(\d+)\/reorder$/);
        if (reorderMatch && req.method === "PATCH") {
          const id = parseInt(reorderMatch[1]);
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const body = await parseBody(req);
          if (body.status !== undefined) body.status = normalizeStatus(body.status);
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(id) as Task | undefined;
          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const targetStatus = body.status || task.status;
          const project = task.project;

          // Status transition validation for drag-and-drop
          if (targetStatus !== task.status) {
            const transitions = getTransitions(task.level);
            const allowed = transitions[task.status];
            if (allowed && !allowed.includes(targetStatus)) {
              res.statusCode = 400;
              res.end(JSON.stringify({
                error: `Invalid transition: ${task.status} -> ${targetStatus} (L${task.level})`,
                allowed,
              }));
              return;
            }

            const sets: string[] = ["status = ?"];
            const vals: any[] = [targetStatus];
            if (targetStatus === "plan") {
              sets.push("started_at = COALESCE(started_at, datetime('now'))");
            } else if (targetStatus === "plan_review") {
              sets.push("planned_at = datetime('now')");
            } else if (targetStatus === "test") {
              sets.push("tested_at = datetime('now')");
            } else if (targetStatus === "done") {
              sets.push("completed_at = datetime('now')");
            } else if (targetStatus === "todo") {
              sets.push("started_at = NULL");
              sets.push("planned_at = NULL");
              sets.push("completed_at = NULL");
              sets.push("reviewed_at = NULL");
              sets.push("tested_at = NULL");
            }
            vals.push(id);
            db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
          }

          // Calculate new rank
          let newRank: number;
          const afterId = body.afterId as number | null;
          const beforeId = body.beforeId as number | null;

          if (afterId && beforeId) {
            const above = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(afterId) as { rank: number } | undefined;
            const below = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(beforeId) as { rank: number } | undefined;
            if (above && below) {
              newRank = Math.floor((above.rank + below.rank) / 2);
              if (newRank === above.rank) {
                renumberRanks(db, project, targetStatus);
                const a2 = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(afterId) as { rank: number };
                const b2 = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(beforeId) as { rank: number };
                newRank = Math.floor((a2.rank + b2.rank) / 2);
              }
            } else {
              newRank = 1000;
            }
          } else if (afterId) {
            const above = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(afterId) as { rank: number } | undefined;
            newRank = above ? above.rank + 1000 : 1000;
          } else if (beforeId) {
            const below = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(beforeId) as { rank: number } | undefined;
            if (below) {
              newRank = Math.floor(below.rank / 2);
              if (newRank === 0) {
                renumberRanks(db, project, targetStatus);
                const b2 = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(beforeId) as { rank: number };
                newRank = Math.floor(b2.rank / 2);
              }
            } else {
              newRank = 1000;
            }
          } else {
            newRank = 1000;
          }

          db.prepare("UPDATE tasks SET rank = ? WHERE id = ?").run(newRank, id);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, rank: newRank }));
          return;
        }

        // POST /api/task  (create new task — body.project required)
        if (pathname === "/api/task" && req.method === "POST") {
          const body = await parseBody(req);
          const project = body.project;
          if (!project) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "body.project is required" }));
            return;
          }

          const db = getDb(project);
          const title = body.title || "Untitled";
          const priority = body.priority || "medium";
          const description = body.description || null;
          const tags =
            body.tags !== undefined
              ? typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags)
              : null;
          const level = body.level !== undefined ? parseInt(body.level) || 3 : 3;

          const maxRankRow = db
            .prepare("SELECT MAX(rank) as maxRank FROM tasks WHERE project = ? AND status = 'todo'")
            .get(project) as { maxRank: number | null } | undefined;
          const rank = (maxRankRow?.maxRank ?? 0) + 1000;

          const result = db
            .prepare(
              `INSERT INTO tasks (project, title, priority, description, tags, rank, level)
               VALUES (?, ?, ?, ?, ?, ?, ?)`
            )
            .run(project, title, priority, description, tags, rank, level);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, id: result.lastInsertRowid }));
          return;
        }

        // POST /api/task/:id/review?project=xxx
        const reviewMatch = pathname.match(/^\/api\/task\/(\d+)\/review$/);
        if (reviewMatch && req.method === "POST") {
          const id = reviewMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const body = await parseBody(req);
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT review_comments, status, impl_review_count, level FROM tasks WHERE id = ?")
            .get(id) as { review_comments: string | null; status: string; impl_review_count: number; level: number } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const comments = task.review_comments ? JSON.parse(task.review_comments) : [];
          const newComment = {
            reviewer: body.reviewer || "claude-review-agent",
            status: body.status,
            comment: body.comment,
            timestamp: new Date().toISOString(),
          };
          comments.push(newComment);

          const approvedTarget = task.level <= 2 ? "done" : "test";
          const newStatus = body.status === "approved" ? approvedTarget : "impl";
          const sets = [
            "review_comments = ?",
            "reviewed_at = datetime('now')",
            "status = ?",
            "impl_review_count = ?",
          ];
          const vals: any[] = [JSON.stringify(comments), newStatus, task.impl_review_count + 1];

          if (newStatus === "test") {
            sets.push("tested_at = datetime('now')");
          } else if (newStatus === "done") {
            sets.push("completed_at = datetime('now')");
          }

          vals.push(id);
          db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, newStatus, comment: newComment }));
          return;
        }

        // POST /api/task/:id/plan-review?project=xxx
        const planReviewMatch = pathname.match(/^\/api\/task\/(\d+)\/plan-review$/);
        if (planReviewMatch && req.method === "POST") {
          const id = planReviewMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const body = await parseBody(req);
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT plan_review_comments, status, plan_review_count FROM tasks WHERE id = ?")
            .get(id) as { plan_review_comments: string | null; status: string; plan_review_count: number } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const comments = task.plan_review_comments ? JSON.parse(task.plan_review_comments) : [];
          const newComment = {
            reviewer: body.reviewer || "plan-review-agent",
            status: body.status,
            comment: body.comment,
            timestamp: new Date().toISOString(),
          };
          comments.push(newComment);

          const newStatus = body.status === "approved" ? "impl" : "plan";
          const sets = ["plan_review_comments = ?", "status = ?", "plan_review_count = ?"];
          const vals: any[] = [JSON.stringify(comments), newStatus, task.plan_review_count + 1];

          vals.push(id);
          db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, newStatus, comment: newComment }));
          return;
        }

        // POST /api/task/:id/test-result?project=xxx
        const testResultMatch = pathname.match(/^\/api\/task\/(\d+)\/test-result$/);
        if (testResultMatch && req.method === "POST") {
          const id = testResultMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const body = await parseBody(req);
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT test_results, status FROM tasks WHERE id = ?")
            .get(id) as { test_results: string | null; status: string } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const results = task.test_results ? JSON.parse(task.test_results) : [];
          const newResult = {
            tester: body.tester || "test-runner-agent",
            status: body.status,
            lint: body.lint || null,
            build: body.build || null,
            tests: body.tests || null,
            comment: body.comment || null,
            timestamp: new Date().toISOString(),
          };
          results.push(newResult);

          const newStatus = body.status === "pass" ? "done" : "impl";
          const sets = ["test_results = ?", "status = ?"];
          const vals: any[] = [JSON.stringify(results), newStatus];

          if (newStatus === "done") sets.push("completed_at = datetime('now')");

          vals.push(id);
          db.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, newStatus, result: newResult }));
          return;
        }

        // POST /api/task/:id/note?project=xxx
        const noteMatch = pathname.match(/^\/api\/task\/(\d+)\/note$/);
        if (noteMatch && req.method === "POST") {
          const id = noteMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const body = await parseBody(req);
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT notes FROM tasks WHERE id = ?")
            .get(id) as { notes: string | null } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const notes = task.notes ? JSON.parse(task.notes) : [];
          const note = {
            id: Date.now(),
            text: body.text || "",
            author: body.author || "user",
            timestamp: new Date().toISOString(),
          };
          notes.push(note);

          db.prepare("UPDATE tasks SET notes = ? WHERE id = ?").run(JSON.stringify(notes), id);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, note }));
          return;
        }

        // DELETE /api/task/:id/note/:noteId?project=xxx
        const noteDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/note\/(\d+)$/);
        if (noteDeleteMatch && req.method === "DELETE") {
          const id = noteDeleteMatch[1];
          const noteId = parseInt(noteDeleteMatch[2]);
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT notes FROM tasks WHERE id = ?")
            .get(id) as { notes: string | null } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const notes = task.notes ? JSON.parse(task.notes) : [];
          const filtered = notes.filter((n: any) => n.id !== noteId);
          db.prepare("UPDATE tasks SET notes = ? WHERE id = ?").run(JSON.stringify(filtered), id);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // POST /api/task/:id/attachment?project=xxx  (upload image as base64)
        const attachmentMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment$/);
        if (attachmentMatch && req.method === "POST") {
          const id = attachmentMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }

          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          await new Promise<void>((resolve) => req.on("end", resolve));
          let body: any;
          try {
            body = JSON.parse(Buffer.concat(chunks).toString());
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid JSON" }));
            return;
          }

          const db = getDb(projectParam);
          const task = db
            .prepare("SELECT attachments FROM tasks WHERE id = ?")
            .get(id) as { attachments: string | null } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const filename = (body.filename || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
          const ext = path.extname(filename) || ".png";
          const safeName = `${id}_${Date.now()}${ext}`;
          const filePath = path.resolve(IMAGES_DIR, safeName);

          const base64Data = body.data.replace(/^data:[^;]+;base64,/, "");
          fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

          const attachments = task.attachments ? JSON.parse(task.attachments) : [];
          attachments.push({
            filename: body.filename || "image.png",
            storedName: safeName,
            path: filePath,
            url: `/api/uploads/${safeName}`,
            size: fs.statSync(filePath).size,
            uploaded_at: new Date().toISOString(),
          });

          db.prepare("UPDATE tasks SET attachments = ? WHERE id = ?")
            .run(JSON.stringify(attachments), id);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true, attachment: attachments[attachments.length - 1] }));
          return;
        }

        // DELETE /api/task/:id/attachment/:filename?project=xxx
        const attachmentDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment\/([^/]+)$/);
        if (attachmentDeleteMatch && req.method === "DELETE") {
          const id = attachmentDeleteMatch[1];
          const storedName = decodeURIComponent(attachmentDeleteMatch[2]);
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "project query param required" }));
            return;
          }
          const db = getDb(projectParam);

          const task = db
            .prepare("SELECT attachments FROM tasks WHERE id = ?")
            .get(id) as { attachments: string | null } | undefined;

          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const attachments = task.attachments ? JSON.parse(task.attachments) : [];
          const idx = attachments.findIndex((a: any) => a.storedName === storedName);
          if (idx >= 0) {
            const removed = attachments.splice(idx, 1)[0];
            try { fs.unlinkSync(path.join(IMAGES_DIR, removed.storedName)); } catch { /* ok */ }
            db.prepare("UPDATE tasks SET attachments = ? WHERE id = ?")
              .run(JSON.stringify(attachments), id);
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // GET /api/uploads/:filename  (serve uploaded images)
        const uploadsMatch = pathname.match(/^\/api\/uploads\/([^/]+)$/);
        if (uploadsMatch && req.method === "GET") {
          const filename = decodeURIComponent(uploadsMatch[1]);
          const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = path.resolve(IMAGES_DIR, safeName);

          if (!filePath.startsWith(IMAGES_DIR)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ error: "Forbidden" }));
            return;
          }

          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const ext = path.extname(safeName).toLowerCase();
          const mimeTypes: Record<string, string> = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
          };
          res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.end(fs.readFileSync(filePath));
          return;
        }

        // ── Bitbucket PR Webhook ──────────────────────────────
        const WEBHOOK_LOG_MAX = 50;
        const webhookLog: Array<{
          ts: string;
          event: string;
          repo: string;
          prId: number;
          prUrl: string;
          status: string;
        }> = (globalThis as any).__webhookLog ??= [];

        if (pathname === "/api/webhook/bitbucket" && req.method === "POST") {
          const eventKey = req.headers["x-event-key"] as string || "";
          const body = await parseBody(req);

          // Only handle PR created/updated
          if (!eventKey.startsWith("pullrequest:")) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, skipped: true, reason: `unhandled event: ${eventKey}` }));
            return;
          }

          const pr = body?.pullrequest;
          const prUrl = pr?.links?.html?.href;
          const prId = pr?.id ?? 0;
          const repoSlug = body?.repository?.slug ?? "unknown";

          if (!prUrl) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "missing pullrequest.links.html.href" }));
            return;
          }

          // Respond immediately (Bitbucket has a 10s timeout)
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, event: eventKey, prUrl }));

          // Log the event
          const entry = {
            ts: new Date().toISOString(),
            event: eventKey,
            repo: repoSlug,
            prId,
            prUrl,
            status: "spawned",
          };
          webhookLog.unshift(entry);
          if (webhookLog.length > WEBHOOK_LOG_MAX) webhookLog.length = WEBHOOK_LOG_MAX;

          // Spawn claude review in background
          const jarvisDir = path.resolve(os.homedir(), "Dev", "jarvis.gerald");
          console.log(`[webhook] ${eventKey} → reviewing ${prUrl}`);

          const child = spawn("claude", ["-p", `/javis-review-pr ${prUrl}`], {
            cwd: jarvisDir,
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env, HOME: os.homedir() },
          });

          let stdout = "";
          let stderr = "";
          child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
          child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

          child.on("close", (code: number | null) => {
            entry.status = code === 0 ? "done" : `exit:${code}`;
            console.log(`[webhook] review finished (${entry.status}) for ${prUrl}`);
            if (stderr) console.error(`[webhook] stderr: ${stderr.slice(0, 500)}`);
            if (stdout) console.log(`[webhook] stdout (last 500): ${stdout.slice(-500)}`);
          });

          child.on("error", (err: Error) => {
            entry.status = `error: ${err.message}`;
            console.error(`[webhook] spawn error: ${err.message}`);
          });

          child.unref();
          return;
        }

        // GET /api/webhook/log — recent webhook events
        if (pathname === "/api/webhook/log" && req.method === "GET") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(webhookLog));
          return;
        }

        next();
      });
    },
  };
}
