import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Project-local DB: {project_root}/.claude/kanban.db
const DB_PATH =
  process.env.KANBAN_DB ||
  path.resolve(__dirname, "..", "..", ".claude", "kanban.db");

function getDb(): Database.Database {
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
  created_at: string;
  started_at: string | null;
  reviewed_at: string | null;
  completed_at: string | null;
}

interface Board {
  todo: Task[];
  inprogress: Task[];
  review: Task[];
  done: Task[];
  projects: string[];
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
          try {
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

            const board: Board = {
              todo: tasks.filter((t) => t.status === "todo"),
              inprogress: tasks.filter((t) => t.status === "inprogress"),
              review: tasks.filter((t) => t.status === "review"),
              done: tasks.filter((t) => t.status === "done"),
              projects,
            };

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(board));
          } finally {
            db.close();
          }
          return;
        }

        // GET /api/task/:id
        if (req.url?.match(/^\/api\/task\/\d+$/) && req.method === "GET") {
          const id = req.url.split("/").pop();
          const db = getDb();
          try {
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
          } finally {
            db.close();
          }
          return;
        }

        // PATCH /api/task/:id  (move status, edit)
        if (req.url?.match(/^\/api\/task\/\d+$/) && req.method === "PATCH") {
          const id = req.url.split("/").pop();
          const body = await parseBody(req);
          const db = getDb();
          try {
            const sets: string[] = [];
            const values: any[] = [];

            if (body.status !== undefined) {
              sets.push("status = ?");
              values.push(body.status);
              if (body.status === "inprogress") {
                sets.push("started_at = datetime('now')");
              } else if (body.status === "review") {
                sets.push("reviewed_at = NULL");
              } else if (body.status === "done") {
                sets.push("completed_at = datetime('now')");
              } else if (body.status === "todo") {
                sets.push("started_at = NULL");
                sets.push("completed_at = NULL");
                sets.push("reviewed_at = NULL");
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
            if (body.reviewed_at !== undefined) {
              sets.push("reviewed_at = ?");
              values.push(body.reviewed_at);
            }
            if (body.rank !== undefined) {
              sets.push("rank = ?");
              values.push(body.rank);
            }

            if (sets.length > 0) {
              values.push(id);
              db.prepare(
                `UPDATE tasks SET ${sets.join(", ")} WHERE id = ?`
              ).run(...values);
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: true }));
          } finally {
            db.close();
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
          const db = getDb();
          try {
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

            // Update status if changed
            if (targetStatus !== task.status) {
              const sets: string[] = ["status = ?"];
              const vals: any[] = [targetStatus];
              if (targetStatus === "inprogress") {
                sets.push("started_at = datetime('now')");
              } else if (targetStatus === "review") {
                sets.push("reviewed_at = NULL");
              } else if (targetStatus === "done") {
                sets.push("completed_at = datetime('now')");
              } else if (targetStatus === "todo") {
                sets.push("started_at = NULL");
                sets.push("completed_at = NULL");
                sets.push("reviewed_at = NULL");
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
          } finally {
            db.close();
          }
          return;
        }

        // POST /api/task  (create new task)
        if (req.url === "/api/task" && req.method === "POST") {
          const body = await parseBody(req);
          const db = getDb();
          try {
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

            const maxRankRow = db
              .prepare("SELECT MAX(rank) as maxRank FROM tasks WHERE project = ? AND status = 'todo'")
              .get(project) as { maxRank: number | null } | undefined;
            const rank = (maxRankRow?.maxRank ?? 0) + 1000;

            const result = db
              .prepare(
                `INSERT INTO tasks (project, title, priority, description, tags, rank)
                 VALUES (?, ?, ?, ?, ?, ?)`
              )
              .run(project, title, priority, description, tags, rank);

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ success: true, id: result.lastInsertRowid })
            );
          } finally {
            db.close();
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
          try {
            const task = db
              .prepare("SELECT review_comments FROM tasks WHERE id = ?")
              .get(id) as { review_comments: string | null } | undefined;

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

            const newStatus =
              body.status === "approved" ? "done" : "inprogress";
            const sets = [
              "review_comments = ?",
              "reviewed_at = datetime('now')",
              "status = ?",
            ];
            const vals: any[] = [JSON.stringify(comments), newStatus];

            if (newStatus === "done") {
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
          } finally {
            db.close();
          }
          return;
        }

        next();
      });
    },
  };
}
