import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { neon } from "@neondatabase/serverless";
import { createHash, timingSafeEqual } from "crypto";
import path from "path";

let sqlClient = null;
let schemaReady = null;
let r2Client = null;
const BOARD_STATUSES = ["todo", "plan", "plan_review", "impl", "impl_review", "test", "done"];

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (!rawName) continue;
    cookies[rawName] = decodeURIComponent(rest.join("=") || "");
  }
  return cookies;
}

function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
}

function getAuthConfig(url) {
  const tokenHash = String(
    process.env.KANBAN_AUTH_TOKEN_SHA256 ||
    process.env.KANBAN_AUTH_SHA256 ||
    "",
  ).trim().toLowerCase();
  const hostname = String(url.hostname || "").toLowerCase();
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const allowLocalBypass = isTruthy(process.env.KANBAN_ALLOW_INSECURE_LOCAL_DEV ?? "1");
  const authRequired = tokenHash.length > 0;
  const authDisabled = !authRequired && isLocalhost && allowLocalBypass;
  const authMisconfigured = !authRequired && !authDisabled;

  return {
    tokenHash,
    authRequired,
    authDisabled,
    authMisconfigured,
  };
}

function getPresentedToken(req) {
  const headerToken = req.headers["x-kanban-auth"];
  if (typeof headerToken === "string" && headerToken.trim()) {
    return headerToken.trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.kanban_auth) {
    return cookies.kanban_auth;
  }
  return "";
}

