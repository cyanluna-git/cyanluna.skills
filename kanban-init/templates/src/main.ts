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

const COLUMNS = [
  { key: "todo", label: "To Do", icon: "\u{1F4CB}" },
  { key: "inprogress", label: "In Progress", icon: "\u{1F528}" },
  { key: "review", label: "Review", icon: "\u{1F50D}" },
  { key: "done", label: "Done", icon: "\u2705" },
];

let currentProject: string | null = null;
let isDragging = false;

function priorityClass(priority: string): string {
  if (priority === "high") return "high";
  if (priority === "medium") return "medium";
  if (priority === "low") return "low";
  return "";
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
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

function parseReviewComments(task: Task): any[] {
  if (!task.review_comments) return [];
  try {
    return JSON.parse(task.review_comments);
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

  const reviewComments = parseReviewComments(task);
  const lastReview = reviewComments.length > 0 ? reviewComments[reviewComments.length - 1] : null;
  const reviewBadge = lastReview
    ? `<span class="badge ${lastReview.status === 'approved' ? 'review-approved' : 'review-changes'}">${
        lastReview.status === 'approved' ? 'Approved' : 'Changes Requested'
      }</span>`
    : task.status === 'review'
      ? '<span class="badge review-pending">Awaiting Review</span>'
      : '';

  const tags = parseTags(task.tags)
    .map((t) => `<span class="tag">${t}</span>`)
    .join("");

  const desc = task.description
    ? task.description.split("\n")[0].slice(0, 80)
    : "";

  return `
    <div class="card" draggable="true" data-id="${task.id}" data-status="${task.status}">
      <div class="card-header">
        <span class="card-id">#${task.id}</span>
        ${priorityBadge}
        ${reviewBadge}
      </div>
      <div class="card-title">${task.title}</div>
      ${desc ? `<div class="card-desc">${desc}</div>` : ""}
      <div class="card-footer">
        ${projectBadge}
        ${dateBadge}
      </div>
      ${tags ? `<div class="card-tags">${tags}</div>` : ""}
    </div>
  `;
}

function renderColumn(
  key: string,
  label: string,
  icon: string,
  tasks: Task[]
): string {
  const cardsHtml = tasks.map(renderCard).join("");
  const addBtn = key === "todo"
    ? `<button class="add-card-btn" id="add-card-btn" title="Add card">+</button>`
    : "";
  return `
    <div class="column ${key}" data-column="${key}">
      <div class="column-header">
        <span>${icon} ${label}</span>
        <div class="column-header-right">
          ${addBtn}
          <span class="count">${tasks.length}</span>
        </div>
      </div>
      <div class="column-body" data-column="${key}">
        ${cardsHtml || '<div class="empty">No items</div>'}
      </div>
    </div>
  `;
}

function simpleMarkdownToHtml(md: string): string {
  // Extract code blocks first to protect them
  const codeBlocks: string[] = [];
  let text = md.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/, "").replace(/```$/, "");
    codeBlocks.push(`<pre><code>${code}</code></pre>`);
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  // Inline formatting
  text = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  // Process line by line to build proper block structure
  const lines = text.split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Code block placeholder
    const cbMatch = trimmed.match(/^\x00CB(\d+)\x00$/);
    if (cbMatch) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
      out.push(codeBlocks[parseInt(cbMatch[1])]);
      continue;
    }

    // Headings
    const h3 = trimmed.match(/^### (.+)$/);
    if (h3) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
      out.push(`<h3>${h3[1]}</h3>`);
      continue;
    }
    const h2 = trimmed.match(/^## (.+)$/);
    if (h2) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
      out.push(`<h2>${h2[1]}</h2>`);
      continue;
    }
    const h1 = trimmed.match(/^# (.+)$/);
    if (h1) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
      out.push(`<h1>${h1[1]}</h1>`);
      continue;
    }

    // Unordered list
    const ul = trimmed.match(/^[-*]\s+(.+)$/);
    if (ul) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${ul[1]}</li>`);
      continue;
    }

    // Ordered list
    const ol = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${ol[1]}</li>`);
      continue;
    }

    // Close open lists on non-list lines
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }

    // Empty line = paragraph break, non-empty = paragraph
    if (trimmed === "") {
      out.push("");
    } else {
      out.push(`<p>${trimmed}</p>`);
    }
  }
  if (inUl) out.push("</ul>");
  if (inOl) out.push("</ol>");

  return out.join("\n");
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
      </div>
      <div class="phase-body">${body}</div>
    </div>
  `;
}

