type ColumnKey = "todo" | "plan" | "plan_review" | "impl" | "impl_review" | "test" | "done";

interface Task {
  id: number;
  project: string;
  title: string;
  status: string;
  priority: string;
  rank: number;
  description?: string | null;
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
  note_count?: number;
  last_review_status?: string | null;
  last_plan_review_status?: string | null;
}

interface Board {
  version?: string;
  updated_at?: string | null;
  total?: number;
  counts?: Partial<Record<ColumnKey, number>>;
  todo: Task[];
  plan: Task[];
  plan_review: Task[];
  impl: Task[];
  impl_review: Task[];
  test: Task[];
  done: Task[];
  projects: string[];
}

interface AuthSessionState {
  authenticated: boolean;
  authRequired: boolean;
  mode?: string;
  source?: string | null;
  reason?: string | null;
  error?: string | null;
}

const COLUMNS = [
  { key: "todo",        label: "Requirements", icon: "\u{1F4CB}" },
  { key: "plan",        label: "Plan",         icon: "\u{1F5FA}\uFE0F" },
  { key: "plan_review", label: "Review Plan",  icon: "\u{1F50D}" },
  { key: "impl",        label: "Implement",    icon: "\u{1F528}" },
  { key: "impl_review", label: "Review Impl",  icon: "\u{1F4DD}" },
  { key: "test",        label: "Test",         icon: "\u{1F9EA}" },
  { key: "done",        label: "Done",         icon: "\u2705" },
];

const STATUS_BADGES: Record<string, string> = {
  plan:        "Planning",
  plan_review: "Plan Review",
  impl:        "Implementing",
  impl_review: "Impl Review",
  test:        "Testing",
};

const AUTH_STORAGE_KEY = "kanban-auth-token";
const VIEW_STORAGE_KEY = "kanban-current-view";
const MOBILE_BOARD_COLUMNS_KEY = "kanban-mobile-board-columns";
const BOARD_VERSION_POLL_MS = 30000;
const BOARD_TODO_LIMIT = 10;
const BOARD_DONE_LIMIT = 10;
const SUMMARY_CACHE_PREFIX = "kanban-summary-cache";
const SUMMARY_TTL_MS: Record<SummaryMode, number> = {
  board: 30_000,
  full: 60_000,
};
const MOBILE_MEDIA_QUERY = window.matchMedia("(max-width: 768px)");
type SummaryMode = "board" | "full";

