import { spawn } from "child_process";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin, ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Cloudflare R2 ─────────────────────────────────────────────────────────────
let _r2: S3Client | null = null;

// All env reads are lazy (inside functions) to avoid ESM import-hoist / dotenv timing issues
function r2Bucket(): string { return process.env.CLOUDFLARE_R2_BUCKET_NAME || "cyanluna-kanban-images"; }
function r2PublicUrl(): string { return (process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/$/, ""); }

function getR2(): S3Client {
  if (_r2) return _r2;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 env vars missing (CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY)");
  }
  _r2 = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey } });
  return _r2;
}

async function uploadToR2(key: string, buffer: Buffer, contentType: string): Promise<void> {
  await getR2().send(new PutObjectCommand({ Bucket: r2Bucket(), Key: key, Body: buffer, ContentType: contentType }));
}

async function deleteFromR2(key: string): Promise<void> {
  try { await getR2().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key })); } catch { /* ok */ }
}

type Sql = ReturnType<typeof neon>;
const BOARD_STATUSES = ["todo", "plan", "plan_review", "impl", "impl_review", "test", "done"] as const;

// Typed query helper: returns T[]
async function q<T>(sql: Sql, text: string, params?: any[]): Promise<T[]> {
  return (await sql.query(text, params)) as unknown as T[];
}

function parseJsonArray(raw: string | null): any[] {
  if (!raw || raw === "null") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLastStatus(raw: string | null): string | null {
  const entries = parseJsonArray(raw);
  const last = entries[entries.length - 1];
  return typeof last?.status === "string" ? last.status : null;
}

function createEtag(parts: Array<string | null | undefined>): string {
  const raw = parts.map((part) => part ?? "").join("|");
  return `W/"${Buffer.from(raw).toString("base64url")}"`;
}

function etagMatches(header: string | string[] | undefined, etag: string): boolean {
  if (typeof header !== "string" || !header.trim()) return false;
  return header
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag);
}

function summarizeBoardTask(task: Task) {
  return {
    id: task.id,
    project: task.project,
    title: task.title,
    status: task.status,
    priority: task.priority,
    level: task.level,
    current_agent: task.current_agent,
    plan_review_count: task.plan_review_count,
    impl_review_count: task.impl_review_count,
    rank: task.rank,
    tags: task.tags,
    created_at: task.created_at,
    completed_at: task.completed_at,
    note_count: parseJsonArray(task.notes).length,
    last_review_status: getLastStatus(task.review_comments),
    last_plan_review_status: getLastStatus(task.plan_review_comments),
  };
}