async function showTaskDetail(id: number) {
  const overlay = document.getElementById("modal-overlay")!;
  const content = document.getElementById("modal-content")!;
  content.innerHTML = '<div style="color:#94a3b8">Loading...</div>';
  overlay.classList.remove("hidden");

  try {
    const res = await fetch(`/api/task/${id}`);
    const task: Task = await res.json();

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
      task.reviewed_at
        ? `<strong>Reviewed:</strong> ${task.reviewed_at.slice(0, 10)}`
        : "",
      task.completed_at
        ? `<strong>Completed:</strong> ${task.completed_at.slice(0, 10)}`
        : "",
    ]
      .filter(Boolean)
      .join(" &nbsp;|&nbsp; ");

    const statusPhase: Record<string, number> = {
      todo: 0, inprogress: 1, review: 3, done: 4,
    };
    const currentPhase = statusPhase[task.status] ?? 0;

    const reqBody = task.description
      ? simpleMarkdownToHtml(task.description)
      : `<span class="phase-empty">Not yet documented</span>`;
    const requirementSection = `
      <div class="lifecycle-phase phase-requirement ${currentPhase === 0 ? 'active' : ''}">
        <div class="phase-header">
          <span class="phase-icon">\u{1F4CB}</span>
          <span class="phase-label">Requirements</span>
          <button class="phase-edit-btn" id="req-edit-btn" title="Edit">&#9998;</button>
        </div>
        <div class="phase-body" id="req-body-view">${reqBody}</div>
        <div class="phase-body hidden" id="req-body-edit">
          <textarea id="req-textarea" rows="8">${(task.description || '').replace(/</g, '&lt;')}</textarea>
          <div class="phase-edit-actions">
            <button class="phase-save-btn" id="req-save-btn">Save</button>
            <button class="phase-cancel-btn" id="req-cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
    `;

    const planSection = renderLifecycleSection(
      'Plan', '\u{1F5FA}\uFE0F', 'phase-plan',
      task.plan, currentPhase === 1 && !task.plan
    );

    const implSection = renderLifecycleSection(
      'Implementation', '\u{1F528}', 'phase-impl',
      task.implementation_notes, currentPhase === 1 && !!task.plan
    );

    const reviewComments = parseReviewComments(task);
    const reviewContent = reviewComments.length > 0
      ? reviewComments.map((rc: any) => `
          <div class="review-entry ${rc.status}">
            <div class="review-header">
              <span class="badge ${rc.status === 'approved' ? 'review-approved' : 'review-changes'}">
                ${rc.status === 'approved' ? 'Approved' : 'Changes Requested'}
              </span>
              <span class="review-meta">${rc.reviewer || ''} &middot; ${rc.timestamp?.slice(0, 16) || ''}</span>
            </div>
            <div class="review-comment">${simpleMarkdownToHtml(rc.comment || '')}</div>
          </div>
        `).join('')
      : null;
    const reviewSection = reviewContent || currentPhase === 3
      ? renderLifecycleSection(
          'Review', '\u{1F50D}', 'phase-review',
          null, currentPhase === 3
        ).replace(
          '<div class="phase-body">',
          `<div class="phase-body">${reviewContent || ''}`
        ).replace(
          '<span class="phase-empty">Not yet documented</span>',
          reviewContent ? '' : '<span class="phase-empty">Awaiting review</span>'
        )
      : '';

    const phases = ['Requirements', 'Plan', 'Implementation', 'Review', 'Done'];
    const progressHtml = `
      <div class="lifecycle-progress">
        ${phases.map((p, i) => `
          <div class="progress-step ${i < currentPhase ? 'completed' : ''} ${i === currentPhase ? 'current' : ''}">
            <div class="step-dot"></div>
            <span class="step-label">${p}</span>
          </div>
        `).join('<div class="progress-line"></div>')}
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
        ${implSection}
        ${reviewSection}
      </div>
    `;

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
      await fetch(`/api/task/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDesc }),
      });
      showTaskDetail(id);
    });
  } catch {
    content.innerHTML = '<div style="color:#ef4444">Failed to load</div>';
  }
}

async function moveTask(id: number, newStatus: string) {
  await fetch(`/api/task/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newStatus }),
  });
  loadBoard();
}