interface PersistedSummaryCacheEntry {
  fetchedAt: number;
  etag: string | null;
  board: Board;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const isSecure =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  if (!isSecure) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

function isView(value: string | null): value is "board" | "list" | "chronicle" {
  return value === "board" || value === "list" || value === "chronicle";
}

function isColumnKey(value: string): value is typeof COLUMNS[number]["key"] {
  return COLUMNS.some((column) => column.key === value);
}

function readStoredMobileBoardColumns(): Set<string> {
  try {
    const raw = localStorage.getItem(MOBILE_BOARD_COLUMNS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string" && isColumnKey(value)));
  } catch {
    return new Set();
  }
}

let currentProject: string | null = localStorage.getItem('kanban-project');
let isDragging = false;
let isMobileViewport = MOBILE_MEDIA_QUERY.matches;
let currentView: "board" | "list" | "chronicle" = isView(localStorage.getItem(VIEW_STORAGE_KEY))
  ? (localStorage.getItem(VIEW_STORAGE_KEY) as "board" | "list" | "chronicle")
  : (isMobileViewport ? "list" : "board");
let currentSearch: string = '';
let currentSort: string = localStorage.getItem('kanban-sort') || 'default';
let hideOldDone: boolean = localStorage.getItem('kanban-hide-old') === 'true';
let currentAuthToken: string = localStorage.getItem(AUTH_STORAGE_KEY) || "";
let authRequired = false;
let authReady = false;
let sseConnected = false;
let mobileFiltersOpen = !isMobileViewport;
let mobileBoardExpanded = readStoredMobileBoardColumns();
let currentBoardVersion: string | null = null;
let boardVersionPollId: number | null = null;
let currentBoardVersionEtag: string | null = null;
const summaryBoardCache = new Map<string, Board>();
const summaryBoardEtagCache = new Map<string, string>();
const summaryRevalidation = new Map<string, Promise<void>>();

function setAuthMessage(message: string, tone: "default" | "error" | "success" = "default") {
  const messageEl = document.getElementById("auth-message")!;
  messageEl.textContent = message;
  messageEl.classList.remove("error", "success");
  if (tone !== "default") {
    messageEl.classList.add(tone);
  }
}

function syncOverlayState() {
  const overlays = [
    document.getElementById("modal-overlay"),
    document.getElementById("add-card-overlay"),
    document.getElementById("auth-overlay"),
  ];
  const anyOpen = overlays.some((overlay) => overlay && !overlay.classList.contains("hidden"));
  document.body.classList.toggle("overlay-open", anyOpen);
}

function updateAuthButton() {
  const button = document.getElementById("auth-btn") as HTMLButtonElement | null;
  if (!button) return;
  if (!authRequired) {
    button.textContent = "Open";
    button.title = "Board access is open in this environment";
    return;
  }
  button.textContent = authReady ? "Private" : "Locked";
  button.title = authReady ? "Shared token configured for this browser" : "Shared token required";
}

function showAuthOverlay(message = "Enter the shared access token to load the board.", tone: "default" | "error" | "success" = "default") {
  authReady = false;
  document.getElementById("auth-overlay")!.classList.remove("hidden");
  syncOverlayState();
  const input = document.getElementById("auth-token-input") as HTMLInputElement;
  input.value = currentAuthToken;
  setAuthMessage(message, tone);
  updateAuthButton();
  setTimeout(() => input.focus(), 0);
}

function hideAuthOverlay() {
  document.getElementById("auth-overlay")!.classList.add("hidden");
  syncOverlayState();
  updateAuthButton();
}

function rememberAuthToken(token: string) {
  currentAuthToken = token.trim();
  if (currentAuthToken) {
    localStorage.setItem(AUTH_STORAGE_KEY, currentAuthToken);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function updateMobileShellState() {
  document.body.classList.toggle("mobile-shell", isMobileViewport);
  document.body.classList.toggle("mobile-toolbar-open", !isMobileViewport || mobileFiltersOpen);

  const toggle = document.getElementById("toolbar-mobile-toggle") as HTMLButtonElement | null;
  if (toggle) {
    const expanded = !isMobileViewport || mobileFiltersOpen;
    toggle.hidden = !isMobileViewport;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "Hide Filters" : "Show Filters";
  }
}

function syncViewportState(nextMobile: boolean) {
  isMobileViewport = nextMobile;
  if (!isMobileViewport) {
    mobileFiltersOpen = true;
  }
  updateMobileShellState();
  if (authReady && currentView === "board") {
    refreshCurrentView();
  }
}

function shouldUseSSE(): boolean {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function stopBoardVersionPolling() {
  if (boardVersionPollId !== null) {
    window.clearInterval(boardVersionPollId);
    boardVersionPollId = null;
  }
}

function boardCacheKey(project: string | null = currentProject, mode: SummaryMode = "full"): string {
  return `${project || "__all__"}::${mode}`;
}

function persistedSummaryCacheKey(project: string | null = currentProject, mode: SummaryMode = "full"): string {
  return `${SUMMARY_CACHE_PREFIX}::${boardCacheKey(project, mode)}`;
}

function readPersistedSummaryCache(project: string | null = currentProject, mode: SummaryMode = "full"): PersistedSummaryCacheEntry | null {
  try {
    const raw = localStorage.getItem(persistedSummaryCacheKey(project, mode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSummaryCacheEntry;
    if (!parsed || typeof parsed.fetchedAt !== "number" || !parsed.board) return null;
    if (Date.now() - parsed.fetchedAt > SUMMARY_TTL_MS[mode]) {
      localStorage.removeItem(persistedSummaryCacheKey(project, mode));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePersistedSummaryCache(project: string | null, mode: SummaryMode, board: Board, etag: string | null) {
  try {
    const payload: PersistedSummaryCacheEntry = {
      fetchedAt: Date.now(),
      etag,
      board,
    };
    localStorage.setItem(persistedSummaryCacheKey(project, mode), JSON.stringify(payload));
  } catch {
    // Ignore storage quota / serialization failures.
  }
}

function invalidateSummaryCaches(project: string | null = currentProject, mode?: SummaryMode) {
  const modes: SummaryMode[] = mode ? [mode] : ["board", "full"];
  for (const currentMode of modes) {
    const cacheKey = boardCacheKey(project, currentMode);
    summaryBoardCache.delete(cacheKey);
    summaryBoardEtagCache.delete(cacheKey);
    summaryRevalidation.delete(cacheKey);
    try {
      localStorage.removeItem(persistedSummaryCacheKey(project, currentMode));
    } catch {
      // Ignore storage failures.
    }
  }
  if (project === currentProject) {
    currentBoardVersion = null;
    currentBoardVersionEtag = null;
  }
}

function clearBoardCaches(options: { persisted?: boolean } = {}) {
  summaryBoardCache.clear();
  summaryBoardEtagCache.clear();
  summaryRevalidation.clear();
  currentBoardVersion = null;
  currentBoardVersionEtag = null;
  if (options.persisted) {
    try {
      const keysToDelete: string[] = [];
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key?.startsWith(`${SUMMARY_CACHE_PREFIX}::`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore storage failures.
    }
  }
}

function clearStoredAuthToken() {
  currentAuthToken = "";
  localStorage.removeItem(AUTH_STORAGE_KEY);
  const input = document.getElementById("auth-token-input") as HTMLInputElement | null;
  if (input) input.value = "";
}

async function readAuthSessionState(): Promise<AuthSessionState> {
  const headers = new Headers();
  if (currentAuthToken) {
    headers.set("X-Kanban-Auth", currentAuthToken);
  }
  const res = await fetch("/api/auth/session", {
    method: "GET",
    headers,
    credentials: "same-origin",
  });
  const payload = await res.json().catch(() => ({}));
  return {
    authenticated: Boolean(payload.authenticated),
    authRequired: Boolean(payload.authRequired),
    mode: payload.mode,
    source: payload.source ?? null,
    reason: payload.reason ?? null,
    error: payload.error ?? null,
  };
}

async function establishAuthSession(token: string) {
  const nextToken = token.trim();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "X-Kanban-Auth": nextToken,
    },
    credentials: "same-origin",
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const reason = payload.reason === "invalid_token"
      ? "Shared token is invalid."
      : payload.reason === "token_hash_missing"
        ? "Server auth is not configured yet."
        : "Board authentication failed.";
    throw new Error(reason);
  }
  rememberAuthToken(nextToken);
  authRequired = Boolean(payload.authRequired);
  authReady = true;
  hideAuthOverlay();
  updateAuthButton();
}

async function clearAuthSession() {
  await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "same-origin",
  }).catch(() => {});
  stopBoardVersionPolling();
  clearBoardCaches({ persisted: true });
  clearStoredAuthToken();
  authReady = !authRequired;
  updateAuthButton();
}

async function apiFetch(input: string, init: RequestInit = {}, allowUnauthorized = false): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (currentAuthToken && !headers.has("X-Kanban-Auth")) {
    headers.set("X-Kanban-Auth", currentAuthToken);
  }
  const response = await fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if ((response.status === 401 || response.status === 403 || response.status === 503) && !allowUnauthorized) {
    const payload = await response.clone().json().catch(() => ({}));
    authRequired = true;
    authReady = false;
    if (payload.reason === "invalid_token") {
      clearStoredAuthToken();
    }
    const message = payload.reason === "invalid_token"
      ? "Stored token was rejected. Enter a valid shared token."
      : payload.reason === "token_hash_missing"
        ? "Server auth hash is not configured yet."
        : "Shared token is required for this board.";
    showAuthOverlay(message, "error");
    throw new Error(payload.error || message);
  }

  return response;
}

async function readBoardVersion(projectOverride: string | null = currentProject) {
  const params = projectOverride
    ? `?project=${encodeURIComponent(projectOverride)}`
    : "";
  const headers = new Headers();
  if (currentBoardVersionEtag) {
    headers.set("If-None-Match", currentBoardVersionEtag);
  }
  const response = await apiFetch(`/api/board/version${params}`, { headers });
  if (response.status === 304) {
    if (!currentBoardVersion) {
      currentBoardVersionEtag = null;
      return readBoardVersion();
    }
    return null;
  }
  currentBoardVersionEtag = response.headers.get("ETag");
  return response.json() as Promise<{ version: string; updated_at: string | null; total: number }>;
}

function currentViewUsesSummaryMode(mode: SummaryMode): boolean {
  if (mode === "board") {
    return currentView === "board" && !shouldLoadExpandedBoardSummary();
  }
  return currentView === "list" || currentView === "chronicle" || (currentView === "board" && shouldLoadExpandedBoardSummary());
}

function shouldLoadExpandedBoardSummary(): boolean {
  return currentSearch.trim().length > 0;
}

function revalidateSummaryCache(mode: SummaryMode, cacheKey: string, cachedVersion: string | null, projectOverride: string | null) {
  if (!authReady || summaryRevalidation.has(cacheKey)) return;

  const work = (async () => {
    try {
      const meta = await readBoardVersion(projectOverride);
      if (!meta) return;
      if (cachedVersion && meta.version === cachedVersion) {
        currentBoardVersion = meta.version;
        return;
      }
      invalidateSummaryCaches(projectOverride, mode);
      await fetchSummaryBoard(mode, { bypassTtl: true, projectOverride });
      if (currentProject === projectOverride && currentViewUsesSummaryMode(mode)) {
        refreshCurrentView();
      }
    } catch {
      // Ignore background revalidation failures.
    } finally {
      summaryRevalidation.delete(cacheKey);
    }
  })();

  summaryRevalidation.set(cacheKey, work);
}

async function fetchSummaryBoard(
  mode: SummaryMode = "full",
  options: { bypassTtl?: boolean; projectOverride?: string | null } = {}
): Promise<Board> {
  const projectForRequest = options.projectOverride === undefined ? currentProject : options.projectOverride;
  const queryParts = ["summary=true"];
  if (projectForRequest) {
    queryParts.unshift(`project=${encodeURIComponent(projectForRequest)}`);
  }
  if (mode === "board") {
    queryParts.push("compact=board", `todo_limit=${BOARD_TODO_LIMIT}`, `done_limit=${BOARD_DONE_LIMIT}`);
  }
  const params = `?${queryParts.join("&")}`;
  const cacheKey = boardCacheKey(projectForRequest, mode);

  if (!options.bypassTtl) {
    const persisted = readPersistedSummaryCache(projectForRequest, mode);
    if (persisted) {
      summaryBoardCache.set(cacheKey, persisted.board);
      if (persisted.etag) {
        summaryBoardEtagCache.set(cacheKey, persisted.etag);
      }
      currentBoardVersion = persisted.board.version || currentBoardVersion;
      revalidateSummaryCache(mode, cacheKey, persisted.board.version || null, projectForRequest);
      return persisted.board;
    }
  }

  const headers = new Headers();
  const knownEtag = summaryBoardEtagCache.get(cacheKey);
  if (knownEtag) {
    headers.set("If-None-Match", knownEtag);
  }

  const response = await apiFetch(`/api/board${params}`, { headers });
  if (response.status === 304) {
    const cached = summaryBoardCache.get(cacheKey);
    if (cached) {
      currentBoardVersion = cached.version || currentBoardVersion;
      return cached;
    }
    summaryBoardEtagCache.delete(cacheKey);
    return fetchSummaryBoard(mode, { bypassTtl: true });
  }

  const data: Board = await response.json();
  const etag = response.headers.get("ETag");
  if (etag) {
    summaryBoardEtagCache.set(cacheKey, etag);
  }
  summaryBoardCache.set(cacheKey, data);
  writePersistedSummaryCache(projectForRequest, mode, data, etag);
  currentBoardVersion = data.version || currentBoardVersion;
  return data;
}

function startBoardVersionPolling() {
  if (shouldUseSSE() || boardVersionPollId !== null) return;

  boardVersionPollId = window.setInterval(async () => {
    if (!authReady || isDragging) return;
    const detailOpen = !document.getElementById("modal-overlay")!.classList.contains("hidden");
    const addOpen = !document.getElementById("add-card-overlay")!.classList.contains("hidden");
    if (detailOpen || addOpen) return;

    try {
      const meta = await readBoardVersion();
      if (!meta) {
        return;
      }
      if (!currentBoardVersion) {
        currentBoardVersion = meta.version;
        return;
      }
      if (meta.version !== currentBoardVersion) {
        currentBoardVersion = meta.version;
        refreshCurrentView();
      }
    } catch {
      if (authRequired && !authReady) {
        stopBoardVersionPolling();
      }
    }
  }, BOARD_VERSION_POLL_MS);
}

function ensureRealtimeSync() {
  if (shouldUseSSE()) {
    stopBoardVersionPolling();
    connectSSE();
    return;
  }
  startBoardVersionPolling();
}

function hydrateAuthTokenFromUrl() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("auth") || url.searchParams.get("token");
  if (!token) return;
  rememberAuthToken(token);
  url.searchParams.delete("auth");
  url.searchParams.delete("token");
  window.history.replaceState({}, "", url.toString());
}

async function bootstrapAuth(): Promise<boolean> {
  hydrateAuthTokenFromUrl();

  if (currentAuthToken) {
    try {
      await establishAuthSession(currentAuthToken);
      return true;
    } catch (error) {
      showAuthOverlay(error instanceof Error ? error.message : "Board authentication failed.", "error");
      return false;
    }
  }

  const session = await readAuthSessionState();
  authRequired = session.authRequired;
  authReady = session.authenticated || !session.authRequired;

  if (session.authRequired && !session.authenticated) {
    showAuthOverlay("Enter the shared access token to load the board.");
    return false;
  }

  hideAuthOverlay();
  return true;
}

function priorityClass(priority: string): string {
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  if (priority === "low") return "low";
  return "";
}

function persistMobileBoardExpanded() {
  localStorage.setItem(MOBILE_BOARD_COLUMNS_KEY, JSON.stringify([...mobileBoardExpanded]));
}

function ensureMobileBoardExpanded(board: Board) {
  if (!isMobileViewport || mobileBoardExpanded.size > 0) return;

  const defaults = COLUMNS
    .filter((column) => column.key === "todo" || column.key === "impl" || (column.key !== "done" && board[column.key as keyof Omit<Board, "projects">].length > 0))
    .map((column) => column.key);

  mobileBoardExpanded = new Set(defaults.length > 0 ? defaults : ["todo"]);
  persistMobileBoardExpanded();
}

function isMobileColumnExpanded(columnKey: string): boolean {
  if (!isMobileViewport || currentSearch.trim()) return true;
  return mobileBoardExpanded.has(columnKey);
}

function getStatusLabel(status: string): string {
  return COLUMNS.find((column) => column.key === status)?.label || status;
}

function getAllowedTransitions(level: number, status: string): string[] {
  if (level === 1) {
    const transitions: Record<string, string[]> = {
      todo: ["impl"],
      impl: ["done"],
      done: [],
    };
    return transitions[status] || [];
  }
  if (level === 2) {
    const transitions: Record<string, string[]> = {
      todo: ["plan"],
      plan: ["impl", "todo"],
      impl: ["impl_review"],
      impl_review: ["done", "impl"],
      done: [],
    };
    return transitions[status] || [];
  }
  const transitions: Record<string, string[]> = {
    todo: ["plan"],
    plan: ["plan_review", "todo"],
    plan_review: ["impl", "plan"],
    impl: ["impl_review"],
    impl_review: ["test", "impl"],
    test: ["done", "impl"],
    done: [],
  };
  return transitions[status] || [];
}

async function moveTaskStatus(task: Pick<Task, "id" | "project" | "status">, nextStatus: string) {
  if (!nextStatus || nextStatus === task.status) return;

  const resp = await apiFetch(`/api/task/${task.id}?project=${encodeURIComponent(task.project)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: nextStatus }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    showToast(err.error || "Failed to move task");
    return;
  }

  invalidateSummaryCaches(task.project);
  loadBoard();
}

function isOlderThan3Days(dateStr: string): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() > 3 * 24 * 60 * 60 * 1000;
}

function sortTasks(tasks: Task[], status?: string): Task[] {
  if (currentSort === 'default') {
    if (status === 'done') {
      return [...tasks].sort((a, b) => {
        const completedOrder = (b.completed_at || '').localeCompare(a.completed_at || '');
        if (completedOrder !== 0) return completedOrder;
        return a.rank - b.rank || a.id - b.id;
      });
    }
    return [...tasks].sort((a, b) => b.rank - a.rank || b.id - a.id);
  }
  return [...tasks].sort((a, b) => {
    if (currentSort === 'created_asc')  return a.created_at.localeCompare(b.created_at);
    if (currentSort === 'created_desc') return b.created_at.localeCompare(a.created_at);
    if (currentSort === 'completed_desc') {
      return (b.completed_at || '').localeCompare(a.completed_at || '');
    }
    return 0;
  });
}

function applySearchFilter() {
  const q = currentSearch.toLowerCase().replace(/^#/, '');
  const anyFilter = q.length > 0 || hideOldDone;
  document.body.classList.toggle("mobile-board-search", currentView === "board" && isMobileViewport && q.length > 0);

  if (currentView === 'board') {
    document.querySelectorAll<HTMLElement>('.card').forEach(card => {
      const searchOk = !q || (() => {
        const id    = card.dataset.id || '';
        const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
        const desc  = card.querySelector('.card-desc')?.textContent?.toLowerCase() || '';
        const tags  = [...card.querySelectorAll('.tag')].map(t => t.textContent?.toLowerCase() || '').join(' ');
        return id === q || title.includes(q) || desc.includes(q) || tags.includes(q);
      })();
      const doneHidden = hideOldDone
        && card.dataset.status === 'done'
        && isOlderThan3Days(card.dataset.completedAt || '');
      card.style.display = (searchOk && !doneHidden) ? '' : 'none';
    });
    // Update column counts: "visible/total" when any filter is active
    document.querySelectorAll<HTMLElement>('.column').forEach(col => {
      const cards = col.querySelectorAll<HTMLElement>('.card');
      const visible = [...cards].filter(c => c.style.display !== 'none').length;
      const renderedCount = cards.length;
      const totalCount = Number.parseInt(col.dataset.totalCount || `${renderedCount}`, 10) || renderedCount;
      const countEl = col.querySelector<HTMLElement>('.count');
      if (countEl) {
        countEl.textContent = anyFilter || totalCount !== renderedCount
          ? `${visible}/${totalCount}`
          : `${totalCount}`;
      }
    });
  } else if (currentView === 'list') {
    document.querySelectorAll<HTMLElement>('#list-view tbody tr').forEach(row => {
      const searchOk = !q || (() => {
        const id      = row.dataset.id || '';
        const title   = row.querySelector('.col-title')?.textContent?.toLowerCase() || '';
        const project = (row as HTMLTableRowElement).cells[5]?.textContent?.toLowerCase() || '';
        const tags    = [...row.querySelectorAll('.tag')].map(t => t.textContent?.toLowerCase() || '').join(' ');
        return id === q || title.includes(q) || project.includes(q) || tags.includes(q);
      })();
      const doneHidden = hideOldDone
        && row.classList.contains('status-done')
        && isOlderThan3Days(row.dataset.completedAt || '');
      row.style.display = (searchOk && !doneHidden) ? '' : 'none';
    });
    document.querySelectorAll<HTMLElement>('#list-view .list-card').forEach(card => {
      const searchOk = !q || (() => {
        const id = card.dataset.id || '';
        const title = card.querySelector('.list-card-title')?.textContent?.toLowerCase() || '';
        const project = card.dataset.project?.toLowerCase() || '';
        const tags = [...card.querySelectorAll('.tag')].map((tag) => tag.textContent?.toLowerCase() || '').join(' ');
        return id === q || title.includes(q) || project.includes(q) || tags.includes(q);
      })();
      const doneHidden = hideOldDone
        && card.classList.contains('status-done')
        && isOlderThan3Days(card.dataset.completedAt || '');
      card.style.display = (searchOk && !doneHidden) ? '' : 'none';
    });
  } else {
    document.querySelectorAll<HTMLElement>('#chronicle-view .chronicle-event').forEach(event => {
      const searchOk = !q || (() => {
        const id = event.dataset.id || '';
        const title = event.querySelector('.chronicle-task-link')?.textContent?.toLowerCase() || '';
        const project = event.dataset.project?.toLowerCase() || '';
        return id === q || title.includes(q) || project.includes(q);
      })();
      const doneHidden = hideOldDone && isOlderThan3Days(event.dataset.completedAt || '');
      event.style.display = (searchOk && !doneHidden) ? '' : 'none';
    });
    document.querySelectorAll<HTMLElement>('#chronicle-view .chronicle-group').forEach(group => {
      const visibleEvents = [...group.querySelectorAll<HTMLElement>('.chronicle-event')]
        .filter((event) => event.style.display !== 'none')
        .length;
      group.style.display = visibleEvents > 0 ? '' : 'none';
    });
  }
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags || tags === "null") return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return dateStr.slice(0, 10);
}

function parseJsonArray(raw: string | null | undefined): any[] {
  if (!raw || raw === "null") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderCard(task: Task): string {
  const pClass = priorityClass(task.priority);
  const priorityBadge = pClass
    ? `<span class="badge ${pClass}">${task.priority}</span>`
    : "";

  const dateBadge = task.completed_at
    ? `<span class="badge date">${task.completed_at.slice(0, 10)}</span>`
    : task.created_at
      ? `<span class="badge created">${timeAgo(task.created_at)}</span>`
      : "";

  const projectBadge =
    !currentProject && task.project
      ? `<span class="badge project">${task.project}</span>`
      : "";

  // Status badge for pipeline stages
  const statusLabel = STATUS_BADGES[task.status];
  const statusBadge = statusLabel
    ? `<span class="badge status-${task.status}">${statusLabel}</span>`
    : "";

  // Level badge
  const levelBadge = `<span class="badge level-${task.level}">L${task.level}</span>`;

  // Agent tag
  const agentBadge = task.current_agent
    ? `<span class="badge agent-tag">${task.current_agent}</span>`
    : "";

  // Review badge (impl_review)
  const reviewComments = task.last_review_status ? [] : parseJsonArray(task.review_comments);
  const lastReviewStatus = task.last_review_status || (reviewComments.length > 0 ? reviewComments[reviewComments.length - 1]?.status : null);
  const reviewBadge = lastReviewStatus
    ? `<span class="badge ${lastReviewStatus === 'approved' ? 'review-approved' : 'review-changes'}">${
        lastReviewStatus === 'approved' ? 'Approved' : 'Changes Req.'
      }</span>`
    : task.status === 'impl_review'
      ? '<span class="badge review-pending">Awaiting Review</span>'
      : '';

  // Plan review badge
  const planReviewComments = task.last_plan_review_status ? [] : parseJsonArray(task.plan_review_comments);
  const lastPlanReviewStatus = task.last_plan_review_status || (planReviewComments.length > 0 ? planReviewComments[planReviewComments.length - 1]?.status : null);
  const planReviewBadge = lastPlanReviewStatus
    ? `<span class="badge ${lastPlanReviewStatus === 'approved' ? 'review-approved' : 'review-changes'}">${
        lastPlanReviewStatus === 'approved' ? 'Plan OK' : 'Plan Changes'
      }</span>`
    : task.status === 'plan_review'
      ? '<span class="badge review-pending">Plan Review</span>'
      : '';

  const tags = parseTags(task.tags)
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  // Notes count
  const noteCount = task.note_count ?? parseJsonArray(task.notes).length;
  const notesBadge = noteCount > 0
    ? `<span class="badge notes-count" title="${noteCount} note(s)">\u{1F4AC} ${noteCount}</span>`
    : "";
  const mobileMoveOptions = getAllowedTransitions(task.level, task.status)
    .map((status) => `<option value="${status}">${getStatusLabel(status)}</option>`)
    .join("");
  const mobileMoveControl = mobileMoveOptions
    ? `
      <label class="mobile-card-move card-interactive">
        <span>Move</span>
        <select class="mobile-status-select" data-id="${task.id}" data-project="${task.project}" data-current-status="${task.status}">
          <option value="${task.status}">${getStatusLabel(task.status)}</option>
          ${mobileMoveOptions}
        </select>
      </label>
    `
    : "";
  const draggableAttr = isMobileViewport ? 'draggable="false"' : 'draggable="true"';
  const cardClasses = isMobileViewport ? "card mobile-card" : "card";

  return `
    <div class="${cardClasses}" ${draggableAttr} data-id="${task.id}" data-status="${task.status}" data-project="${task.project}" data-completed-at="${task.completed_at || ''}">
      <div class="card-header">
        <span class="card-id">#${task.id}</span>
        ${levelBadge}
        ${priorityBadge}
        ${statusBadge}
        ${agentBadge}
        <button class="card-copy-btn" data-copy="#${task.id} ${task.title}" title="Copy to clipboard">⎘</button>
      </div>
      <div class="card-title">${task.title}</div>
      <div class="card-footer">
        ${projectBadge}
        ${planReviewBadge}
        ${reviewBadge}
        ${notesBadge}
        ${dateBadge}
      </div>
      ${mobileMoveControl}
      ${tags ? `<div class="card-tags">${tags}</div>` : ""}
    </div>
  `;
}

function renderColumn(
  key: string,
  label: string,
  icon: string,
  tasks: Task[],
  totalCount: number = tasks.length
): string {
  const expanded = isMobileColumnExpanded(key);
  const cardsHtml = sortTasks(tasks, key).map(renderCard).join("");
  const addBtn = key === "todo"
    ? `<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>`
    : "";
  const countLabel = totalCount !== tasks.length ? `${tasks.length}/${totalCount}` : `${totalCount}`;
  return `
    <div class="column ${key}" data-column="${key}" data-mobile-expanded="${expanded}" data-total-count="${totalCount}">
      <div class="column-header">
        <button class="column-toggle-btn" type="button" data-column-toggle="${key}" aria-expanded="${expanded}">
          <span class="column-toggle-label">${icon} ${label}</span>
          <span class="column-toggle-meta">
            <span class="count">${countLabel}</span>
            <span class="column-toggle-icon" aria-hidden="true">${expanded ? "−" : "+"}</span>
          </span>
        </button>
        <div class="column-header-right">
          ${addBtn}
        </div>
      </div>
      <div class="column-body" data-column="${key}">
        ${cardsHtml || '<div class="empty">No items</div>'}
      </div>
    </div>
  `;
}

// Hoisted RegExp constants for simpleMarkdownToHtml (avoid re-creation per call)
const RE_CODE_BLOCK = /```[\s\S]*?```/g;
const RE_CODE_OPEN = /```\w*\n?/;
const RE_CODE_CLOSE = /```$/;
const RE_MERMAID_OPEN = /^```mermaid\s*\n?/;
const RE_BOLD = /\*\*(.+?)\*\*/g;
const RE_INLINE_CODE = /`([^`]+)`/g;
const RE_CB_PLACEHOLDER = /^\x00CB(\d+)\x00$/;
const RE_H3 = /^### (.+)$/;
const RE_H2 = /^## (.+)$/;
const RE_H1 = /^# (.+)$/;
const RE_UL = /^[-*]\s+(.+)$/;
const RE_OL = /^\d+\.\s+(.+)$/;
const RE_TABLE_ROW = /^\|(.+)\|$/;
const RE_TABLE_SEP = /^\|[\s:-]+\|$/;

let mermaidCounter = 0;

function simpleMarkdownToHtml(md: string): string {
  // Extract code blocks first to protect them (mermaid gets special treatment)
  const codeBlocks: string[] = [];
  let text = md.replace(RE_CODE_BLOCK, (match) => {
    if (RE_MERMAID_OPEN.test(match)) {
      const diagram = match.replace(RE_MERMAID_OPEN, "").replace(RE_CODE_CLOSE, "").trim();
      const id = `mermaid-${++mermaidCounter}`;
      codeBlocks.push(`<pre class="mermaid" id="${id}">${diagram}</pre>`);
    } else {
      const code = match.replace(RE_CODE_OPEN, "").replace(RE_CODE_CLOSE, "");
      codeBlocks.push(`<pre><code>${code}</code></pre>`);
    }
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // Escape raw HTML outside code blocks so tags like <textarea>, <select>,
  // <script> in task descriptions don't corrupt the modal's DOM structure.
  text = text.replace(/</g, "&lt;");

  // Inline formatting (applied after escaping — markdown markers use no HTML chars)
  text = text
    .replace(RE_BOLD, "<strong>$1</strong>")
    .replace(RE_INLINE_CODE, "<code>$1</code>");

  // Process line by line to build proper block structure
  const lines = text.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  function closeLists() {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  }

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // Code block placeholder
    const cbMatch = trimmed.match(RE_CB_PLACEHOLDER);
    if (cbMatch) {
      closeLists();
      out.push(codeBlocks[parseInt(cbMatch[1])]);
      i++; continue;
    }

    // Markdown table: detect consecutive pipe rows
    if (RE_TABLE_ROW.test(trimmed)) {
      closeLists();
      const tableRows: string[] = [];
      while (i < lines.length && RE_TABLE_ROW.test(lines[i].trim())) {
        tableRows.push(lines[i].trim());
        i++;
      }
      if (tableRows.length >= 2) {
        // Check if row[1] is separator
        const hasSep = RE_TABLE_SEP.test(tableRows[1]);
        const headerRow = hasSep ? tableRows[0] : null;
        const dataStart = hasSep ? 2 : 0;

        let tableHtml = '<table class="md-table">';
        if (headerRow) {
          const cells = headerRow.slice(1, -1).split("|").map(c => c.trim());
          tableHtml += "<thead><tr>" + cells.map(c => `<th>${c}</th>`).join("") + "</tr></thead>";
        }
        tableHtml += "<tbody>";
        for (let r = dataStart; r < tableRows.length; r++) {
          if (RE_TABLE_SEP.test(tableRows[r])) continue;
          const cells = tableRows[r].slice(1, -1).split("|").map(c => c.trim());
          tableHtml += "<tr>" + cells.map(c => `<td>${c}</td>`).join("") + "</tr>";
        }
        tableHtml += "</tbody></table>";
        out.push(tableHtml);
      } else {
        // Single pipe row, treat as paragraph
        out.push(`<p>${tableRows[0]}</p>`);
      }
      continue;
    }

    // Headings
    const h3 = trimmed.match(RE_H3);
    if (h3) { closeLists(); out.push(`<h3>${h3[1]}</h3>`); i++; continue; }
    const h2 = trimmed.match(RE_H2);
    if (h2) { closeLists(); out.push(`<h2>${h2[1]}</h2>`); i++; continue; }
    const h1 = trimmed.match(RE_H1);
    if (h1) { closeLists(); out.push(`<h1>${h1[1]}</h1>`); i++; continue; }

    // Unordered list
    const ul = trimmed.match(RE_UL);
    if (ul) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${ul[1]}</li>`);
      i++; continue;
    }

    // Ordered list
    const ol = trimmed.match(RE_OL);
    if (ol) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${ol[1]}</li>`);
      i++; continue;
    }

    // Close open lists on non-list lines
    closeLists();

    // Empty line = paragraph break, non-empty = paragraph
    if (trimmed === "") {
      out.push("");
    } else {
      out.push(`<p>${trimmed}</p>`);
    }
    i++;
  }
  closeLists();

  return out.join("\n");
}

async function renderMermaidDiagrams(container: HTMLElement) {
  const mermaid = (window as any).__mermaid;
  if (!mermaid) return;
  const elements = container.querySelectorAll("pre.mermaid");
  if (elements.length === 0) return;
  try {
    await mermaid.run({ nodes: elements });
  } catch (e) {
    console.warn("Mermaid render failed:", e);
  }
}

function renderLifecycleSection(
  phase: string,
  icon: string,
  colorClass: string,
  content: string | null,
  isActive: boolean
): string {
  if (!content && !isActive) return '';
  const body = content
    ? simpleMarkdownToHtml(content)
    : `<span class="phase-empty">Not yet documented</span>`;
  return `
    <div class="lifecycle-phase ${colorClass} ${isActive ? 'active' : ''}">
      <div class="phase-header">
        <span class="phase-icon">${icon}</span>
        <span class="phase-label">${phase}</span>
        <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
      </div>
      <div class="phase-body">${body}</div>
    </div>
  `;
}

function renderReviewEntries(comments: any[]): string {
  if (comments.length === 0) return '';
  return comments.map((rc: any) => `
    <div class="review-entry ${rc.status}">
      <div class="review-header">
        <span class="badge ${rc.status === 'approved' ? 'review-approved' : 'review-changes'}">
          ${rc.status === 'approved' ? 'Approved' : 'Changes Requested'}
        </span>
        <span class="review-meta">${rc.reviewer || ''} &middot; ${rc.timestamp?.slice(0, 16) || ''}</span>
      </div>
      <div class="review-comment">${simpleMarkdownToHtml(rc.comment || '')}</div>
    </div>
  `).join('');
}

function renderTestEntries(results: any[]): string {
  if (results.length === 0) return '';
  return results.map((r: any) => `
    <div class="review-entry ${r.status === 'pass' ? 'approved' : 'changes_requested'}">
      <div class="review-header">
        <span class="badge ${r.status === 'pass' ? 'review-approved' : 'review-changes'}">
          ${r.status === 'pass' ? 'Pass' : 'Fail'}
        </span>
        <span class="review-meta">${r.tester || ''} &middot; ${r.timestamp?.slice(0, 16) || ''}</span>
      </div>
      ${r.lint ? `<div class="test-output"><strong>Lint:</strong> <pre>${r.lint}</pre></div>` : ''}
      ${r.build ? `<div class="test-output"><strong>Build:</strong> <pre>${r.build}</pre></div>` : ''}
      ${r.tests ? `<div class="test-output"><strong>Tests:</strong> <pre>${r.tests}</pre></div>` : ''}
      ${r.comment ? `<div class="review-comment">${simpleMarkdownToHtml(r.comment)}</div>` : ''}
    </div>
  `).join('');
}

async function uploadFiles(taskId: number, files: FileList | File[], project: string) {
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) continue;
    const reader = new FileReader();
    const data: string = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    await apiFetch(`/api/task/${taskId}/attachment?project=${encodeURIComponent(project)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, data }),
    });
  }
  showTaskDetail(taskId, project);
}