function setAuthCookie(res, token, secure) {
  const parts = [
    `kanban_auth=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=2592000",
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearAuthCookie(res, secure) {
  const parts = [
    "kanban_auth=",
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) {
    parts.push("Secure");
  }
  res.setHeader("Set-Cookie", parts.join("; "));
}

function authenticateRequest(req, url) {
  const config = getAuthConfig(url);
  if (config.authDisabled) {
    return { ok: true, authRequired: false, mode: "disabled_local", source: "local_bypass" };
  }
  if (config.authMisconfigured) {
    return {
      ok: false,
      authRequired: true,
      mode: "misconfigured",
      statusCode: 503,
      error: "Authentication is required but KANBAN_AUTH_TOKEN_SHA256 is not configured",
      reason: "token_hash_missing",
    };
  }

  const token = getPresentedToken(req);
  if (!token) {
    return {
      ok: false,
      authRequired: true,
      mode: "required",
      statusCode: 401,
      error: "Authentication required",
      reason: "missing_token",
    };
  }

  const providedHash = sha256(token);
  const expected = Buffer.from(config.tokenHash, "hex");
  const actual = Buffer.from(providedHash, "hex");
  const valid = expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
  if (!valid) {
    return {
      ok: false,
      authRequired: true,
      mode: "required",
      statusCode: 403,
      error: "Invalid shared token",
      reason: "invalid_token",
    };
  }

  const source = typeof req.headers["x-kanban-auth"] === "string" ? "header" : "cookie";
  return { ok: true, authRequired: true, mode: "required", source };
}

function sanitizeProject(name) {
  return String(name || "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeStatus(status) {
  if (status === "inprogress") return "impl";
  if (status === "review") return "impl_review";
  return status;
}

function getTransitions(level) {
  if (level === 1) {
    return { todo: ["impl"], impl: ["done"], done: [] };
  }
  if (level === 2) {
    return {
      todo: ["plan"],
      plan: ["impl", "todo"],
      impl: ["impl_review"],
      impl_review: ["done", "impl"],
      done: [],
    };
  }
  return {
    todo: ["plan"],
    plan: ["plan_review", "todo"],
    plan_review: ["impl", "plan"],
    impl: ["impl_review"],
    impl_review: ["test", "impl"],
    test: ["done", "impl"],
    done: [],
  };
}

function getSql() {
  if (sqlClient) return sqlClient;
  const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or NEON_DATABASE_URL is required");
  }
  sqlClient = neon(connectionString);
  return sqlClient;
}

async function q(sql, text, params = []) {
  return (await sql.query(text, params));
}

function parseJsonArray(raw) {
  if (!raw || raw === "null") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getLastStatus(raw) {
  const entries = parseJsonArray(raw);
  const last = entries[entries.length - 1];
  return typeof last?.status === "string" ? last.status : null;
}

function createEtag(parts) {
  const hash = createHash("sha1").update(parts.join("|")).digest("hex");
  return `W/"${hash}"`;
}

function etagMatches(req, etag) {
  const header = req.headers["if-none-match"];
  if (typeof header !== "string" || !header.trim()) return false;
  return header
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || value === etag);
}

function summarizeBoardTask(task) {
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

function normalizeTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

async function readBoardMeta(sql, projectParam) {
  if (projectParam) {
    const safe = sanitizeProject(projectParam);
    const [row] = await q(sql, `
      SELECT COUNT(*)::int AS total, MAX(updated_at) AS updated_at
      FROM tasks
      WHERE project = $1
    `, [safe]);
    const total = Number(row?.total || 0);
    const updatedAt = normalizeTimestamp(row?.updated_at);
    return { total, updated_at: updatedAt, version: `${updatedAt || "0"}:${total}` };
  }

  const [row] = await q(sql, `
    SELECT COUNT(*)::int AS total, MAX(updated_at) AS updated_at
    FROM tasks
  `);
  const total = Number(row?.total || 0);
  const updatedAt = normalizeTimestamp(row?.updated_at);
  return { total, updated_at: updatedAt, version: `${updatedAt || "0"}:${total}` };
}

async function readBoardCounts(sql, projectParam) {
  let rows;
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

  const counts = Object.fromEntries(BOARD_STATUSES.map((status) => [status, 0]));
  for (const row of rows || []) {
    if (BOARD_STATUSES.includes(row.status)) {
      counts[row.status] = Number(row.total || 0);
    }
  }
  return counts;
}

function sortBoardGroup(status, tasks) {
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

async function initializeSchema(sql) {
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
    `ALTER TABLE projects ADD COLUMN IF NOT EXISTS brief TEXT`,
  ];
  for (const statement of migrations) {
    await sql.query(statement);
  }

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
  await sql.query(`UPDATE tasks SET priority = 'high' WHERE priority = '높음'`);
  await sql.query(`UPDATE tasks SET priority = 'medium' WHERE priority = '중간'`);
  await sql.query(`UPDATE tasks SET priority = 'low' WHERE priority = '낮음'`);
  await sql.query(`UPDATE tasks SET status = 'impl' WHERE status = 'inprogress'`);
  await sql.query(`UPDATE tasks SET status = 'impl_review' WHERE status = 'review'`);

  // ── projects + project_links tables ──
  await sql.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      purpose TEXT,
      stack TEXT,
      brief TEXT,
      status TEXT DEFAULT 'active',
      category TEXT,
      repo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS project_links (
      source_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      target_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      relation TEXT NOT NULL,
      PRIMARY KEY (source_id, target_id, relation)
    )
  `);
}

