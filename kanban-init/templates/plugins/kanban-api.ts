import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project-local DB: {project_root}/.claude/kanban.db
const DB_PATH =
  process.env.KANBAN_DB ||
  path.resolve(__dirname, "..", "..", ".claude", "kanban.db");

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

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

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
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN review_comments TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN reviewed_at TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN plan TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN implementation_notes TEXT`);
  } catch { /* column already exists */ }

  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN rank INTEGER NOT NULL DEFAULT 0`);
  } catch { /* column already exists */ }

  // 7-column pipeline: new columns
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN plan_review_comments TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN test_results TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN agent_log TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN current_agent TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN plan_review_count INTEGER NOT NULL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN impl_review_count INTEGER NOT NULL DEFAULT 0`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN planned_at TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN tested_at TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN level INTEGER NOT NULL DEFAULT 3`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN attachments TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN notes TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN decision_log TEXT`);
  } catch { /* column already exists */ }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN done_when TEXT`);
  } catch { /* column already exists */ }

  // Ensure images directory exists
  const imagesDir = path.resolve(path.dirname(DB_PATH), "kanban-images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

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

  _db = db;
  return db;
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
        // GET /api/info  (project directory name)
        if (req.url === "/api/info") {
          const projectName = path.basename(path.resolve(__dirname, "..", ".."));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ projectName }));
          return;
        }

        // GET /api/board?project=xxx
        if (req.url?.startsWith("/api/board")) {
          const url = new URL(req.url, "http://localhost");
          const project = url.searchParams.get("project");

          const db = getDb();
          {
            let tasks: Task[];
            if (project) {
              tasks = db
                .prepare("SELECT * FROM tasks WHERE project = ? ORDER BY rank, id")
                .all(project) as Task[];
            } else {
              tasks = db
                .prepare("SELECT * FROM tasks ORDER BY project, rank, id")
                .all() as Task[];
            }

            const projects = (
              db
                .prepare("SELECT DISTINCT project FROM tasks ORDER BY project")
                .all() as { project: string }[]
            ).map((r) => r.project);

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
          }
          return;
        }

        // GET /api/task/:id
        if (req.url?.match(/^\/api\/task\/\d+$/) && req.method === "GET") {
          const id = req.url.split("/").pop();
          const db = getDb();
          {
            const task = db
              .prepare("SELECT * FROM tasks WHERE id = ?")
              .get(id) as Task | undefined;

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(task));
          }
          return;
        }

        // PATCH /api/task/:id  (move status, edit)
        if (req.url?.match(/^\/api\/task\/\d+$/) && req.method === "PATCH") {
          const id = req.url.split("/").pop();
          const body = await parseBody(req);
          if (body.status !== undefined) body.status = normalizeStatus(body.status);
          const db = getDb();
          {
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
            if (body.title !== undefined) {
              sets.push("title = ?");
              values.push(body.title);
            }
            if (body.priority !== undefined) {
              sets.push("priority = ?");
              values.push(body.priority);
            }
            if (body.description !== undefined) {
              sets.push("description = ?");
              values.push(body.description);
            }
            if (body.plan !== undefined) {
              sets.push("plan = ?");
              values.push(body.plan);
            }
            if (body.implementation_notes !== undefined) {
              sets.push("implementation_notes = ?");
              values.push(body.implementation_notes);
            }
            if (body.tags !== undefined) {
              sets.push("tags = ?");
              values.push(
                typeof body.tags === "string"
                  ? body.tags
                  : JSON.stringify(body.tags)
              );
            }
            if (body.review_comments !== undefined) {
              sets.push("review_comments = ?");
              values.push(
                typeof body.review_comments === "string"
                  ? body.review_comments
                  : JSON.stringify(body.review_comments)
              );
            }
            if (body.plan_review_comments !== undefined) {
              sets.push("plan_review_comments = ?");
              values.push(
                typeof body.plan_review_comments === "string"
                  ? body.plan_review_comments
                  : JSON.stringify(body.plan_review_comments)
              );
            }
            if (body.test_results !== undefined) {
              sets.push("test_results = ?");
              values.push(
                typeof body.test_results === "string"
                  ? body.test_results
                  : JSON.stringify(body.test_results)
              );
            }
            if (body.agent_log !== undefined) {
              sets.push("agent_log = ?");
              values.push(
                typeof body.agent_log === "string"
                  ? body.agent_log
                  : JSON.stringify(body.agent_log)
              );
            }
            if (body.current_agent !== undefined) {
              sets.push("current_agent = ?");
              values.push(body.current_agent);
            }
            if (body.reviewed_at !== undefined) {
              sets.push("reviewed_at = ?");
              values.push(body.reviewed_at);
            }
            if (body.rank !== undefined) {
              sets.push("rank = ?");
              values.push(body.rank);
            }
            if (body.level !== undefined) {
              sets.push("level = ?");
              values.push(body.level);
            }
            if (body.decision_log !== undefined) {
              sets.push("decision_log = ?");
              values.push(body.decision_log);
            }
            if (body.done_when !== undefined) {
              sets.push("done_when = ?");
              values.push(body.done_when);
            }

            if (sets.length > 0) {
              values.push(id);
              db.prepare(
                `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`
              ).run(...values);
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          }
          return;
        }

        // PATCH /api/task/:id/reorder  (reorder within or across columns)
        if (
          req.url?.match(/^\/api\/task\/\d+\/reorder$/) &&
          req.method === "PATCH"
        ) {
          const id = parseInt(req.url.split("/")[3]);
          const body = await parseBody(req);
          if (body.status !== undefined) body.status = normalizeStatus(body.status);
          const db = getDb();
          {
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
              // Placing after a card (at the bottom)
              const above = db.prepare("SELECT rank FROM tasks WHERE id = ?").get(afterId) as { rank: number } | undefined;
              newRank = above ? above.rank + 1000 : 1000;
            } else if (beforeId) {
              // Placing before a card (at the top)
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
              // Empty column
              newRank = 1000;
            }

            db.prepare("UPDATE tasks SET rank = ? WHERE id = ?").run(newRank, id);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, rank: newRank }));
          }
          return;
        }

        // POST /api/task  (create new task)
        if (req.url === "/api/task" && req.method === "POST") {
          const body = await parseBody(req);
          const db = getDb();
          {
            const project =
              body.project ||
              path.basename(path.resolve(__dirname, "..", ".."));
            const title = body.title || "Untitled";
            const priority = body.priority || "medium";
            const description = body.description || null;
            const tags =
              body.tags !== undefined
                ? typeof body.tags === "string"
                  ? body.tags
                  : JSON.stringify(body.tags)
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
            res.end(
              JSON.stringify({ success: true, id: result.lastInsertRowid })
            );
          }
          return;
        }

        // POST /api/task/:id/review  (append a review comment & auto-transition)
        if (
          req.url?.match(/^\/api\/task\/\d+\/review$/) &&
          req.method === "POST"
        ) {
          const id = req.url.split("/")[3];
          const body = await parseBody(req);
          const db = getDb();
          {
            const task = db
              .prepare("SELECT review_comments, status, impl_review_count, level FROM tasks WHERE id = ?")
              .get(id) as { review_comments: string | null; status: string; impl_review_count: number; level: number } | undefined;

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }

            const comments = task.review_comments
              ? JSON.parse(task.review_comments)
              : [];
            const newComment = {
              reviewer: body.reviewer || "claude-review-agent",
              status: body.status,
              comment: body.comment,
              timestamp: new Date().toISOString(),
            };
            comments.push(newComment);

            // L2: impl_review -> done (approved), L3: impl_review -> test (approved)
            const approvedTarget = task.level <= 2 ? "done" : "test";
            const newStatus =
              body.status === "approved" ? approvedTarget : "impl";
            const sets = [
              "review_comments = ?",
              "reviewed_at = datetime('now')",
              "status = ?",
              "impl_review_count = ?",
            ];
            const vals: any[] = [
              JSON.stringify(comments),
              newStatus,
              task.impl_review_count + 1,
            ];

            if (newStatus === "test") {
              sets.push("tested_at = datetime('now')");
            } else if (newStatus === "done") {
              sets.push("completed_at = datetime('now')");
            }

            vals.push(id);
            db.prepare(
              `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`
            ).run(...vals);

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ success: true, newStatus, comment: newComment })
            );
          }
          return;
        }

        // POST /api/task/:id/plan-review  (plan review result)
        if (
          req.url?.match(/^\/api\/task\/\d+\/plan-review$/) &&
          req.method === "POST"
        ) {
          const id = req.url.split("/")[3];
          const body = await parseBody(req);
          const db = getDb();
          {
            const task = db
              .prepare("SELECT plan_review_comments, status, plan_review_count FROM tasks WHERE id = ?")
              .get(id) as { plan_review_comments: string | null; status: string; plan_review_count: number } | undefined;

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }

            const comments = task.plan_review_comments
              ? JSON.parse(task.plan_review_comments)
              : [];
            const newComment = {
              reviewer: body.reviewer || "plan-review-agent",
              status: body.status,
              comment: body.comment,
              timestamp: new Date().toISOString(),
            };
            comments.push(newComment);

            // plan_review -> impl (approved) or plan (changes_requested)
            const newStatus =
              body.status === "approved" ? "impl" : "plan";
            const sets = [
              "plan_review_comments = ?",
              "status = ?",
              "plan_review_count = ?",
            ];
            const vals: any[] = [
              JSON.stringify(comments),
              newStatus,
              task.plan_review_count + 1,
            ];

            vals.push(id);
            db.prepare(
              `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`
            ).run(...vals);

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ success: true, newStatus, comment: newComment })
            );
          }
          return;
        }

        // POST /api/task/:id/test-result  (test result)
        if (
          req.url?.match(/^\/api\/task\/\d+\/test-result$/) &&
          req.method === "POST"
        ) {
          const id = req.url.split("/")[3];
          const body = await parseBody(req);
          const db = getDb();
          {
            const task = db
              .prepare("SELECT test_results, status FROM tasks WHERE id = ?")
              .get(id) as { test_results: string | null; status: string } | undefined;

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }

            const results = task.test_results
              ? JSON.parse(task.test_results)
              : [];
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

            // test -> done (pass) or impl (fail)
            const newStatus =
              body.status === "pass" ? "done" : "impl";
            const sets = [
              "test_results = ?",
              "status = ?",
            ];
            const vals: any[] = [JSON.stringify(results), newStatus];

            if (newStatus === "done") {
              sets.push("completed_at = datetime('now')");
            }

            vals.push(id);
            db.prepare(
              `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`
            ).run(...vals);

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ success: true, newStatus, result: newResult })
            );
          }
          return;
        }

        // POST /api/task/:id/note  (add a user note)
        if (
          req.url?.match(/^\/api\/task\/\d+\/note$/) &&
          req.method === "POST"
        ) {
          const id = req.url.split("/")[3];
          const body = await parseBody(req);
          const db = getDb();
          {
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

            db.prepare("UPDATE tasks SET notes = ? WHERE id = ?")
              .run(JSON.stringify(notes), id);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true, note }));
          }
          return;
        }

        // DELETE /api/task/:id/note/:noteId  (delete a note)
        if (
          req.url?.match(/^\/api\/task\/\d+\/note\/\d+$/) &&
          req.method === "DELETE"
        ) {
          const parts = req.url.split("/");
          const id = parts[3];
          const noteId = parseInt(parts[5]);
          const db = getDb();
          {
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

            db.prepare("UPDATE tasks SET notes = ? WHERE id = ?")
              .run(JSON.stringify(filtered), id);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          }
          return;
        }

        // DELETE /api/task/:id  (delete task)
        if (req.url?.match(/^\/api\/task\/\d+$/) && req.method === "DELETE") {
          const id = req.url.split("/").pop();
          const db = getDb();
          {
            // Delete associated attachment files
            const task = db
              .prepare("SELECT attachments FROM tasks WHERE id = ?")
              .get(id) as { attachments: string | null } | undefined;
            if (task?.attachments) {
              try {
                const atts = JSON.parse(task.attachments);
                for (const a of atts) {
                  try { fs.unlinkSync(a.path); } catch { /* ok */ }
                }
              } catch { /* ok */ }
            }

            db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          }
          return;
        }

        // POST /api/task/:id/attachment  (upload image as base64)
        if (
          req.url?.match(/^\/api\/task\/\d+\/attachment$/) &&
          req.method === "POST"
        ) {
          const id = req.url.split("/")[3];
          // Increase body size limit for images
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

          const db = getDb();
          {
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
            const imagesDir = path.resolve(path.dirname(DB_PATH), "kanban-images");
            const filePath = path.resolve(imagesDir, safeName);

            // Decode base64 and save
            const base64Data = body.data.replace(/^data:[^;]+;base64,/, "");
            fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

            // Update attachments array
            const attachments = task.attachments
              ? JSON.parse(task.attachments)
              : [];
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
            res.end(JSON.stringify({
              success: true,
              attachment: attachments[attachments.length - 1],
            }));
          }
          return;
        }

        // DELETE /api/task/:id/attachment/:filename  (remove attachment)
        if (
          req.url?.match(/^\/api\/task\/\d+\/attachment\/[^/]+$/) &&
          req.method === "DELETE"
        ) {
          const parts = req.url.split("/");
          const id = parts[3];
          const storedName = decodeURIComponent(parts[5]);
          const db = getDb();
          {
            const task = db
              .prepare("SELECT attachments FROM tasks WHERE id = ?")
              .get(id) as { attachments: string | null } | undefined;

            if (!task) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }

            const attachments = task.attachments
              ? JSON.parse(task.attachments)
              : [];
            const idx = attachments.findIndex((a: any) => a.storedName === storedName);
            if (idx >= 0) {
              const removed = attachments.splice(idx, 1)[0];
              // Delete file
              try { fs.unlinkSync(removed.path); } catch { /* ok */ }
              db.prepare("UPDATE tasks SET attachments = ? WHERE id = ?")
                .run(JSON.stringify(attachments), id);
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          }
          return;
        }

        // GET /api/uploads/:filename  (serve uploaded images)
        if (req.url?.match(/^\/api\/uploads\/[^/]+$/) && req.method === "GET") {
          const filename = decodeURIComponent(req.url.split("/").pop()!);
          const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          const imagesDir = path.resolve(path.dirname(DB_PATH), "kanban-images");
          const filePath = path.resolve(imagesDir, safeName);

          // Prevent path traversal
          if (!filePath.startsWith(imagesDir)) {
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

        next();
      });
    },
  };
}