async function showTaskDetail(id: number, project?: string) {
  const overlay = document.getElementById("modal-overlay")!;
  const content = document.getElementById("modal-content")!;
  content.innerHTML = '<div style="color:#94a3b8">Loading...</div>';
  overlay.classList.remove("hidden");
  syncOverlayState();

  try {
    const projectParam = project ? `?project=${encodeURIComponent(project)}` : "";
    const res = await apiFetch(`/api/task/${id}${projectParam}`);
    const task: Task = await res.json();
    const boardCard = document.querySelector<HTMLElement>(
      `.card[data-id="${task.id}"][data-project="${CSS.escape(task.project)}"]`
    );
    if (boardCard && boardCard.dataset.status !== task.status) {
      clearBoardCaches();
      refreshCurrentView();
    }

    const tags = parseTags(task.tags);
    const tagsHtml = tags.length
      ? `<div class="modal-tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`
      : "";

    const meta = [
      `<strong>Project:</strong> ${task.project}`,
      `<strong>Status:</strong> ${task.status}`,
      `<strong>Priority:</strong> ${task.priority}`,
      `<strong>Created:</strong> ${task.created_at?.slice(0, 10) || "-"}`,
      task.started_at
        ? `<strong>Started:</strong> ${task.started_at.slice(0, 10)}`
        : "",
      task.planned_at
        ? `<strong>Planned:</strong> ${task.planned_at.slice(0, 10)}`
        : "",
      task.reviewed_at
        ? `<strong>Reviewed:</strong> ${task.reviewed_at.slice(0, 10)}`
        : "",
      task.tested_at
        ? `<strong>Tested:</strong> ${task.tested_at.slice(0, 10)}`
        : "",
      task.completed_at
        ? `<strong>Completed:</strong> ${task.completed_at.slice(0, 10)}`
        : "",
    ]
      .filter(Boolean)
      .join(" &nbsp;|&nbsp; ");

    // Level-aware progress bar
    const levelPhases: Record<number, { labels: string[]; statuses: string[] }> = {
      1: { labels: ['Req', 'Impl', 'Done'], statuses: ['todo', 'impl', 'done'] },
      2: { labels: ['Req', 'Plan', 'Impl', 'Review', 'Done'], statuses: ['todo', 'plan', 'impl', 'impl_review', 'done'] },
      3: { labels: ['Req', 'Plan', 'Plan Rev', 'Impl', 'Impl Rev', 'Test', 'Done'], statuses: ['todo', 'plan', 'plan_review', 'impl', 'impl_review', 'test', 'done'] },
    };
    const lp = levelPhases[task.level] || levelPhases[3];
    const currentPhase = Math.max(0, lp.statuses.indexOf(task.status));

    const progressHtml = `
      <div class="lifecycle-progress">
        <span class="level-indicator">L${task.level}</span>
        ${lp.labels.map((p, i) => `
          <div class="progress-step ${i < currentPhase ? 'completed' : ''} ${i === currentPhase ? 'current' : ''}">
            <div class="step-dot"></div>
            <span class="step-label">${p}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
      </div>
    `;

    // Attachments
    const attachments = parseJsonArray(task.attachments);
    const attachmentsHtml = attachments.length > 0
      ? `<div class="attachments-grid">${attachments.map((a: any) =>
          `<div class="attachment-thumb" data-stored="${a.storedName}">
            <img src="${a.url}" alt="${a.filename}" loading="lazy" />
            <button class="attachment-remove" data-id="${id}" data-name="${a.storedName}" title="Remove">&times;</button>
            <span class="attachment-name">${a.filename}</span>
          </div>`
        ).join('')}</div>`
      : '';

    // Requirements section (editable + level + attachments)
    const reqBody = task.description
      ? simpleMarkdownToHtml(task.description)
      : `<span class="phase-empty">Not yet documented</span>`;
    const levelOptions = [1, 2, 3].map(l =>
      `<option value="${l}" ${l === task.level ? 'selected' : ''}>L${l}</option>`
    ).join('');
    const requirementSection = `
      <div class="lifecycle-phase phase-requirement ${currentPhase === 0 ? 'active' : ''}">
        <div class="phase-header">
          <span class="phase-icon">\u{1F4CB}</span>
          <span class="phase-label">Requirements</span>
          <select class="level-select" id="level-select" title="Pipeline Level">${levelOptions}</select>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
          <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
        </div>
        <div class="phase-body" id="req-body-view">
          ${reqBody}
          ${attachmentsHtml}
        </div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(task.description || '').replace(/</g, '&lt;')}</textarea>
          <div class="attachment-drop-zone" id="attachment-drop-zone">
            <span>\u{1F4CE} Drop images here or click to attach</span>
            <input type="file" id="attachment-input" accept="image/*" multiple hidden />
          </div>
          ${attachmentsHtml ? `<div id="edit-attachments">${attachmentsHtml}</div>` : ''}
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    // Plan section
    const planSection = renderLifecycleSection(
      'Plan', '\u{1F5FA}\uFE0F', 'phase-plan',
      task.plan, currentPhase === 1 && !task.plan
    );

    // Decision Log section (after plan, before plan review)
    let decisionLogSection = '';
    if (task.decision_log) {
      decisionLogSection = renderLifecycleSection(
        'Decision Log', '🧭', 'phase-decision-log',
        task.decision_log, false
      );
    }

    // Done When section (after decision log, before plan review)
    let doneWhenSection = '';
    if (task.done_when) {
      doneWhenSection = renderLifecycleSection(
        'Done When', '🎯', 'phase-done-when',
        task.done_when, false
      );
    }

    // Plan Review section
    const planReviewComments = parseJsonArray(task.plan_review_comments);
    const planReviewContent = renderReviewEntries(planReviewComments);
    let planReviewSection = '';
    if (planReviewContent || currentPhase === 2) {
      planReviewSection = `
        <div class="lifecycle-phase phase-plan-review ${currentPhase === 2 ? 'active' : ''}">
          <div class="phase-header">
            <span class="phase-icon">\u{1F50D}</span>
            <span class="phase-label">Plan Review</span>
            ${task.plan_review_count > 0 ? `<span class="review-count">${task.plan_review_count} review(s)</span>` : ''}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${planReviewContent || '<span class="phase-empty">Awaiting plan review</span>'}</div>
        </div>
      `;
    }

    // Implementation section
    const implSection = renderLifecycleSection(
      'Implementation', '\u{1F528}', 'phase-impl',
      task.implementation_notes, currentPhase === 3 && !task.implementation_notes
    );

    // Impl Review section
    const reviewComments = parseJsonArray(task.review_comments);
    const reviewContent = renderReviewEntries(reviewComments);
    let reviewSection = '';
    if (reviewContent || currentPhase === 4) {
      reviewSection = `
        <div class="lifecycle-phase phase-review ${currentPhase === 4 ? 'active' : ''}">
          <div class="phase-header">
            <span class="phase-icon">\u{1F4DD}</span>
            <span class="phase-label">Implementation Review</span>
            ${task.impl_review_count > 0 ? `<span class="review-count">${task.impl_review_count} review(s)</span>` : ''}
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${reviewContent || '<span class="phase-empty">Awaiting implementation review</span>'}</div>
        </div>
      `;
    }

    // Test Results section
    const testResults = parseJsonArray(task.test_results);
    const testContent = renderTestEntries(testResults);
    let testSection = '';
    if (testContent || currentPhase === 5) {
      testSection = `
        <div class="lifecycle-phase phase-test ${currentPhase === 5 ? 'active' : ''}">
          <div class="phase-header">
            <span class="phase-icon">\u{1F9EA}</span>
            <span class="phase-label">Test Results</span>
            <button class="phase-expand-btn" title="Expand to full screen">&#x26F6;</button>
          </div>
          <div class="phase-body">${testContent || '<span class="phase-empty">Awaiting test execution</span>'}</div>
        </div>
      `;
    }

    // Agent Log section (collapsible)
    const agentLogs = parseJsonArray(task.agent_log);
    let agentLogSection = '';
    if (agentLogs.length > 0) {
      const MODEL_NAMES = ['opus', 'sonnet', 'haiku', 'gemini', 'copilot', 'gpt'];
      function splitAgentModel(agent: string): { name: string; model: string | null } {
        if (!agent) return { name: '', model: null };
        // Check explicit model field first, then parse from agent string
        const lower = agent.toLowerCase();
        for (const m of MODEL_NAMES) {
          const idx = lower.lastIndexOf(m);
          if (idx > 0) {
            // Split at the separator before model name (e.g. "plan-agent-opus" → "plan-agent" + "opus")
            let sep = idx;
            while (sep > 0 && (agent[sep - 1] === '-' || agent[sep - 1] === '_')) sep--;
            return { name: agent.slice(0, sep), model: agent.slice(idx) };
          }
        }
        return { name: agent, model: null };
      }
      const logEntries = agentLogs.map((entry: any) => {
        const { name, model } = splitAgentModel(entry.agent || '');
        const modelFromField = entry.model || model;
        const modelBadge = modelFromField
          ? `<span class="badge model-tag model-${modelFromField.toLowerCase()}">${modelFromField}</span>`
          : '';
        return `
          <div class="agent-log-entry">
            <span class="agent-log-time">${entry.timestamp?.slice(0, 16) || ''}</span>
            <span class="badge agent-tag">${name || entry.agent || ''}</span>
            ${modelBadge}
            <span class="agent-log-msg">${entry.message || ''}</span>
          </div>
        `;
      }).join('');
      agentLogSection = `
        <details class="lifecycle-phase phase-agent-log">
          <summary class="phase-header">
            <span class="phase-icon">\u{1F916}</span>
            <span class="phase-label">Agent Log</span>
            <span class="review-count">${agentLogs.length} entries</span>
          </summary>
          <div class="phase-body agent-log-body">${logEntries}</div>
        </details>
      `;
    }

    // Notes section
    const notes = parseJsonArray(task.notes);
    const notesHtml = notes.map((n: any) => `
      <div class="note-entry">
        <div class="note-header">
          <span class="note-author">${n.author || 'user'}</span>
          <span class="note-time">${n.timestamp?.slice(0, 16).replace('T', ' ') || ''}</span>
          <button class="note-delete" data-note-id="${n.id}" title="Delete">&times;</button>
        </div>
        <div class="note-text">${simpleMarkdownToHtml(n.text || '')}</div>
      </div>
    `).join('');

    const notesSection = `
      <div class="notes-section">
        <div class="notes-header">
          <span>Notes</span>
          <span class="notes-count">${notes.length}</span>
        </div>
        <div class="notes-list">${notesHtml}</div>
        <form class="note-form" id="note-form">
          <textarea id="note-input" rows="2" placeholder="Add a note... (supports markdown)"></textarea>
          <button type="submit" class="note-submit">Add Note</button>
        </form>
      </div>
    `;

    content.innerHTML = `
      <h1>#${task.id} ${task.title}</h1>
      <div class="modal-meta">${meta}</div>
      ${tagsHtml}
      ${progressHtml}
      <div class="lifecycle-sections">
        ${requirementSection}
        ${planSection}
        ${decisionLogSection}
        ${doneWhenSection}
        ${planReviewSection}
        ${implSection}
        ${reviewSection}
        ${testSection}
        ${agentLogSection}
      </div>
      ${notesSection}
      <div class="modal-danger-zone">
        <button class="delete-task-btn" id="delete-task-btn">Delete Card</button>
      </div>
    `;

    // Render mermaid diagrams in modal
    renderMermaidDiagrams(content);

    // Fullscreen expand for phase panels
    content.querySelectorAll<HTMLElement>('.phase-expand-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const phase = btn.closest<HTMLElement>('.lifecycle-phase');
        phase?.requestFullscreen().catch(() => {});
      });
    });

    // Level change handler
    const levelSelect = document.getElementById("level-select") as HTMLSelectElement;
    levelSelect.addEventListener("change", async () => {
      const newLevel = parseInt(levelSelect.value);
      await apiFetch(`/api/task/${id}?project=${encodeURIComponent(task.project)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: newLevel }),
      });
      invalidateSummaryCaches(task.project);
      showTaskDetail(id, task.project);
    });

    // Delete task handler
    document.getElementById("delete-task-btn")!.addEventListener("click", async () => {
      if (!confirm(`Delete card #${task.id} "${task.title}"?`)) return;
      await apiFetch(`/api/task/${id}?project=${encodeURIComponent(task.project)}`, { method: "DELETE" });
      invalidateSummaryCaches(task.project);
      document.getElementById("modal-overlay")!.classList.add("hidden");
      refreshCurrentView();
    });

    // Requirements edit handlers
    const reqEditBtn = document.getElementById("req-edit-btn")!;
    const reqView = document.getElementById("req-body-view")!;
    const reqEdit = document.getElementById("req-body-edit")!;
    const reqTextarea = document.getElementById("req-textarea") as HTMLTextAreaElement;
    const reqSaveBtn = document.getElementById("req-save-btn")!;
    const reqCancelBtn = document.getElementById("req-cancel-btn")!;

    reqEditBtn.addEventListener("click", () => {
      reqView.classList.add("hidden");
      reqEdit.classList.remove("hidden");
      reqTextarea.focus();
    });

    reqCancelBtn.addEventListener("click", () => {
      reqTextarea.value = task.description || '';
      reqEdit.classList.add("hidden");
      reqView.classList.remove("hidden");
    });

    reqSaveBtn.addEventListener("click", async () => {
      const newDesc = reqTextarea.value;
      reqSaveBtn.textContent = "Saving...";
      await apiFetch(`/api/task/${id}?project=${encodeURIComponent(task.project)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDesc }),
      });
      invalidateSummaryCaches(task.project);
      showTaskDetail(id, task.project);
    });

    // Image attachment handlers
    const dropZone = document.getElementById("attachment-drop-zone");
    const fileInput = document.getElementById("attachment-input") as HTMLInputElement | null;

    if (dropZone && fileInput) {
      dropZone.addEventListener("click", () => fileInput.click());
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drop-active");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drop-active");
      });
      dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropZone.classList.remove("drop-active");
        const files = (e as DragEvent).dataTransfer?.files;
        if (files) await uploadFiles(id, files, task.project);
      });
      fileInput.addEventListener("change", async () => {
        if (fileInput.files) await uploadFiles(id, fileInput.files, task.project);
      });
    }

    // Attachment remove buttons
    content.querySelectorAll(".attachment-remove").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const el = btn as HTMLElement;
        const taskId = el.dataset.id;
        const storedName = el.dataset.name;
        await apiFetch(`/api/task/${taskId}/attachment/${encodeURIComponent(storedName!)}?project=${encodeURIComponent(task.project)}`, {
          method: "DELETE",
        });
        showTaskDetail(id, task.project);
      });
    });

    // Note form submit
    const noteForm = document.getElementById("note-form") as HTMLFormElement;
    const noteInput = document.getElementById("note-input") as HTMLTextAreaElement;
    noteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = noteInput.value.trim();
      if (!text) return;
      noteInput.disabled = true;
        await apiFetch(`/api/task/${id}/note?project=${encodeURIComponent(task.project)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        invalidateSummaryCaches(task.project);
        showTaskDetail(id, task.project);
      });

    // Note delete buttons
    content.querySelectorAll(".note-delete").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const noteId = (btn as HTMLElement).dataset.noteId;
        await apiFetch(`/api/task/${id}/note/${noteId}?project=${encodeURIComponent(task.project)}`, { method: "DELETE" });
        invalidateSummaryCaches(task.project);
        showTaskDetail(id, task.project);
      });
    });
  } catch {
    content.innerHTML = '<div style="color:#ef4444">Failed to load</div>';
  }
}