async function loadBoard() {
  const board = document.getElementById("board")!;
  const params = currentProject ? `?project=${encodeURIComponent(currentProject)}` : "";

  try {
    const res = await fetch(`/api/board${params}`);
    const data: Board = await res.json();

    renderProjectFilter(data.projects);

    board.innerHTML = COLUMNS.map((col) =>
      renderColumn(
        col.key,
        col.label,
        col.icon,
        data[col.key as keyof Pick<Board, "todo" | "inprogress" | "review" | "done">]
      )
    ).join("");

    const total = data.todo.length + data.inprogress.length + data.review.length + data.done.length;
    document.getElementById("count-summary")!.textContent =
      `${data.done.length}/${total} completed`;

    board.querySelectorAll(".card").forEach((el) => {
      el.addEventListener("click", () => {
        const id = parseInt((el as HTMLElement).dataset.id!);
        showTaskDetail(id);
      });
    });

    setupDragAndDrop();

    const addBtn = document.getElementById("add-card-btn");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("add-card-overlay")!.classList.remove("hidden");
        (document.getElementById("add-title") as HTMLInputElement).focus();
      });
    }
  } catch {
    board.innerHTML = `
      <div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#ef4444;font-size:0.9rem;padding:48px">
        Cannot find .claude/kanban.db
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
    loadBoard();
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
      ev.dataTransfer!.setData("text/plain", (card as HTMLElement).dataset.id!);
      (card as HTMLElement).classList.add("dragging");
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
      if (!colEl.contains(e.relatedTarget as Node)) {
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
      const id = parseInt(ev.dataTransfer!.getData("text/plain"));
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

      await fetch(`/api/task/${id}/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, afterId, beforeId }),
      });
      loadBoard();
    });
  });
}

// Set tab title to project name
fetch("/api/info")
  .then((r) => r.json())
  .then((info: { projectName: string }) => {
    if (info.projectName) {
      document.title = `Kanban · ${info.projectName}`;
      document.querySelector("header h1")!.textContent = `Kanban · ${info.projectName}`;
    }
  })
  .catch(() => {});

// Init
loadBoard();

// Auto-refresh every 10 seconds (pause when modal is open or dragging)
setInterval(() => {
  if (isDragging) return;
  const detailOpen = !document.getElementById("modal-overlay")!.classList.contains("hidden");
  const addOpen = !document.getElementById("add-card-overlay")!.classList.contains("hidden");
  if (!detailOpen && !addOpen) {
    loadBoard();
  }
}, 10000);

// Refresh button
document.getElementById("refresh-btn")!.addEventListener("click", loadBoard);

// Close modal
document.getElementById("modal-close")!.addEventListener("click", () => {
  document.getElementById("modal-overlay")!.classList.add("hidden");
});
document.getElementById("modal-overlay")!.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    document.getElementById("modal-overlay")!.classList.add("hidden");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("modal-overlay")!.classList.add("hidden");
    document.getElementById("add-card-overlay")!.classList.add("hidden");
  }
});

// Add card modal
const addCardOverlay = document.getElementById("add-card-overlay")!;
document.getElementById("add-card-close")!.addEventListener("click", () => {
  addCardOverlay.classList.add("hidden");
});
addCardOverlay.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    addCardOverlay.classList.add("hidden");
  }
});

document.getElementById("add-card-form")!.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = (document.getElementById("add-title") as HTMLInputElement).value.trim();
  if (!title) return;

  const priority = (document.getElementById("add-priority") as HTMLSelectElement).value;
  const description = (document.getElementById("add-description") as HTMLTextAreaElement).value.trim() || null;
  const tagsRaw = (document.getElementById("add-tags") as HTMLInputElement).value.trim();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : null;

  const project = currentProject || undefined;

  await fetch("/api/task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, priority, description, tags, project }),
  });

  (document.getElementById("add-card-form") as HTMLFormElement).reset();
  addCardOverlay.classList.add("hidden");
  loadBoard();
});