async function ensureSchema(sql) {
  if (!schemaReady) {
    schemaReady = initializeSchema(sql).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function renumberRanks(sql, project, status) {
  await sql.query(`
    UPDATE tasks SET rank = sub.new_rank
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY rank, id) * 1000 AS new_rank
      FROM tasks WHERE project = $1 AND status = $2
    ) sub
    WHERE tasks.id = sub.id
  `, [project, status]);
}

function r2Bucket() {
  return process.env.CLOUDFLARE_R2_BUCKET_NAME || "cyanluna-kanban-images";
}

function r2PublicUrl() {
  return String(process.env.CLOUDFLARE_R2_PUBLIC_URL || "").replace(/\/$/, "");
}

function getR2() {
  if (r2Client) return r2Client;
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 env vars missing");
  }
  r2Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return r2Client;
}

async function uploadToR2(key, buffer, contentType) {
  await getR2().send(new PutObjectCommand({
    Bucket: r2Bucket(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
}

async function deleteFromR2(key) {
  try {
    await getR2().send(new DeleteObjectCommand({ Bucket: r2Bucket(), Key: key }));
  } catch {
    return;
  }
}

async function parseBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body || {};
  }

  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", `https://${req.headers.host || "localhost"}`);
  const routedPath = url.searchParams.get("__path");
  const pathname = url.pathname === "/api" && routedPath
    ? `/api/${String(routedPath).replace(/^\/+/, "")}`
    : url.pathname;
  const secureCookies = url.protocol === "https:";
  const auth = authenticateRequest(req, url);
  const authFreePaths = new Set(["/api/auth/session"]);
  let sql = null;

  try {
    if (pathname === "/api/auth/session" && req.method === "GET") {
      json(res, 200, {
        authenticated: auth.ok,
        authRequired: auth.authRequired,
        mode: auth.mode,
        source: auth.source || null,
        reason: auth.reason || null,
      });
      return;
    }

    if (pathname === "/api/auth/session" && req.method === "POST") {
      if (!auth.ok) {
        clearAuthCookie(res, secureCookies);
        json(res, auth.statusCode, {
          error: auth.error,
          reason: auth.reason,
          authRequired: auth.authRequired,
          mode: auth.mode,
        });
        return;
      }
      setAuthCookie(res, getPresentedToken(req), secureCookies);
      json(res, 200, {
        success: true,
        authenticated: true,
        authRequired: auth.authRequired,
        mode: auth.mode,
        source: auth.source,
      });
      return;
    }

    if (pathname === "/api/auth/session" && req.method === "DELETE") {
      clearAuthCookie(res, secureCookies);
      json(res, 200, { success: true, authenticated: false });
      return;
    }

    if (pathname.startsWith("/api/") && !authFreePaths.has(pathname) && !auth.ok) {
      if (auth.reason === "invalid_token") {
        clearAuthCookie(res, secureCookies);
      }
      json(res, auth.statusCode, {
        error: auth.error,
        reason: auth.reason,
        authRequired: auth.authRequired,
        mode: auth.mode,
      });
      return;
    }

    if (pathname.startsWith("/api/") && pathname !== "/api/info") {
      sql = getSql();
      await ensureSchema(sql);
    }

    if (pathname === "/api/info" && req.method === "GET") {
      json(res, 200, { projectName: process.env.KANBAN_PROJECT_NAME || "kanban-board" });
      return;
    }

    if (pathname === "/api/board/version" && req.method === "GET") {
      const projectParam = url.searchParams.get("project");
      const meta = await readBoardMeta(sql, projectParam);
      const etag = createEtag(["board-version", projectParam || "*", meta.version]);
      res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");
      res.setHeader("ETag", etag);
      if (etagMatches(req, etag)) {
        res.statusCode = 304;
        res.end();
        return;
      }
      json(res, 200, {
        project: projectParam || null,
        ...meta,
      });
      return;
    }

    if (pathname === "/api/board" && req.method === "GET") {
      const projectParam = url.searchParams.get("project");
      const summary = url.searchParams.get("summary") === "true";
      const compactBoard = summary && url.searchParams.get("compact") === "board";
      const todoLimit = compactBoard ? Math.max(0, Number.parseInt(url.searchParams.get("todo_limit") || "10", 10) || 10) : null;
      const doneLimit = compactBoard ? Math.max(0, Number.parseInt(url.searchParams.get("done_limit") || "10", 10) || 10) : null;
      const fields = summary
        ? `id, project, title, status, priority, level, current_agent,
           plan_review_count, impl_review_count, rank, tags,
           created_at, completed_at,
           review_comments, plan_review_comments, notes`
        : "*";
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
      if (etagMatches(req, etag)) {
        res.statusCode = 304;
        res.end();
        return;
      }

      const projectRows = await q(sql, "SELECT DISTINCT project FROM tasks ORDER BY project");
      const projects = projectRows.map((row) => row.project);

      let tasks;
      if (projectParam) {
        const safe = sanitizeProject(projectParam);
        tasks = await q(sql, `SELECT ${fields} FROM tasks WHERE project = $1 ORDER BY rank, id`, [safe]);
      } else {
        tasks = await q(sql, `SELECT ${fields} FROM tasks ORDER BY rank, id`);
      }

      const boardTasks = summary ? tasks.map(summarizeBoardTask) : tasks;

      const grouped = new Map();
      for (const task of boardTasks) {
        const current = grouped.get(task.status) || [];
        current.push(task);
        grouped.set(task.status, current);
      }

      const groupedBoard = Object.fromEntries(
        BOARD_STATUSES.map((status) => {
          const tasksForStatus = sortBoardGroup(status, grouped.get(status) || []);
          if (compactBoard && status === "todo") {
            return [status, tasksForStatus.slice(0, todoLimit)];
          }
          if (compactBoard && status === "done") {
            return [status, tasksForStatus.slice(0, doneLimit)];
          }
          return [status, tasksForStatus];
        })
      );

      json(res, 200, {
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
      });
      return;
    }

    const taskMatch = pathname.match(/^\/api\/task\/(\d+)$/);
    if (taskMatch) {
      const id = taskMatch[1];
      const projectParam = url.searchParams.get("project");

      if (req.method === "GET") {
        const allowedFields = new Set([
          "id", "project", "title", "status", "priority", "description", "plan",
          "implementation_notes", "tags", "review_comments", "plan_review_comments",
          "test_results", "agent_log", "current_agent", "plan_review_count",
          "impl_review_count", "level", "attachments", "notes", "decision_log",
          "done_when", "rank", "created_at", "started_at", "planned_at",
          "reviewed_at", "tested_at", "completed_at", "updated_at",
        ]);
        const fieldsParam = url.searchParams.get("fields");
        const fields = fieldsParam
          ? ["id", "project", "status", ...fieldsParam.split(",").map((field) => field.trim()).filter((field) => allowedFields.has(field))]
            .filter((field, index, list) => list.indexOf(field) === index)
            .join(", ")
          : "*";

        const rows = await q(sql, `SELECT ${fields} FROM tasks WHERE id = $1`, [id]);
        if (!rows[0]) {
          json(res, 404, { error: "Not found" });
          return;
        }
        json(res, 200, rows[0]);
        return;
      }

      if (req.method === "PATCH") {
        if (!projectParam) {
          json(res, 400, { error: "project query param required" });
          return;
        }

        const safe = sanitizeProject(projectParam);
        const body = await parseBody(req);
        if (body.status !== undefined) body.status = normalizeStatus(body.status);

        if (body.status !== undefined) {
          const [task] = await q(sql, "SELECT status, level FROM tasks WHERE id = $1", [id]);
          if (task) {
            const allowed = getTransitions(task.level)[task.status];
            if (allowed && !allowed.includes(body.status)) {
              json(res, 400, {
                error: `Invalid transition: ${task.status} -> ${body.status} (L${task.level})`,
                allowed,
              });
              return;
            }
          }
        }

        const sets = [];
        const values = [];
        let position = 1;

        if (body.status !== undefined) {
          sets.push(`status = $${position++}`);
          values.push(body.status);
          if (body.status === "plan") sets.push("started_at = COALESCE(started_at, NOW())");
          else if (body.status === "plan_review") sets.push("planned_at = NOW()");
          else if (body.status === "test") sets.push("tested_at = NOW()");
          else if (body.status === "done") sets.push("completed_at = NOW()");
          else if (body.status === "todo") sets.push("started_at = NULL, planned_at = NULL, completed_at = NULL, reviewed_at = NULL, tested_at = NULL");
        }

        const normalize = (value) => typeof value === "string" ? value : JSON.stringify(value);
        const assign = (field, value, asJson = false) => {
          if (value === undefined) return;
          sets.push(`${field} = $${position++}`);
          values.push(asJson ? normalize(value) : value);
        };

        assign("title", body.title);
        assign("priority", body.priority);
        assign("description", body.description);
        assign("plan", body.plan);
        assign("implementation_notes", body.implementation_notes);
        assign("tags", body.tags, true);
        assign("review_comments", body.review_comments, true);
        assign("plan_review_comments", body.plan_review_comments, true);
        assign("test_results", body.test_results, true);
        assign("agent_log", body.agent_log, true);
        assign("current_agent", body.current_agent);
        assign("reviewed_at", body.reviewed_at);
        assign("rank", body.rank);
        assign("level", body.level);
        assign("decision_log", body.decision_log);
        assign("done_when", body.done_when);

        if (sets.length > 0) {
          sets.push("updated_at = NOW()");
          values.push(id, safe);
          await sql.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${position++} AND project = $${position}`, values);
        }

        json(res, 200, { success: true });
        return;
      }

      if (req.method === "DELETE") {
        if (!projectParam) {
          json(res, 400, { error: "project query param required" });
          return;
        }
        const safe = sanitizeProject(projectParam);
        const [task] = await q(sql, "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
        if (task?.attachments) {
          try {
            for (const attachment of JSON.parse(task.attachments)) {
              await deleteFromR2(attachment.storedName);
            }
          } catch {
            return;
          }
        }
        await sql.query("DELETE FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
        json(res, 200, { success: true });
        return;
      }
    }

    const reorderMatch = pathname.match(/^\/api\/task\/(\d+)\/reorder$/);
    if (reorderMatch && req.method === "PATCH") {
      const id = Number(reorderMatch[1]);
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const body = await parseBody(req);
      if (body.status !== undefined) body.status = normalizeStatus(body.status);

      const [task] = await q(sql, "SELECT * FROM tasks WHERE id = $1", [id]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

        const targetStatus = body.status || task.status;
        if (targetStatus !== task.status) {
          const allowed = getTransitions(task.level)[task.status];
        if (allowed && !allowed.includes(targetStatus)) {
          json(res, 400, {
            error: `Invalid transition: ${task.status} -> ${targetStatus} (L${task.level})`,
            allowed,
          });
          return;
        }
        const sets = ["status = $1"];
        if (targetStatus === "plan") sets.push("started_at = COALESCE(started_at, NOW())");
        else if (targetStatus === "plan_review") sets.push("planned_at = NOW()");
        else if (targetStatus === "test") sets.push("tested_at = NOW()");
        else if (targetStatus === "done") sets.push("completed_at = NOW()");
        else if (targetStatus === "todo") sets.push("started_at = NULL, planned_at = NULL, completed_at = NULL, reviewed_at = NULL, tested_at = NULL");
        await sql.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $2`, [targetStatus, id]);
      }

      const afterId = body.afterId || null;
      const beforeId = body.beforeId || null;
      let newRank = 1000;

      if (afterId && beforeId) {
        const [above] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
        const [below] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
        if (above && below) {
          newRank = Math.floor((above.rank + below.rank) / 2);
          if (newRank === above.rank) {
            await renumberRanks(sql, task.project, targetStatus);
            const [newAbove] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
            const [newBelow] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
            newRank = Math.floor((newAbove.rank + newBelow.rank) / 2);
          }
        }
      } else if (afterId) {
        const [above] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [afterId]);
        newRank = above ? above.rank + 1000 : 1000;
      } else if (beforeId) {
        const [below] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
        if (below) {
          newRank = Math.floor(below.rank / 2);
          if (newRank === 0) {
            await renumberRanks(sql, task.project, targetStatus);
            const [newBelow] = await q(sql, "SELECT rank FROM tasks WHERE id = $1", [beforeId]);
            newRank = Math.floor(newBelow.rank / 2);
          }
        }
        }

      await sql.query("UPDATE tasks SET rank = $1, updated_at = NOW() WHERE id = $2", [newRank, id]);
      json(res, 200, { success: true, rank: newRank });
      return;
    }

    if (pathname === "/api/task" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.project) {
        json(res, 400, { error: "body.project is required" });
        return;
      }
      const safe = sanitizeProject(body.project);
      const title = body.title || "Untitled";
      const priority = body.priority || "medium";
      const description = body.description || null;
      const tags = body.tags !== undefined ? (typeof body.tags === "string" ? body.tags : JSON.stringify(body.tags)) : null;
      const level = body.level !== undefined ? Number.parseInt(body.level, 10) || 3 : 3;

      const [maxRow] = await q(sql, "SELECT MAX(rank) AS maxrank FROM tasks WHERE project = $1 AND status = 'todo'", [safe]);
      const rank = (maxRow?.maxrank ?? 0) + 1000;
      const [row] = await q(sql, `
        INSERT INTO tasks (project, title, priority, description, tags, rank, level)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [safe, title, priority, description, tags, rank, level]);

      json(res, 200, { success: true, id: row.id });
      return;
    }

    const reviewMatch = pathname.match(/^\/api\/task\/(\d+)\/review$/);
    if (reviewMatch && req.method === "POST") {
      const id = reviewMatch[1];
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const body = await parseBody(req);
      const [task] = await q(sql, "SELECT review_comments, impl_review_count, level FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

      const comments = task.review_comments ? JSON.parse(task.review_comments) : [];
      const newComment = {
        reviewer: body.reviewer || "review-agent",
        status: body.status,
        comment: body.comment,
        timestamp: new Date().toISOString(),
      };
      comments.push(newComment);

      const approvedTarget = task.level <= 2 ? "done" : "test";
      const newStatus = body.status === "approved" ? approvedTarget : "impl";
      let query = "UPDATE tasks SET review_comments = $1, reviewed_at = NOW(), updated_at = NOW(), status = $2, impl_review_count = $3";
      if (newStatus === "test") query += ", tested_at = NOW()";
      else if (newStatus === "done") query += ", completed_at = NOW()";
      query += " WHERE id = $4 AND project = $5";
      await sql.query(query, [JSON.stringify(comments), newStatus, task.impl_review_count + 1, id, safe]);

      json(res, 200, { success: true, newStatus, comment: newComment });
      return;
    }

    const planReviewMatch = pathname.match(/^\/api\/task\/(\d+)\/plan-review$/);
    if (planReviewMatch && req.method === "POST") {
      const id = planReviewMatch[1];
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const body = await parseBody(req);
      const [task] = await q(sql, "SELECT plan_review_comments, plan_review_count FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
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

      await sql.query(
        "UPDATE tasks SET plan_review_comments = $1, updated_at = NOW(), status = $2, plan_review_count = $3 WHERE id = $4 AND project = $5",
        [JSON.stringify(comments), newStatus, task.plan_review_count + 1, id, safe],
      );

      json(res, 200, { success: true, newStatus, comment: newComment });
      return;
    }

    const testResultMatch = pathname.match(/^\/api\/task\/(\d+)\/test-result$/);
    if (testResultMatch && req.method === "POST") {
      const id = testResultMatch[1];
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const body = await parseBody(req);
      const [task] = await q(sql, "SELECT test_results FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
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
      let query = "UPDATE tasks SET test_results = $1, updated_at = NOW(), status = $2";
      if (newStatus === "done") query += ", completed_at = NOW()";
      query += " WHERE id = $3 AND project = $4";
      await sql.query(query, [JSON.stringify(results), newStatus, id, safe]);

      json(res, 200, { success: true, newStatus, result: newResult });
      return;
    }

    const noteMatch = pathname.match(/^\/api\/task\/(\d+)\/note$/);
    if (noteMatch && req.method === "POST") {
      const id = noteMatch[1];
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const body = await parseBody(req);
      const [task] = await q(sql, "SELECT notes FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

      const notes = task.notes ? JSON.parse(task.notes) : [];
      const note = {
        id: Date.now(),
        text: body.text || body.content || "",
        author: body.author || "user",
        timestamp: new Date().toISOString(),
      };
      notes.push(note);

      await sql.query("UPDATE tasks SET notes = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(notes), id, safe]);
      json(res, 200, { success: true, note });
      return;
    }

    const noteDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/note\/(\d+)$/);
    if (noteDeleteMatch && req.method === "DELETE") {
      const id = noteDeleteMatch[1];
      const noteId = Number.parseInt(noteDeleteMatch[2], 10);
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const [task] = await q(sql, "SELECT notes FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

      const notes = (task.notes ? JSON.parse(task.notes) : []).filter((note) => note.id !== noteId);
      await sql.query("UPDATE tasks SET notes = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(notes), id, safe]);
      json(res, 200, { success: true });
      return;
    }

    const attachmentMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment$/);
    if (attachmentMatch && req.method === "POST") {
      const id = attachmentMatch[1];
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const body = await parseBody(req);
      const [task] = await q(sql, "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

      const filename = String(body.filename || "image.png").replace(/[^a-zA-Z0-9._-]/g, "_");
      const ext = path.extname(filename) || ".png";
      const safeName = `${id}_${Date.now()}${ext}`;
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
      };
      const contentType = mimeTypes[ext.toLowerCase()] || "application/octet-stream";
      const source = String(body.data || "").replace(/^data:[^;]+;base64,/, "");
      const buffer = Buffer.from(source, "base64");

      await uploadToR2(safeName, buffer, contentType);

      const attachments = task.attachments ? JSON.parse(task.attachments) : [];
      attachments.push({
        filename: body.filename || "image.png",
        storedName: safeName,
        url: `${r2PublicUrl()}/${safeName}`,
        size: buffer.byteLength,
        uploaded_at: new Date().toISOString(),
      });
      await sql.query("UPDATE tasks SET attachments = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(attachments), id, safe]);

      json(res, 200, { success: true, attachment: attachments[attachments.length - 1] });
      return;
    }

    const attachmentDeleteMatch = pathname.match(/^\/api\/task\/(\d+)\/attachment\/([^/]+)$/);
    if (attachmentDeleteMatch && req.method === "DELETE") {
      const id = attachmentDeleteMatch[1];
      const storedName = decodeURIComponent(attachmentDeleteMatch[2]);
      const projectParam = url.searchParams.get("project");
      if (!projectParam) {
        json(res, 400, { error: "project query param required" });
        return;
      }
      const safe = sanitizeProject(projectParam);
      const [task] = await q(sql, "SELECT attachments FROM tasks WHERE id = $1 AND project = $2", [id, safe]);
      if (!task) {
        json(res, 404, { error: "Not found" });
        return;
      }

      const attachments = task.attachments ? JSON.parse(task.attachments) : [];
      const nextAttachments = attachments.filter((attachment) => attachment.storedName !== storedName);
      if (nextAttachments.length !== attachments.length) {
        await deleteFromR2(storedName);
        await sql.query("UPDATE tasks SET attachments = $1, updated_at = NOW() WHERE id = $2 AND project = $3", [JSON.stringify(nextAttachments), id, safe]);
      }

      json(res, 200, { success: true });
      return;
    }

    const uploadsMatch = pathname.match(/^\/api\/uploads\/([^/]+)$/);
    if (uploadsMatch && req.method === "GET") {
      const safeName = decodeURIComponent(uploadsMatch[1]).replace(/[^a-zA-Z0-9._-]/g, "_");
      res.statusCode = 302;
      res.setHeader("Location", `${r2PublicUrl()}/${safeName}`);
      res.end();
      return;
    }

    // ── Projects API ──────────────────────────────────────────────────────────

    // GET /api/projects — List all with links
    if (pathname === "/api/projects" && req.method === "GET") {
      const rows = await q(sql, `
        SELECT p.*,
          COALESCE(json_agg(json_build_object(
            'source_id', pl.source_id, 'target_id', pl.target_id, 'relation', pl.relation
          )) FILTER (WHERE pl.source_id IS NOT NULL), '[]') AS links
        FROM projects p
        LEFT JOIN project_links pl ON p.id = pl.source_id OR p.id = pl.target_id
        GROUP BY p.id
        ORDER BY p.category, p.name
      `);
      json(res, 200, { projects: rows });
      return;
    }

    // POST /api/projects — Create/Upsert
    if (pathname === "/api/projects" && req.method === "POST") {
      const body = await parseBody(req);
      if (!body.id || !body.name) {
        json(res, 400, { error: "id and name are required" });
        return;
      }
      const [row] = await q(sql, `
        INSERT INTO projects (id, name, purpose, stack, brief, status, category, repo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          purpose = COALESCE(EXCLUDED.purpose, projects.purpose),
          stack = COALESCE(EXCLUDED.stack, projects.stack),
          brief = COALESCE(EXCLUDED.brief, projects.brief),
          status = COALESCE(EXCLUDED.status, projects.status),
          category = COALESCE(EXCLUDED.category, projects.category),
          repo_url = COALESCE(EXCLUDED.repo_url, projects.repo_url),
          updated_at = NOW()
        RETURNING *
      `, [body.id, body.name, body.purpose || null, body.stack || null, body.brief || null, body.status || 'active', body.category || null, body.repo_url || null]);
      json(res, 200, { success: true, project: row });
      return;
    }

    // /api/projects/:id routes
    const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch) {
      const projectId = decodeURIComponent(projectMatch[1]);

      // GET /api/projects/:id — Single project with task stats
      if (req.method === "GET") {
        const [project] = await q(sql, "SELECT * FROM projects WHERE id = $1", [projectId]);
        if (!project) {
          json(res, 404, { error: "Project not found" });
          return;
        }
        const taskCounts = await q(sql, "SELECT status, COUNT(*)::int AS count FROM tasks WHERE project = $1 GROUP BY status", [projectId]);
        const links = await q(sql, "SELECT * FROM project_links WHERE source_id = $1 OR target_id = $1", [projectId]);
        const counts = {};
        for (const row of taskCounts) {
          counts[row.status] = row.count;
        }
        json(res, 200, { ...project, task_counts: counts, links });
        return;
      }

      // PATCH /api/projects/:id — Update
      if (req.method === "PATCH") {
        const body = await parseBody(req);
        const sets = [];
        const values = [];
        let position = 1;
        const assign = (field, value) => {
          if (value === undefined) return;
          sets.push(`${field} = $${position++}`);
          values.push(value);
        };
        assign("name", body.name);
        assign("purpose", body.purpose);
        assign("stack", body.stack);
        assign("brief", body.brief);
        assign("status", body.status);
        assign("category", body.category);
        assign("repo_url", body.repo_url);
        if (sets.length === 0) {
          json(res, 400, { error: "No fields to update" });
          return;
        }
        sets.push("updated_at = NOW()");
        values.push(projectId);
        await sql.query(`UPDATE projects SET ${sets.join(", ")} WHERE id = $${position}`, values);
        json(res, 200, { success: true });
        return;
      }

      // DELETE /api/projects/:id
      if (req.method === "DELETE") {
        await sql.query("DELETE FROM projects WHERE id = $1", [projectId]);
        json(res, 200, { success: true });
        return;
      }
    }

    // /api/projects/:id/links routes
    const projectLinksMatch = pathname.match(/^\/api\/projects\/([^/]+)\/links$/);
    if (projectLinksMatch) {
      const projectId = decodeURIComponent(projectLinksMatch[1]);

      // GET /api/projects/:id/links
      if (req.method === "GET") {
        const links = await q(sql, "SELECT * FROM project_links WHERE source_id = $1 OR target_id = $1", [projectId]);
        json(res, 200, { links });
        return;
      }

      // POST /api/projects/:id/links
      if (req.method === "POST") {
        const body = await parseBody(req);
        if (!body.target_id || !body.relation) {
          json(res, 400, { error: "target_id and relation are required" });
          return;
        }
        await sql.query(
          "INSERT INTO project_links (source_id, target_id, relation) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [projectId, body.target_id, body.relation]
        );
        json(res, 200, { success: true });
        return;
      }

      // DELETE /api/projects/:id/links
      if (req.method === "DELETE") {
        const body = await parseBody(req);
        if (!body.target_id || !body.relation) {
          json(res, 400, { error: "target_id and relation are required" });
          return;
        }
        await sql.query(
          "DELETE FROM project_links WHERE source_id = $1 AND target_id = $2 AND relation = $3",
          [projectId, body.target_id, body.relation]
        );
        json(res, 200, { success: true });
        return;
      }
    }

    json(res, 404, { error: "Not found" });
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : "Internal Server Error" });
  }
}