// PostgreSQL returns timestamps as "YYYY-MM-DD HH:mm:ss.ffffff" (space, no T, no Z).
// new Date() requires ISO 8601 T-separator; we normalize here.
function parseTs(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  let s = dateStr.replace(" ", "T");       // space → T
  if (s.length === 10) s += "T00:00:00Z"; // date-only
  else if (!/Z$|[+-]\d{2}:\d{2}$/.test(s)) s += "Z"; // append Z if no tz
  return new Date(s);
}

function isoWeek(dateStr: string): string {
  const d = parseTs(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  // ISO week: Thursday-based
  const day = d.getUTCDay() || 7; // 1=Mon, 7=Sun
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function fmtTime(dateStr: string): string {
  const d = parseTs(dateStr);
  if (isNaN(d.getTime())) return dateStr.slice(0, 10) || "—";
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false });
  return `${date}\n${time}`;
}

function renderCompletedTask(task: Task): string {
  const pClass = priorityClass(task.priority);
  const projectBadge = !currentProject && task.project
    ? `<span class="badge project">${task.project}</span>`
    : "";
  const priorityBadge = pClass
    ? `<span class="badge ${pClass}">${task.priority}</span>`
    : "";
  const statusBadge = `<span class="badge status-${task.status}">${getStatusLabel(task.status)}</span>`;

  return `
    <div class="chronicle-event" data-id="${task.id}" data-project="${task.project}" data-completed-at="${task.completed_at || ''}">
      <div class="chronicle-dot ev-completed"></div>
      <div class="chronicle-event-time">${fmtTime(task.completed_at!)}</div>
      <div class="chronicle-event-body">
        <button class="chronicle-task-link" data-id="${task.id}" data-project="${task.project}">
          #${task.id} ${task.title}
        </button>
        ${statusBadge}
        ${priorityBadge}
        ${projectBadge}
      </div>
    </div>`;
}