function normalizeTimestamp(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

async function readBoardMeta(sql: Sql, projectParam: string | null) {
  if (projectParam) {
    const safe = sanitizeProject(projectParam);
    const [row] = await q<{ total: number | string; updated_at: string | null }>(sql, `
      SELECT COUNT(*)::int AS total, MAX(updated_at) AS updated_at
      FROM tasks
      WHERE project = $1
    `, [safe]);
    const total = Number(row?.total || 0);
    const updatedAt = normalizeTimestamp(row?.updated_at);
    return { total, updated_at: updatedAt, version: `${updatedAt || "0"}:${total}` };
  }

  const [row] = await q<{ total: number | string; updated_at: string | null }>(sql, `
    SELECT COUNT(*)::int AS total, MAX(updated_at) AS updated_at
    FROM tasks
  `);
  const total = Number(row?.total || 0);
  const updatedAt = normalizeTimestamp(row?.updated_at);
  return { total, updated_at: updatedAt, version: `${updatedAt || "0"}:${total}` };
}

async function readBoardCounts(sql: Sql, projectParam: string | null) {
  let rows: Array<{ status: string; total: number | string }>;
  if (projectParam) {
    const safe = sanitizeProject(projectParam);
    rows = await q(sql, `
      SELECT status, COUNT(*)::int AS total
      FROM tasks
      WHERE project = $1
      GROUP BY status
    `, [safe]);
  } else {
    rows = await q(sql, `
      SELECT status, COUNT(*)::int AS total
      FROM tasks
      GROUP BY status
    `);
  }

  const counts = Object.fromEntries(BOARD_STATUSES.map((status) => [status, 0])) as Record<string, number>;
  for (const row of rows) {
    if (BOARD_STATUSES.includes(row.status as typeof BOARD_STATUSES[number])) {
      counts[row.status] = Number(row.total || 0);
    }
  }
  return counts;
}

function sortBoardGroup<T extends { completed_at?: string | null; rank?: number; id?: number }>(status: string, tasks: T[]): T[] {
  const sorted = [...tasks];
  if (status === "done") {
    return sorted.sort((a, b) => {
      const completedOrder = String(b.completed_at || "").localeCompare(String(a.completed_at || ""));
      if (completedOrder !== 0) return completedOrder;
      return Number(a.rank || 0) - Number(b.rank || 0) || Number(a.id || 0) - Number(b.id || 0);
    });
  }
  return sorted.sort((a, b) =>
    Number(a.rank || 0) - Number(b.rank || 0) || Number(a.id || 0) - Number(b.id || 0)
  );
}

// Valid status transitions per pipeline level
function getTransitions(level: number): Record<string, string[]> {
  if (level === 1) {
    return { todo: ["impl"], impl: ["done"], done: [] };
  }
  if (level === 2) {
    return {
      todo:        ["plan"],
      plan:        ["impl", "todo"],
      impl:        ["impl_review"],
      impl_review: ["done", "impl"],
      done:        [],
    };
  }
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

const STATUS_ALIASES: Record<string, string> = {
  inprogress: "impl",
  review: "impl_review",
};

function normalizeStatus(s: string): string {
  return STATUS_ALIASES[s] || s;
}

function sanitizeProject(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// ── SSE broadcast ─────────────────────────────────────────────────────────────
const sseClients = new Set<import("http").ServerResponse>();

function broadcast() {
  for (const res of sseClients) {
    try { res.write("data: refresh\n\n"); }
    catch { sseClients.delete(res); }
  }
}

let _sql: Sql | null = null;
let _schemaReady: Promise<void> | null = null;

function getSql(): Sql {
  if (_sql) return _sql;
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or NEON_DATABASE_URL env var is required.\n" +
      "Create kanban-board/.env with: DATABASE_URL=postgresql://..."
    );
  }
  _sql = neon(connectionString);
  return _sql;
}

async function initializeSchema(sql: Sql): Promise<void> {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      project TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      description TEXT,
      plan TEXT,
      implementation_notes TEXT,
      tags TEXT,
      review_comments TEXT,
      plan_review_comments TEXT,
      test_results TEXT,
      agent_log TEXT,
      current_agent TEXT,
      plan_review_count INTEGER NOT NULL DEFAULT 0,
      impl_review_count INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 3,
      attachments TEXT,
      notes TEXT,
      decision_log TEXT,
      done_when TEXT,
      rank INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      started_at TIMESTAMPTZ,
      planned_at TIMESTAMPTZ,
      reviewed_at TIMESTAMPTZ,
      tested_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ
    )
  `);

  const migrations = [
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS review_comments TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS plan TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS implementation_notes TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rank INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS plan_review_comments TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS test_results TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS agent_log TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS current_agent TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS plan_review_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS impl_review_count INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_at TIMESTAMPTZ`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 3`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS decision_log TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS done_when TEXT`,
    `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,
  ];
  for (const m of migrations) await sql.query(m);

  await sql.query(`
    UPDATE tasks
    SET updated_at = COALESCE(updated_at, completed_at, tested_at, reviewed_at, planned_at, started_at, created_at, NOW())
    WHERE updated_at IS NULL
  `);

  await sql.query(`
    UPDATE tasks SET rank = sub.new_rank
    FROM (
      SELECT id,
        ROW_NUMBER() OVER (PARTITION BY project, status ORDER BY id) * 1000 AS new_rank
      FROM tasks WHERE rank = 0
    ) sub
    WHERE tasks.id = sub.id AND tasks.rank = 0
  `);
  await sql.query(`UPDATE tasks SET priority = 'high'      WHERE priority = '높음'`);
  await sql.query(`UPDATE tasks SET priority = 'medium'    WHERE priority = '중간'`);
  await sql.query(`UPDATE tasks SET priority = 'low'       WHERE priority = '낮음'`);
  await sql.query(`UPDATE tasks SET status = 'impl'        WHERE status = 'inprogress'`);
  await sql.query(`UPDATE tasks SET status = 'impl_review' WHERE status = 'review'`);
}

function ensureSchema(sql: Sql): Promise<void> {
  if (!_schemaReady) {
    _schemaReady = initializeSchema(sql).catch((err) => {
      console.error("[kanban] Schema init failed:", err.message);
      _schemaReady = null;
    });
  }
  return _schemaReady!;
}

async function renumberRanks(sql: Sql, project: string, status: string): Promise<void> {
  await sql.query(`
    UPDATE tasks SET rank = sub.new_rank
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY rank, id) * 1000 AS new_rank
      FROM tasks WHERE project = $1 AND status = $2
    ) sub
    WHERE tasks.id = sub.id
  `, [project, status]);
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
  updated_at: string | null;
}

interface Board {
  version?: string;
  updated_at?: string | null;
  total?: number;
  counts?: Partial<Record<typeof BOARD_STATUSES[number], number>>;
  todo: Task[];
  plan: Task[];
  plan_review: Task[];
  impl: Task[];
  impl_review: Task[];
  test: Task[];
  done: Task[];
  projects: string[];
}

export function kanbanApiPlugin(): Plugin {
  return {
    name: "kanban-api",
    configureServer(server: ViteDevServer) {
      const sql = getSql();
      ensureSchema(sql);

      function parseBody(req: any): Promise<any> {
        return new Promise((resolve) => {
          let body = "";
          req.on("data", (chunk: string) => (body += chunk));
          req.on("end", () => {
            try { resolve(JSON.parse(body)); }
            catch { resolve({}); }
          });
        });
      }

      server.middlewares.use(async (req, res, next) => {
        const reqUrl = new URL(req.url || "/", "http://localhost");
        const pathname = reqUrl.pathname;

        if (pathname.startsWith("/api/")) {
          await ensureSchema(sql);
        }

        // GET /api/events — SSE stream
        if (pathname === "/api/events" && req.method === "GET") {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.writeHead(200);
          res.write(": connected\n\n");
          sseClients.add(res);
          const keepAlive = setInterval(() => {
            try { res.write(": ping\n\n"); }
            catch { clearInterval(keepAlive); sseClients.delete(res); }
          }, 30000);
          req.on("close", () => { clearInterval(keepAlive); sseClients.delete(res); });
          return;
        }

        // GET /api/info
        if (pathname === "/api/info") {
          const projectName = path.basename(path.resolve(__dirname, "..", ".."));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ projectName }));
          return;
        }

        if (pathname === "/api/board/version" && req.method === "GET") {
          const projectParam = reqUrl.searchParams.get("project");
          const meta = await readBoardMeta(sql, projectParam);
          const etag = createEtag(["board-version", projectParam || "*", meta.version]);
          res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
          res.setHeader("ETag", etag);
          if (etagMatches(req.headers["if-none-match"], etag)) {
            res.statusCode = 304;
            res.end();
            return;
          }
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            project: projectParam || null,
            ...meta,
          }));
          return;
        }

        // GET /api/board?project=xxx[&summary=true]
        if (pathname === "/api/board") {
          const projectParam = reqUrl.searchParams.get("project");
          const summary = reqUrl.searchParams.get("summary") === "true";
          const compactBoard = summary && reqUrl.searchParams.get("compact") === "board";
          const todoLimit = compactBoard ? Math.max(0, Number.parseInt(reqUrl.searchParams.get("todo_limit") || "10", 10) || 10) : null;
          const doneLimit = compactBoard ? Math.max(0, Number.parseInt(reqUrl.searchParams.get("done_limit") || "10", 10) || 10) : null;
          const fields = summary
            ? `id, project, title, status, priority, level, current_agent,
               plan_review_count, impl_review_count, rank, tags,
               created_at, completed_at,
               review_comments, plan_review_comments, notes`
            : `*`;
          const meta = await readBoardMeta(sql, projectParam);
          const counts = await readBoardCounts(sql, projectParam);
          const projectsMeta = projectParam ? await readBoardMeta(sql, null) : meta;
          const etag = createEtag([
            "board",
            summary ? "summary" : "full",
            compactBoard ? "compact-board" : "full-board",
            projectParam || "*",
            compactBoard ? String(todoLimit) : "",
            compactBoard ? String(doneLimit) : "",
            meta.version,
            projectsMeta.version,
          ]);
          res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
          res.setHeader("ETag", etag);
          if (etagMatches(req.headers["if-none-match"], etag)) {
            res.statusCode = 304;
            res.end();
            return;
          }

          const projectRows = await q<{ project: string }>(sql,
            "SELECT DISTINCT project FROM tasks ORDER BY project"
          );
          const projects = projectRows.map((r) => r.project);

          let tasks: Task[];
          if (projectParam) {
            const safe = sanitizeProject(projectParam);
            tasks = await q<Task>(sql,
              `SELECT ${fields} FROM tasks WHERE project = $1 ORDER BY rank, id`, [safe]
            );
          } else {
            tasks = await q<Task>(sql, `SELECT ${fields} FROM tasks ORDER BY rank, id`);
          }

          const boardTasks = summary ? tasks.map(summarizeBoardTask) : tasks;

          const grouped = new Map<string, any[]>();
          for (const t of boardTasks) {
            const arr = grouped.get(t.status);
            if (arr) arr.push(t);
            else grouped.set(t.status, [t]);
          }
          const groupedBoard = Object.fromEntries(
            BOARD_STATUSES.map((status) => {
              const tasksForStatus = sortBoardGroup(status, grouped.get(status) || []);
              if (compactBoard && status === "todo") {
                return [status, tasksForStatus.slice(0, todoLimit ?? 10)];
              }
              if (compactBoard && status === "done") {
                return [status, tasksForStatus.slice(0, doneLimit ?? 10)];
              }
              return [status, tasksForStatus];
            })
          );
          const board: Board = {
            version: meta.version,
            updated_at: meta.updated_at,
            total: meta.total,
            counts,
            todo: groupedBoard.todo || [],
            plan: groupedBoard.plan || [],
            plan_review: groupedBoard.plan_review || [],
            impl: groupedBoard.impl || [],
            impl_review: groupedBoard.impl_review || [],
            test: groupedBoard.test || [],
            done: groupedBoard.done || [],
            projects,
          };

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(board));
          return;
        }

        // /api/task/:id
        const taskMatch = pathname.match(/^\/api\/task\/(\d+)$/);
        if (taskMatch) {
          const id = taskMatch[1];
          const projectParam = reqUrl.searchParams.get("project");

          // GET — look up by ID only; project param is ignored for reads
          // (migrated tasks may have project names that differ from sanitized form)
          if (req.method === "GET") {
            const ALLOWED_FIELDS = new Set([
              "id","project","title","status","priority","description","plan",
              "implementation_notes","tags","review_comments","plan_review_comments",
              "test_results","agent_log","current_agent","plan_review_count",
              "impl_review_count","level","attachments","notes","decision_log",
              "done_when","rank","created_at","started_at","planned_at",
              "reviewed_at","tested_at","completed_at","updated_at",
            ]);
            const fieldsParam = reqUrl.searchParams.get("fields");
            const fields = fieldsParam
              ? ["id", "project", "status",
                  ...fieldsParam.split(",").map(f => f.trim()).filter(f => ALLOWED_FIELDS.has(f))
                ].filter((f, i, a) => a.indexOf(f) === i).join(", ")
              : "*";
            const rows = await q<Task>(sql, `SELECT ${fields} FROM tasks WHERE id = $1`, [id]);
            if (!rows[0]) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: "Not found" }));
              return;
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(rows[0]));
            return;
          }

          // PATCH
          if (req.method === "PATCH") {
            if (!projectParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "project query param required" }));
              return;
            }
            const safe = sanitizeProject(projectParam);
            const body = await parseBody(req);
            if (body.status !== undefined) body.status = normalizeStatus(body.status);

            if (body.status !== undefined) {
              const [task] = await q<{ status: string; level: number }>(sql,
                "SELECT status, level FROM tasks WHERE id = $1", [id]
              );
              if (task) {
                const allowed = getTransitions(task.level)[task.status];
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
            const vals: any[] = [];
            let p = 1;

            if (body.status !== undefined) {
              sets.push(`status = $${p++}`); vals.push(body.status);
              if (body.status === "plan")             sets.push("started_at = COALESCE(started_at, NOW())");
              else if (body.status === "plan_review") sets.push("planned_at = NOW()");
              else if (body.status === "test")        sets.push("tested_at = NOW()");
              else if (body.status === "done")        sets.push("completed_at = NOW()");
              else if (body.status === "todo")        sets.push("started_at = NULL, planned_at = NULL, completed_at = NULL, reviewed_at = NULL, tested_at = NULL");
            }
            const j = (v: any) => typeof v === "string" ? v : JSON.stringify(v);
            if (body.title !== undefined)       { sets.push(`title = $${p++}`); vals.push(body.title); }
            if (body.priority !== undefined)    { sets.push(`priority = $${p++}`); vals.push(body.priority); }
            if (body.description !== undefined) { sets.push(`description = $${p++}`); vals.push(body.description); }
            if (body.plan !== undefined)        { sets.push(`plan = $${p++}`); vals.push(body.plan); }
            if (body.implementation_notes !== undefined) { sets.push(`implementation_notes = $${p++}`); vals.push(body.implementation_notes); }
            if (body.tags !== undefined)              { sets.push(`tags = $${p++}`); vals.push(j(body.tags)); }
            if (body.review_comments !== undefined)   { sets.push(`review_comments = $${p++}`); vals.push(j(body.review_comments)); }
            if (body.plan_review_comments !== undefined) { sets.push(`plan_review_comments = $${p++}`); vals.push(j(body.plan_review_comments)); }
            if (body.test_results !== undefined)  { sets.push(`test_results = $${p++}`); vals.push(j(body.test_results)); }
            if (body.agent_log !== undefined)     { sets.push(`agent_log = $${p++}`); vals.push(j(body.agent_log)); }
            if (body.current_agent !== undefined) { sets.push(`current_agent = $${p++}`); vals.push(body.current_agent); }
            if (body.reviewed_at !== undefined)   { sets.push(`reviewed_at = $${p++}`); vals.push(body.reviewed_at); }
            if (body.rank !== undefined)          { sets.push(`rank = $${p++}`); vals.push(body.rank); }
            if (body.level !== undefined)         { sets.push(`level = $${p++}`); vals.push(body.level); }
            if (body.decision_log !== undefined)  { sets.push(`decision_log = $${p++}`); vals.push(body.decision_log); }
            if (body.done_when !== undefined)     { sets.push(`done_when = $${p++}`); vals.push(body.done_when); }

            if (sets.length > 0) {
              sets.push("updated_at = NOW()");
              vals.push(id, safe);
              await sql.query(
                `UPDATE tasks SET ${sets.join(", ")} WHERE id = $${p++} AND project = $${p}`,
                vals
              );
            }

            res.setHeader("Content-Type", "application/json");
            broadcast();
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // DELETE
          if (req.method === "DELETE") {
            if (!projectParam) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "project query param required" }));
              return;
            }
            const safe = sanitizeProject(projectParam);
            const [task] = await q<{ attachments: string | null }>(sql,
              "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]
            );
            if (task?.attachments) {
              try {
                for (const a of JSON.parse(task.attachments)) {
                  await deleteFromR2(a.storedName);
                }
              } catch { /* ok */ }
            }
            await sql.query("DELETE FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
            res.setHeader("Content-Type", "application/json");
            broadcast();
            res.end(JSON.stringify({ success: true }));
            return;
          }
        }

        // PATCH /api/task/:id/reorder
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

          const [task] = await q<Task>(sql, "SELECT * FROM tasks WHERE id = $1", [id]);
          if (!task) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Not found" }));
            return;
          }

          const targetStatus = body.status || task.status;

          if (targetStatus !== task.status) {
            const allowed = getTransitions(task.level)[task.status];
            if (allowed && !allowed.includes(targetStatus)) {
              res.statusCode = 400;
              res.end(JSON.stringify({
                error: `Invalid transition: ${task.status} -> ${targetStatus} (L${task.level})`,
                allowed,
              }));
              return;
            }
            const sets = [`status = $1`];
            if (targetStatus === "plan")             sets.push("started_at = COALESCE(started_at, NOW())");
            else if (targetStatus === "plan_review")  sets.push("planned_at = NOW()");
            else if (targetStatus === "test")         sets.push("tested_at = NOW()");
            else if (targetStatus === "done")         sets.push("completed_at = NOW()");
            else if (targetStatus === "todo")         sets.push("started_at = NULL, planned_at = NULL, completed_at = NULL, reviewed_at = NULL, tested_at = NULL");
            await sql.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $2`, [targetStatus, id]);
          }

          const afterId = body.afterId as number | null;
          const beforeId = body.beforeId as number | null;
          let newRank: number;

          if (afterId && beforeId) {
            const [above] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
            const [below] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
            if (above && below) {
              newRank = Math.floor((above.rank + below.rank) / 2);
              if (newRank === above.rank) {
                await renumberRanks(sql, task.project, targetStatus);
                const [a2] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
                const [b2] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
                newRank = Math.floor((a2.rank + b2.rank) / 2);
              }
            } else { newRank = 1000; }
          } else if (afterId) {
            const [above] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
            newRank = above ? above.rank + 1000 : 1000;
          } else if (beforeId) {
            const [below] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
            if (below) {
              newRank = Math.floor(below.rank / 2);
              if (newRank === 0) {
                await renumberRanks(sql, task.project, targetStatus);
                const [b2] = await q<{ rank: number }>(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
                newRank = Math.floor(b2.rank / 2);
              }
            } else { newRank = 1000; }
          } else { newRank = 1000; }

          await sql.query("UPDATE tasks SET rank = $1, updated_at = NOW() WHERE id = $2", [newRank, id]);

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, rank: newRank }));
          return;
        }

        // POST /api/task
        if (pathname === "/api/task" && req.method === "POST") {
          const body = await parseBody(req);
          if (!body.project) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "body.project is required" }));
            return;
          }
          const safe = sanitizeProject(body.project);
          const title = body.title || "Untitled";
          const priority = body.priority || "medium";
          const description = body.description || null;
          const tags = body.tags !== undefined
            ? (typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags))
            : null;
          const level = body.level !== undefined ? parseInt(body.level) || 3 : 3;

          const [maxRow] = await q<{ maxrank: number | null }>(sql,
            "SELECT MAX(rank) AS maxrank FROM tasks WHERE project = $1 AND status = 'todo'", [safe]
          );
          const rank = (maxRow?.maxrank ?? 0) + 1000;

          const [row] = await q<{ id: number }>(sql,
            `INSERT INTO tasks (project, title, priority, description, tags, rank, level)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [safe, title, priority, description, tags, rank, level]
          );

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, id: row.id }));
          return;
        }

        // POST /api/task/:id/review
        const reviewMatch = pathname.match(/^\/api\/task\/(\d+)\/review$/);
        if (reviewMatch && req.method === "POST") {
          const id = reviewMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);
          const body = await parseBody(req);

          const [task] = await q<{ review_comments: string | null; impl_review_count: number; level: number }>(sql,
            "SELECT review_comments, impl_review_count, level FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const comments = task.review_comments ? JSON.parse(task.review_comments) : [];
          const newComment = { reviewer: body.reviewer || "claude-review-agent", status: body.status, comment: body.comment, timestamp: new Date().toISOString() };
          comments.push(newComment);

          const approvedTarget = task.level <= 2 ? "done" : "test";
          const newStatus = body.status === "approved" ? approvedTarget : "impl";
          let updateQ = `UPDATE tasks SET review_comments = $1, reviewed_at = NOW(), updated_at = NOW(), status = $2, impl_review_count = $3`;
          const vals: any[] = [JSON.stringify(comments), newStatus, task.impl_review_count + 1];
          if (newStatus === "test") updateQ += ", tested_at = NOW()";
          else if (newStatus === "done") updateQ += ", completed_at = NOW()";
          await sql.query(updateQ + " WHERE id = $4 AND project = $5", [...vals, id, safe]);

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, newStatus, comment: newComment }));
          return;
        }

        // POST /api/task/:id/plan-review
        const planReviewMatch = pathname.match(/^\/api\/task\/(\d+)\/plan-review$/);
        if (planReviewMatch && req.method === "POST") {
          const id = planReviewMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);
          const body = await parseBody(req);

          const [task] = await q<{ plan_review_comments: string | null; plan_review_count: number }>(sql,
            "SELECT plan_review_comments, plan_review_count FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const comments = task.plan_review_comments ? JSON.parse(task.plan_review_comments) : [];
          const newComment = { reviewer: body.reviewer || "plan-review-agent", status: body.status, comment: body.comment, timestamp: new Date().toISOString() };
          comments.push(newComment);

          const newStatus = body.status === "approved" ? "impl" : "plan";
          await sql.query(
            "UPDATE tasks SET plan_review_comments = $1, updated_at = NOW(), status = $2, plan_review_count = $3 WHERE id = $4 AND project = $5",
            [JSON.stringify(comments), newStatus, task.plan_review_count + 1, id, safe]
          );

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, newStatus, comment: newComment }));
          return;
        }

        // POST /api/task/:id/test-result
        const testResultMatch = pathname.match(/^\/api\/task\/(\d+)\/test-result$/);
        if (testResultMatch && req.method === "POST") {
          const id = testResultMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);
          const body = await parseBody(req);

          const [task] = await q<{ test_results: string | null }>(sql,
            "SELECT test_results FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const results = task.test_results ? JSON.parse(task.test_results) : [];
          const newResult = { tester: body.tester || "test-runner-agent", status: body.status, lint: body.lint || null, build: body.build || null, tests: body.tests || null, comment: body.comment || null, timestamp: new Date().toISOString() };
          results.push(newResult);

          const newStatus = body.status === "pass" ? "done" : "impl";
          let updateQ = `UPDATE tasks SET test_results = $1, updated_at = NOW(), status = $2`;
          if (newStatus === "done") updateQ += ", completed_at = NOW()";
          await sql.query(updateQ + " WHERE id = $3 AND project = $4", [JSON.stringify(results), newStatus, id, safe]);

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, newStatus, result: newResult }));
          return;
        }

        // POST /api/task/:id/note
        const noteMatch = pathname.match(/^\/api\/task\/(\d+)\/note$/);
        if (noteMatch && req.method === "POST") {
          const id = noteMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);
          const body = await parseBody(req);

          const [task] = await q<{ notes: string | null }>(sql,
            "SELECT notes FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const notes = task.notes ? JSON.parse(task.notes) : [];
          const note = { id: Date.now(), text: body.text || "", author: body.author || "user", timestamp: new Date().toISOString() };
          notes.push(note);

          await sql.query("UPDATE tasks SET notes = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(notes), id, safe]);
          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, note }));
          return;
        }

        // DELETE /api/task/:id/note/:noteId
        const noteDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/note\/(\d+)$/);
        if (noteDeleteMatch && req.method === "DELETE") {
          const id = noteDeleteMatch[1];
          const noteId = parseInt(noteDeleteMatch[2]);
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);

          const [task] = await q<{ notes: string | null }>(sql,
            "SELECT notes FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const notes = (task.notes ? JSON.parse(task.notes) : []).filter((n: any) => n.id !== noteId);
          await sql.query("UPDATE tasks SET notes = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(notes), id, safe]);
          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // POST /api/task/:id/attachment
        const attachmentMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment$/);
        if (attachmentMatch && req.method === "POST") {
          const id = attachmentMatch[1];
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);

          const chunks: Buffer[] = [];
          req.on("data", (chunk: Buffer) => chunks.push(chunk));
          await new Promise<void>((resolve) => req.on("end", resolve));
          let body: any;
          try { body = JSON.parse(Buffer.concat(chunks).toString()); }
          catch { res.statusCode = 400; res.end(JSON.stringify({ error: "Invalid JSON" })); return; }

          const [task] = await q<{ attachments: string | null }>(sql,
            "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const filename = (body.filename || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
          const ext = path.extname(filename) || ".png";
          const safeName = `${id}_${Date.now()}${ext}`;
          const mimeTypes: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml" };
          const contentType = mimeTypes[ext.toLowerCase()] || "application/octet-stream";
          const buffer = Buffer.from(body.data.replace(/^data:[^;]+;base64,/, ""), "base64");
          await uploadToR2(safeName, buffer, contentType);

          const attachments = task.attachments ? JSON.parse(task.attachments) : [];
          attachments.push({ filename: body.filename || "image.png", storedName: safeName, url: `${r2PublicUrl()}/${safeName}`, size: buffer.byteLength, uploaded_at: new Date().toISOString() });
          await sql.query("UPDATE tasks SET attachments = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(attachments), id, safe]);

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true, attachment: attachments[attachments.length - 1] }));
          return;
        }

        // DELETE /api/task/:id/attachment/:filename
        const attachmentDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment\/([^/]+)$/);
        if (attachmentDeleteMatch && req.method === "DELETE") {
          const id = attachmentDeleteMatch[1];
          const storedName = decodeURIComponent(attachmentDeleteMatch[2]);
          const projectParam = reqUrl.searchParams.get("project");
          if (!projectParam) { res.statusCode = 400; res.end(JSON.stringify({ error: "project query param required" })); return; }
          const safe = sanitizeProject(projectParam);

          const [task] = await q<{ attachments: string | null }>(sql,
            "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]
          );
          if (!task) { res.statusCode = 404; res.end(JSON.stringify({ error: "Not found" })); return; }

          const attachments = task.attachments ? JSON.parse(task.attachments) : [];
          const idx = attachments.findIndex((a: any) => a.storedName === storedName);
          if (idx >= 0) {
            const [removed] = attachments.splice(idx, 1);
            await deleteFromR2(removed.storedName);
            await sql.query("UPDATE tasks SET attachments = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(attachments), id, safe]);
          }

          res.setHeader("Content-Type", "application/json");
          broadcast();
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // GET /api/uploads/:filename — redirect to R2 public URL
        const uploadsMatch = pathname.match(/^\/api\/uploads\/([^/]+)$/);
        if (uploadsMatch && req.method === "GET") {
          const safeName = decodeURIComponent(uploadsMatch[1]).replace(/[^a-zA-Z0-9._-]/g, "_");
          res.statusCode = 302;
          res.setHeader("Location", `${r2PublicUrl()}/${safeName}`);
          res.end();
          return;
        }

        // ── Bitbucket PR Webhook ──────────────────────────────
        const webhookLog: Array<{ ts: string; event: string; repo: string; prId: number; prUrl: string; status: string }> =
          (globalThis as any).__webhookLog ??= [];

        if (pathname === "/api/webhook/bitbucket" && req.method === "POST") {
          const eventKey = req.headers["x-event-key"] as string || "";
          const body = await parseBody(req);

          if (!eventKey.startsWith("pullrequest:")) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true, skipped: true, reason: `unhandled event: ${eventKey}` }));
            return;
          }

          const pr = body?.pullrequest;
          const prUrl = pr?.links?.html?.href;
          if (!prUrl) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: false, error: "missing pullrequest.links.html.href" }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true, event: eventKey, prUrl }));

          const entry = { ts: new Date().toISOString(), event: eventKey, repo: body?.repository?.slug ?? "unknown", prId: pr?.id ?? 0, prUrl, status: "spawned" };
          webhookLog.unshift(entry);
          if (webhookLog.length > 50) webhookLog.length = 50;

          const child = spawn("claude", ["-p", `/javis-review-pr ${prUrl}`], {
            cwd: path.resolve(os.homedir(), "Dev", "jarvis.gerald"),
            detached: true, stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env, HOME: os.homedir() },
          });
          let stdout = "", stderr = "";
          child.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
          child.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
          child.on("close", (code: number | null) => {
            entry.status = code === 0 ? "done" : `exit:${code}`;
            if (stderr) console.error(`[webhook] stderr: ${stderr.slice(0, 500)}`);
            if (stdout) console.log(`[webhook] stdout: ${stdout.slice(-500)}`);
          });
          child.on("error", (err: Error) => { entry.status = `error: ${err.message}`; });
          child.unref();
          return;
        }

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
