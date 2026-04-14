---
name: kanban-refine
description: Refine backlog requirements through structured user interview. Turns rough task descriptions into concrete, actionable requirements with goal, scope, acceptance criteria, and edge cases.
license: MIT
---

> Shared context: read `../kanban/shared.md` for pipeline levels, status transitions, API endpoints, error handling, and agent context flow.

## `/kanban-refine <ID>` — Refine Backlog Requirements

Reads a rough backlog item and refines it into concrete, actionable requirements through structured user interview.

**Target**: tasks in `todo` status (backlog). If the task is not `todo`, warn the user and confirm before proceeding.

### Procedure

```
① Read the task
   TASK = curl GET /api/task/$ID?project=$PROJECT
   Extract: title, description, priority, level, tags

① ½. Look for prior implementation context (always run this before the interview)

   a. Check description and tags for dependency hints:
      - "Depends on: #NNN" lines in description
      - Tags like "after:NNN", "follows:NNN"

   b. If dependency found → fetch that card's implementation output:
      PRIOR = curl GET /api/task/$NNN?project=$PROJECT&fields=title,implementation_notes,plan
      Also inspect the actual codebase: read files, interfaces, schemas confirmed in that card.

   c. If no explicit dependency → ask ONE question before the main interview:
      "Is there a prior task whose implementation this builds on? (task ID or 'none')"
      If the user gives an ID, fetch it as in (b).
      If "none" or new work → skip, proceed with regular interview.

   d. Summarize what was confirmed from prior implementation:
      PRIOR_CONTEXT = {
        confirmed interfaces, schemas, file paths, component names, API routes, etc.
      }
      This context is injected into ③ (gap analysis) and ⑤ (description synthesis).

② Display current state
   Show the user their raw title + description as-is.
   If PRIOR_CONTEXT exists, also show: "Prior implementation context: [summary]"

③ Analyze for gaps
   Identify what's missing or vague across these dimensions:
   - WHAT: What exactly should be built/changed?
   - WHY: What problem does this solve? What's the motivation?
   - SCOPE: What's included vs excluded?
   - ACCEPTANCE: How do we know it's done?
   - CONSTRAINTS: Technical limitations, compatibility, performance?
   - EDGE CASES: Error states, boundary conditions?
   - DEPENDENCIES: Does it depend on other tasks or external systems?

④ Interview the user (MANDATORY)
   Use AskUserQuestion to ask about the gaps found in ③.
   Rules:
   - Ask 1–4 focused questions per round (AskUserQuestion limit)
   - Group related questions in one round
   - Run multiple rounds if needed (max 3 rounds)
   - Stop early if the user says "enough" or all gaps are filled
   - Don't ask about things that are already clear
   - Use concrete options when possible, not open-ended questions

⑤ Synthesize refined description
   Rewrite the description using this template.
   If PRIOR_CONTEXT exists, ground scope/requirements/constraints in confirmed interfaces
   and file paths from the prior implementation — not assumptions.

   ## Goal
   [1–2 sentences: what this task achieves and why]

   ## Prior Implementation Context  ← include only if PRIOR_CONTEXT exists
   [Confirmed interfaces, schemas, components, or file paths from the prior card
    that this task directly builds on. e.g. "POST /api/items → {id, name} per #201"]

   ## Scope
   - IN: [bulleted list of what's included]
   - OUT: [bulleted list of what's explicitly excluded]

   ## Requirements
   [Numbered list of concrete, testable requirements]

   ## Acceptance Criteria
   - [ ] [Checklist items — each verifiable]

   ## Constraints
   [Technical constraints, if any identified]

   ## Edge Cases
   [Edge cases to handle, if any identified]

   Omit sections that have no content (e.g., skip Constraints if none).

⑥ Present the refined description to the user
   Show the full refined description in a code block.
   Ask user to confirm with AskUserQuestion:
   - "Approve & save" (update the task)
   - "Edit more" (go back to interview)
   - "Cancel" (discard changes)

⑦ Save
   If approved:
   - PATCH description via API
   - Also update title if it was clarified during interview
   - Update level/priority/tags if discussed
   - Append to agent_log:
     { "agent": "Refiner", "model": "<MODEL_REFINER>", "message": "Requirements refined. N questions across M rounds.", "timestamp": "..." }

### Model Routing

Resolve `MODEL_REFINER` from `../kanban/models.json`:

```bash
MODEL_PROVIDER=${KANBAN_MODEL_PROVIDER:-}
if [ -z "$MODEL_PROVIDER" ] && [ -n "${CODEX_THREAD_ID:-}${CODEX_CI:-}" ]; then MODEL_PROVIDER=codex; fi
if [ -z "$MODEL_PROVIDER" ] && [ -n "${CLAUDE_PROJECT_DIR:-}${CLAUDECODE:-}" ]; then MODEL_PROVIDER=claude; fi
if [ -z "$MODEL_PROVIDER" ] && [ -d .claude ]; then MODEL_PROVIDER=claude; fi
if [ -z "$MODEL_PROVIDER" ] && [ -d .codex ]; then MODEL_PROVIDER=codex; fi

MODEL_REFINER=$(python3 - "$MODEL_PROVIDER" <<'PY'
import json, pathlib, sys
d = json.loads(pathlib.Path("../kanban/models.json").read_text())
provider = sys.argv[1] or d["default_provider"]
print(d["providers"][provider]["refiner"])
PY
)
```
```

### Interview Tips

- If the user wrote "로그인 기능 추가" → ask: OAuth/email? Session/JWT? Which pages need auth guards?
- If the user wrote "성능 개선" → ask: Which page/API? Current latency? Target latency? Measurement method?
- If the user wrote "UI 수정" → ask: Which component? What's wrong now? Mockup/reference? Responsive?
- Prefer showing concrete options over open-ended "어떤 걸 원하세요?"