function renderMobileListCard(task: Task): string {
  const pClass = priorityClass(task.priority);
  const priorityBadge = pClass
    ? `<span class="badge ${pClass}">${task.priority}</span>`
    : "";
  const projectBadge = !currentProject && task.project
    ? `<span class="badge project">${task.project}</span>`
    : "";
  const statusBadge = `<span class="badge status-${task.status}">${getStatusLabel(task.status)}</span>`;
  const levelBadge = `<span class="badge level-${task.level}">L${task.level}</span>`;
  const created = task.created_at?.slice(0, 10) || "";
  const completed = task.completed_at?.slice(0, 10) || "—";
  const tags = parseTags(task.tags);
  const tagsHtml = tags.map((tag) => `<span class="tag">${tag}</span>`).join("");

  return `
    <article class="list-card status-${task.status}" data-id="${task.id}" data-project="${task.project}" data-completed-at="${task.completed_at || ''}">
      <div class="list-card-top">
        <div class="list-card-meta">
          <span class="list-card-id">#${task.id}</span>
          ${statusBadge}
          ${levelBadge}
          ${priorityBadge}
        </div>
        ${projectBadge}
      </div>
      <button class="list-card-title col-title" data-id="${task.id}" data-project="${task.project}">
        ${task.title}
      </button>
      <div class="list-card-dates">
        <span>Created ${created || "—"}</span>
        <span>Done ${completed}</span>
      </div>
      <div class="list-card-controls">
        <label>
          <span>Status</span>
          <select class="list-status-select" data-id="${task.id}" data-field="status">
            ${COLUMNS.map((column) =>
              `<option value="${column.key}" ${column.key === task.status ? "selected" : ""}>${column.label}</option>`
            ).join("")}
          </select>
        </label>
        <label>
          <span>Level</span>
          <select class="list-level-select" data-id="${task.id}" data-field="level">
            ${[1, 2, 3].map((level) =>
              `<option value="${level}" ${level === task.level ? "selected" : ""}>L${level}</option>`
            ).join("")}
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select class="list-priority-select ${pClass}" data-id="${task.id}" data-field="priority">
            ${["high", "medium", "low"].map((priority) =>
              `<option value="${priority}" ${priority === task.priority ? "selected" : ""}>${priority[0].toUpperCase() + priority.slice(1)}</option>`
            ).join("")}
          </select>
        </label>
      </div>
      ${tagsHtml ? `<div class="list-card-tags">${tagsHtml}</div>` : ""}
    </article>
  `;
}

async function loadChronicleView() {
  const el = document.getElementById("chronicle-view")!;
  try {
    const data = await fetchSummaryBoard("full");

    renderProjectFilter(data.projects);

    const allTasks: Task[] = [];
    for (const col of COLUMNS) {
      for (const t of data[col.key as keyof Omit<Board, "projects" | "counts">]) {
        allTasks.push(t);
      }
    }

    // Only completed tasks, sorted newest first
    const completed = allTasks
      .filter(t => !!t.completed_at)
      .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!));

    // Group by ISO week
    const grouped = new Map<string, Task[]>();
    for (const task of completed) {
      const week = isoWeek(task.completed_at!);
      if (!grouped.has(week)) grouped.set(week, []);
      grouped.get(week)!.push(task);
    }

    if (grouped.size === 0) {
      el.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;color:#64748b;font-size:0.9rem;padding:64px">
          No completed tasks yet
        </div>`;
      return;
    }

    const html = [...grouped.entries()].map(([week, tasks]) => {
      const evHtml = tasks.map(renderCompletedTask).join("");
      return `
        <div class="chronicle-group">
          <div class="chronicle-week-header">${week}</div>
          <div class="chronicle-events">${evHtml}</div>
        </div>`;
    }).join("");

    el.innerHTML = `<div class="chronicle-timeline">${html}</div>`;

    // Wire up task links
    el.querySelectorAll<HTMLButtonElement>(".chronicle-task-link").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id!);
        const project = btn.dataset.project || undefined;
        showTaskDetail(id, project);
      });
    });

  } catch (err) {
    console.error("loadChronicleView failed:", err);
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load chronicle
      </div>`;
  }
}

async function loadBoard() {
  const board = document.getElementById("board")!;
  try {
    const data = await fetchSummaryBoard(shouldLoadExpandedBoardSummary() ? "full" : "board");
    ensureMobileBoardExpanded(data);

    renderProjectFilter(data.projects);

    board.innerHTML = COLUMNS.map((col) =>
      renderColumn(
        col.key,
        col.label,
        col.icon,
        data[col.key as keyof Omit<Board, "projects" | "counts">],
        data.counts?.[col.key as ColumnKey] ?? data[col.key as keyof Omit<Board, "projects" | "counts">].length
      )
    ).join("");

    const doneCount = data.counts?.done ?? data.done.length;
    const total = data.total ?? (
      (data.counts?.todo ?? data.todo.length) +
      (data.counts?.plan ?? data.plan.length) +
      (data.counts?.plan_review ?? data.plan_review.length) +
      (data.counts?.impl ?? data.impl.length) +
      (data.counts?.impl_review ?? data.impl_review.length) +
      (data.counts?.test ?? data.test.length) +
      (data.counts?.done ?? data.done.length)
    );
    document.getElementById("count-summary")!.textContent =
      `${doneCount}/${total} completed`;

    board.querySelectorAll(".card").forEach((el) => {
      el.addEventListener("click", (e) => {
        const interactive = (e.target as HTMLElement).closest(".card-interactive");
        if (interactive) {
          e.stopPropagation();
          return;
        }
        const copyBtn = (e.target as HTMLElement).closest(".card-copy-btn") as HTMLElement | null;
        if (copyBtn) {
          e.stopPropagation();
          navigator.clipboard.writeText(copyBtn.dataset.copy!).then(() => {
            const orig = copyBtn.textContent!;
            copyBtn.textContent = "✓";
            setTimeout(() => { copyBtn.textContent = orig; }, 1000);
          });
          return;
        }
        const id = parseInt((el as HTMLElement).dataset.id!);
        const project = (el as HTMLElement).dataset.project;
        showTaskDetail(id, project);
      });
    });

    if (!isMobileViewport) {
      setupDragAndDrop();
    }
    setupMobileBoardInteractions();
    applySearchFilter();

    const addBtn = document.getElementById("add-card-btn");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("add-card-overlay")!.classList.remove("hidden");
        syncOverlayState();
        if (!isMobileViewport) {
          (document.getElementById("add-title") as HTMLInputElement).focus();
        }
      });
    }
  } catch (err) {
    console.error("loadBoard failed:", err);
    board.innerHTML = `
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
      </div>
    `;
  }
}

function setupMobileBoardInteractions() {
  document.querySelectorAll<HTMLButtonElement>("[data-column-toggle]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (!isMobileViewport) return;
      event.stopPropagation();
      const columnKey = button.dataset.columnToggle;
      if (!columnKey) return;
      if (mobileBoardExpanded.has(columnKey)) {
        mobileBoardExpanded.delete(columnKey);
      } else {
        mobileBoardExpanded.add(columnKey);
      }
      persistMobileBoardExpanded();
      const column = button.closest(".column");
      const expanded = mobileBoardExpanded.has(columnKey) || Boolean(currentSearch.trim());
      if (column) {
        column.setAttribute("data-mobile-expanded", String(expanded));
      }
      button.setAttribute("aria-expanded", String(expanded));
      const icon = button.querySelector(".column-toggle-icon");
      if (icon) {
        icon.textContent = expanded ? "−" : "+";
      }
    });
  });

  document.querySelectorAll<HTMLSelectElement>(".mobile-status-select").forEach((select) => {
    select.addEventListener("click", (event) => event.stopPropagation());
    select.addEventListener("change", async (event) => {
      event.stopPropagation();
      const nextStatus = select.value;
      const taskId = parseInt(select.dataset.id || "", 10);
      const project = select.dataset.project || "";
      const currentStatus = select.dataset.currentStatus || "";
      if (!taskId || !project) return;
      await moveTaskStatus({ id: taskId, project, status: currentStatus }, nextStatus);
    });
  });
}

async function loadListView() {
  const listView = document.getElementById("list-view")!;
  try {
    const data = await fetchSummaryBoard("full");

    renderProjectFilter(data.projects);

    // Flatten all tasks from all columns
    const allTasks: Task[] = [];
    for (const col of COLUMNS) {
      for (const t of data[col.key as keyof Omit<Board, "projects" | "counts">]) {
        allTasks.push(t);
      }
    }

    // Sort by selected mode (default: ID descending / newest first)
    const displayTasks = currentSort === 'default'
      ? [...allTasks].sort((a, b) => b.id - a.id)
      : sortTasks(allTasks);

    const total = displayTasks.length;
    const doneCount = displayTasks.filter(t => t.status === "done").length;
    document.getElementById("count-summary")!.textContent =
      `${doneCount}/${total} completed`;

    const rows = displayTasks.map(t => {
      const pClass = priorityClass(t.priority);
      const tags = parseTags(t.tags);
      const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join("");
      return `
        <tr class="status-${t.status}" data-id="${t.id}" data-project="${t.project}" data-completed-at="${t.completed_at || ''}">
          <td class="col-id">#${t.id}</td>
          <td class="col-title">${t.title}</td>
          <td>
            <select class="list-status-select" data-id="${t.id}" data-field="status">
              ${COLUMNS.map(c =>
                `<option value="${c.key}" ${c.key === t.status ? "selected" : ""}>${c.icon} ${c.label}</option>`
              ).join("")}
            </select>
          </td>
          <td>
            <select class="list-level-select" data-id="${t.id}" data-field="level">
              ${[1, 2, 3].map(l =>
                `<option value="${l}" ${l === t.level ? "selected" : ""}>L${l}</option>`
              ).join("")}
            </select>
          </td>
          <td>
            <select class="list-priority-select ${pClass}" data-id="${t.id}" data-field="priority">
              ${["high", "medium", "low"].map(p =>
                `<option value="${p}" ${p === t.priority ? "selected" : ""}>${p[0].toUpperCase() + p.slice(1)}</option>`
              ).join("")}
            </select>
          </td>
          <td class="list-date">${t.project || ""}</td>
          <td>${tagsHtml}</td>
          <td class="list-date">${t.created_at?.slice(0, 10) || ""}</td>
          <td class="list-date">${t.completed_at?.slice(0, 10) || ""}</td>
        </tr>
      `;
    }).join("");
    const mobileCards = displayTasks.map(renderMobileListCard).join("");

    listView.innerHTML = `
      <div class="list-view-shell">
        <div class="list-cards" data-mobile-list>
          ${mobileCards || '<div class="empty">No items</div>'}
        </div>
        <table class="list-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Level</th>
              <th>Priority</th>
              <th>Project</th>
              <th>Tags</th>
              <th>Created</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    // Inline edit handlers for selects
    listView.querySelectorAll("select").forEach((sel) => {
      sel.addEventListener("change", async (e) => {
        e.stopPropagation();
        const el = sel as HTMLSelectElement;
        const taskId = el.dataset.id;
        const field = el.dataset.field!;
        let value: string | number = el.value;
        if (field === "level") value = parseInt(value);

        const row = el.closest("tr") as HTMLElement | null;
        const project = row?.dataset.project || "";
        const resp = await apiFetch(`/api/task/${taskId}?project=${encodeURIComponent(project)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          if (err.error) showToast(err.error);
          loadListView(); // Revert on error
          return;
        }
        invalidateSummaryCaches(project);
        loadListView();
      });
    });

    // Click title to open detail modal
    listView.querySelectorAll(".col-title").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const host = (el as HTMLElement).closest("[data-id]")! as HTMLElement;
        const id = parseInt(host.dataset.id!);
        const project = host.dataset.project;
        showTaskDetail(id, project);
      });
    });

    applySearchFilter();
  } catch (err) {
    console.error("loadListView failed:", err);
    listView.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Failed to load task list
      </div>
    `;
  }
}

function renderProjectFilter(projects: string[]) {
  const container = document.getElementById("project-filter")!;
  if (projects.length <= 1) {
    container.innerHTML = projects[0]
      ? `<span class="project-label">${projects[0]}</span>`
      : "";
    return;
  }

  const options = projects
    .map(
      (p) =>
        `<option value="${p}" ${p === currentProject ? "selected" : ""}>${p}</option>`
    )
    .join("");

  container.innerHTML = `
    <select id="project-select">
      <option value="">All Projects</option>
      ${options}
    </select>
  `;

  document.getElementById("project-select")!.addEventListener("change", (e) => {
    currentProject = (e.target as HTMLSelectElement).value || null;
    if (currentProject) {
      localStorage.setItem('kanban-project', currentProject);
    } else {
      localStorage.removeItem('kanban-project');
    }
    currentBoardVersion = null;
    currentBoardVersionEtag = null;
    refreshCurrentView();
  });
}

function getInsertBeforeCard(column: HTMLElement, y: number): HTMLElement | null {
  const cards = [...column.querySelectorAll(".card:not(.dragging)")];
  for (const card of cards) {
    const rect = (card as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (y < midY) return card as HTMLElement;
  }
  return null;
}

function clearDropIndicators() {
  document.querySelectorAll(".drop-indicator").forEach((el) => el.remove());
}

function showDropIndicator(column: HTMLElement, beforeCard: HTMLElement | null) {
  clearDropIndicators();
  const indicator = document.createElement("div");
  indicator.className = "drop-indicator";
  if (beforeCard) {
    column.insertBefore(indicator, beforeCard);
  } else {
    column.appendChild(indicator);
  }
}

function setupDragAndDrop() {
  const cards = document.querySelectorAll(".card");
  const columns = document.querySelectorAll(".column-body");

  cards.forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      const ev = e as DragEvent;
      const cardEl = card as HTMLElement;
      ev.dataTransfer!.setData("text/plain", `${cardEl.dataset.project}:${cardEl.dataset.id}`);
      cardEl.classList.add("dragging");
      isDragging = true;
    });
    card.addEventListener("dragend", () => {
      (card as HTMLElement).classList.remove("dragging");
      clearDropIndicators();
      isDragging = false;
    });
  });

  columns.forEach((col) => {
    col.addEventListener("dragover", (e) => {
      e.preventDefault();
      const colEl = col as HTMLElement;
      colEl.classList.add("drag-over");
      const beforeCard = getInsertBeforeCard(colEl, (e as DragEvent).clientY);
      showDropIndicator(colEl, beforeCard);
    });
    col.addEventListener("dragleave", (e) => {
      const colEl = col as HTMLElement;
      // Only remove if actually leaving the column (not entering a child)
      if (!colEl.contains((e as DragEvent).relatedTarget as Node)) {
        colEl.classList.remove("drag-over");
        clearDropIndicators();
      }
    });
    col.addEventListener("drop", async (e) => {
      e.preventDefault();
      const colEl = col as HTMLElement;
      colEl.classList.remove("drag-over");
      clearDropIndicators();

      const ev = e as DragEvent;
      const dragData = ev.dataTransfer!.getData("text/plain");
      const colonIdx = dragData.lastIndexOf(":");
      const dragProject = colonIdx >= 0 ? dragData.slice(0, colonIdx) : "";
      const id = parseInt(colonIdx >= 0 ? dragData.slice(colonIdx + 1) : dragData);
      const newStatus = colEl.dataset.column!;
      const beforeCard = getInsertBeforeCard(colEl, ev.clientY);

      // Find afterId and beforeId
      const cardsInCol = [...colEl.querySelectorAll(".card:not(.dragging)")];
      let afterId: number | null = null;
      let beforeId: number | null = null;

      if (beforeCard) {
        beforeId = parseInt(beforeCard.dataset.id!);
        const idx = cardsInCol.indexOf(beforeCard);
        if (idx > 0) {
          afterId = parseInt((cardsInCol[idx - 1] as HTMLElement).dataset.id!);
        }
      } else if (cardsInCol.length > 0) {
        afterId = parseInt((cardsInCol[cardsInCol.length - 1] as HTMLElement).dataset.id!);
      }

      const resp = await apiFetch(`/api/task/${id}/reorder?project=${encodeURIComponent(dragProject)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, afterId, beforeId }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        if (err.error) {
          // Show brief toast for invalid transitions
          showToast(err.error);
        }
      }
      invalidateSummaryCaches(dragProject);
      loadBoard();
    });
  });
}

function showToast(message: string) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function loadProjectInfo() {
  try {
    const response = await apiFetch("/api/info");
    const info = await response.json() as { projectName?: string };
    if (info.projectName) {
      document.title = `Kanban \u00b7 ${info.projectName}`;
      document.querySelector("header h1")!.textContent = `Kanban \u00b7 ${info.projectName}`;
    }
  } catch {
    // Auth-gated boards keep the default title until unlocked.
  }
}

function switchView(view: "board" | "list" | "chronicle") {
  currentView = view;
  localStorage.setItem(VIEW_STORAGE_KEY, currentView);
  const boardEl = document.getElementById("board")!;
  const listEl = document.getElementById("list-view")!;
  const chronicleEl = document.getElementById("chronicle-view")!;

  // Hide all
  boardEl.classList.add("hidden");
  listEl.classList.add("hidden");
  chronicleEl.classList.add("hidden");
  document.getElementById("tab-board")!.classList.remove("active");
  document.getElementById("tab-list")!.classList.remove("active");
  document.getElementById("tab-chronicle")!.classList.remove("active");

  if (view === "board") {
    boardEl.classList.remove("hidden");
    document.getElementById("tab-board")!.classList.add("active");
    loadBoard();
  } else if (view === "list") {
    listEl.classList.remove("hidden");
    document.getElementById("tab-list")!.classList.add("active");
    loadListView();
  } else {
    chronicleEl.classList.remove("hidden");
    document.getElementById("tab-chronicle")!.classList.add("active");
    loadChronicleView();
  }
}

function refreshCurrentView() {
  if (currentView === "board") loadBoard();
  else if (currentView === "list") loadListView();
  else loadChronicleView();
}

// Restore persisted UI state
(document.getElementById("sort-select") as HTMLSelectElement).value = currentSort;
if (hideOldDone) {
  document.getElementById("hide-done-btn")!.classList.add("active");
}

updateAuthButton();
updateMobileShellState();

document.getElementById("auth-btn")!.addEventListener("click", () => {
  if (authRequired && authReady) {
    showAuthOverlay("Shared token is stored on this device. Use Forget Token to reset it.", "success");
    return;
  }
  showAuthOverlay(authRequired ? "Enter the shared access token to load the board." : "This environment does not require a shared token.");
});

document.getElementById("auth-close")!.addEventListener("click", () => {
  if (authRequired && !authReady) return;
  hideAuthOverlay();
});

document.getElementById("auth-clear-btn")!.addEventListener("click", async () => {
  await clearAuthSession();
  if (authRequired) {
    showAuthOverlay("Stored token cleared. Enter a shared access token to continue.");
  } else {
    hideAuthOverlay();
    setAuthMessage("Stored token cleared.");
  }
});

document.getElementById("auth-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("auth-token-input") as HTMLInputElement;
  const token = input.value.trim();
  if (!token) {
    setAuthMessage("Enter the shared access token.", "error");
    return;
  }
  setAuthMessage("Unlocking board...", "default");
  try {
    await establishAuthSession(token);
    setAuthMessage("Board unlocked.", "success");
    await loadProjectInfo();
    ensureRealtimeSync();
    refreshCurrentView();
  } catch (error) {
    setAuthMessage(error instanceof Error ? error.message : "Board authentication failed.", "error");
  }
});

// Tab switching
document.getElementById("tab-board")!.addEventListener("click", () => switchView("board"));
document.getElementById("tab-list")!.addEventListener("click", () => switchView("list"));
document.getElementById("tab-chronicle")!.addEventListener("click", () => switchView("chronicle"));

document.getElementById("toolbar-mobile-toggle")!.addEventListener("click", () => {
  mobileFiltersOpen = !mobileFiltersOpen;
  updateMobileShellState();
});

MOBILE_MEDIA_QUERY.addEventListener("change", (event) => {
  syncViewportState(event.matches);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !authReady) return;
  clearBoardCaches();
  refreshCurrentView();
});

// SSE: server pushes refresh events on any data mutation
function connectSSE() {
  if (sseConnected) return;
  sseConnected = true;
  const es = new EventSource("/api/events");
  es.onmessage = () => {
    if (isDragging) return;
    const detailOpen = !document.getElementById("modal-overlay")!.classList.contains("hidden");
    const addOpen = !document.getElementById("add-card-overlay")!.classList.contains("hidden");
    if (!detailOpen && !addOpen) refreshCurrentView();
  };
  es.onerror = () => {
    es.close();
    sseConnected = false;
    if (!authRequired || authReady) {
      setTimeout(connectSSE, 5000);
    }
  };
}

// Refresh button
document.getElementById("refresh-btn")!.addEventListener("click", refreshCurrentView);

// Search — DOM filter, no API re-fetch
document.getElementById("search-input")!.addEventListener("input", (e) => {
  currentSearch = (e.target as HTMLInputElement).value.trim();
  if (currentView === "board") {
    loadBoard();
    return;
  }
  applySearchFilter();
});

// Sort — requires re-render
document.getElementById("sort-select")!.addEventListener("change", (e) => {
  currentSort = (e.target as HTMLSelectElement).value;
  localStorage.setItem('kanban-sort', currentSort);
  refreshCurrentView();
});

// Hide old done toggle
document.getElementById("hide-done-btn")!.addEventListener("click", () => {
  hideOldDone = !hideOldDone;
  localStorage.setItem('kanban-hide-old', String(hideOldDone));
  document.getElementById("hide-done-btn")!.classList.toggle("active", hideOldDone);
  applySearchFilter();
});

// Close modal
document.getElementById("modal-close")!.addEventListener("click", () => {
  document.getElementById("modal-overlay")!.classList.add("hidden");
  syncOverlayState();
});
document.getElementById("modal-overlay")!.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById("modal-overlay")!.classList.add("hidden");
    syncOverlayState();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("modal-overlay")!.classList.add("hidden");
    document.getElementById("add-card-overlay")!.classList.add("hidden");
    if (!document.getElementById("auth-overlay")!.classList.contains("hidden") && authReady) {
      hideAuthOverlay();
    }
    syncOverlayState();
  }
});

// Add card modal
const addCardOverlay = document.getElementById("add-card-overlay")!;
let pendingFiles: File[] = [];

function renderAddAttachmentPreview() {
  const preview = document.getElementById("add-attachment-preview")!;
  if (pendingFiles.length === 0) {
    preview.innerHTML = "";
    return;
  }
  preview.innerHTML = pendingFiles.map((f, i) => `
    <div class="attachment-thumb">
      <img src="${URL.createObjectURL(f)}" alt="${f.name}" />
      <button class="attachment-remove" data-idx="${i}" title="Remove" type="button">&times;</button>
      <span class="attachment-name">${f.name}</span>
    </div>
  `).join("");
  preview.querySelectorAll(".attachment-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt((btn as HTMLElement).dataset.idx!);
      pendingFiles.splice(idx, 1);
      renderAddAttachmentPreview();
    });
  });
}

function addPendingFiles(files: FileList | File[]) {
  for (const f of Array.from(files)) {
    if (f.type.startsWith("image/")) pendingFiles.push(f);
  }
  renderAddAttachmentPreview();
}

document.getElementById("add-card-close")!.addEventListener("click", () => {
  addCardOverlay.classList.add("hidden");
  pendingFiles = [];
  renderAddAttachmentPreview();
  syncOverlayState();
});
addCardOverlay.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    addCardOverlay.classList.add("hidden");
    pendingFiles = [];
    renderAddAttachmentPreview();
    syncOverlayState();
  }
});

// Add card attachment drop zone
const addAttachZone = document.getElementById("add-attachment-zone")!;
const addAttachInput = document.getElementById("add-attachment-input") as HTMLInputElement;
addAttachZone.addEventListener("click", () => addAttachInput.click());
addAttachZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  addAttachZone.classList.add("drop-active");
});
addAttachZone.addEventListener("dragleave", () => {
  addAttachZone.classList.remove("drop-active");
});
addAttachZone.addEventListener("drop", (e) => {
  e.preventDefault();
  addAttachZone.classList.remove("drop-active");
  const files = (e as DragEvent).dataTransfer?.files;
  if (files) addPendingFiles(files);
});
addAttachInput.addEventListener("change", () => {
  if (addAttachInput.files) addPendingFiles(addAttachInput.files);
  addAttachInput.value = "";
});

document.getElementById("add-card-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = (document.getElementById("add-title") as HTMLInputElement).value.trim();
  if (!title) return;

  const priority = (document.getElementById("add-priority") as HTMLSelectElement).value;
  const level = parseInt((document.getElementById("add-level") as HTMLSelectElement).value) || 3;
  const description = (document.getElementById("add-description") as HTMLTextAreaElement).value.trim() || null;
  const tagsRaw = (document.getElementById("add-tags") as HTMLInputElement).value.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null;

  const project = currentProject;
  if (!project) {
    showToast("Select a project first");
    return;
  }

  const submitBtn = document.querySelector("#add-card-form .form-submit") as HTMLButtonElement;
  submitBtn.textContent = pendingFiles.length > 0 ? "Creating..." : "Add Card";
  submitBtn.disabled = true;

  const res = await apiFetch("/api/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, priority, level, description, tags, project }),
  });
  const result = await res.json();

  // Upload pending attachments
  if (pendingFiles.length > 0 && result.id) {
    await uploadFiles(result.id, pendingFiles as any, project);
  }

  pendingFiles = [];
  submitBtn.textContent = "Add Card";
  submitBtn.disabled = false;
  (document.getElementById("add-card-form") as HTMLFormElement).reset();
  renderAddAttachmentPreview();
  addCardOverlay.classList.add("hidden");
  syncOverlayState();
  invalidateSummaryCaches(project);
  refreshCurrentView();
});

bootstrapAuth()
  .then(async (ready) => {
    if (!ready) return;
    await loadProjectInfo();
    switchView(currentView);
    ensureRealtimeSync();
  })
  .catch(() => {
    showAuthOverlay("Unable to initialize board authentication.", "error");
  });

registerServiceWorker();
