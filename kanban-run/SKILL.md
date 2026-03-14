---
name: kanban-run
description: Run the AI team pipeline for kanban tasks — orchestration loop with 6 agents (Planner, Critic, Builder, Shield, Inspector, Ranger), single-step execution, and code review. Use /kanban-run to execute tasks through the 7-column pipeline.
license: MIT
---

> Shared context: read `../kanban/shared.md` for pipeline levels, status transitions, API endpoints, error handling, and agent context flow.
> Schema: read `../kanban/schema.md` for full DB schema, column descriptions, and JSON field formats.

## Commands

### `/kanban-run step <ID>` — Single Step

Execute only the next pipeline step then exit. Same logic as `/kanban-run` but no loop.

### `/kanban-run <ID> [--auto]` — Run Full Pipeline

**Default**: pause for user confirmation at Plan Review and Impl Review approvals.
**`--auto`**: fully automatic (circuit breaker still fires).

#### Orchestration Loop (Level-Aware)

```
L1 Quick:
  todo → Worker(builder) implements → commit → done

L2 Standard:
  todo → Plan Agent(planner) → impl (skip plan_review)
  impl → Worker(builder) + TDD Tester(shield) → impl_review
  impl_review → Code Review → [user confirm] → commit → done / reject → impl

L3 Full:
  todo → Plan Agent(planner) → plan_review
  plan_review → Review Agent(critic) → [user confirm] → impl / reject → plan
  impl → Worker(builder) + TDD Tester(shield) → impl_review
  impl_review → Code Review(inspector) → [user confirm] → test / reject → impl
  test → Test Runner(ranger) → pass → commit → done / fail → impl

Circuit breaker: plan_review_count > 3 OR impl_review_count > 3 → stop, ask user
```

Read the task's `level` field first to determine which steps to execute.

#### Model Routing (Provider-Aware)

Resolve real model names from `../kanban/models.json` using provider:

- `KANBAN_MODEL_PROVIDER` env var if set (`claude` or `codex`)
- else `codex` when `CODEX_*` env is present
- else `claude` when `CLAUDE_*` env is present
- else `claude` when `.claude/` exists
- else `codex` when `.codex/` exists
- else `default_provider` from `models.json`

```bash
MODEL_PROVIDER=${KANBAN_MODEL_PROVIDER:-}
if [ -z "$MODEL_PROVIDER" ] && [ -n "${CODEX_THREAD_ID:-}${CODEX_CI:-}" ]; then MODEL_PROVIDER=codex; fi
if [ -z "$MODEL_PROVIDER" ] && [ -n "${CLAUDE_PROJECT_DIR:-}${CLAUDECODE:-}" ]; then MODEL_PROVIDER=claude; fi
if [ -z "$MODEL_PROVIDER" ] && [ -d .claude ]; then MODEL_PROVIDER=claude; fi
if [ -z "$MODEL_PROVIDER" ] && [ -d .codex ]; then MODEL_PROVIDER=codex; fi

read_model() {
  local key="$1"
  python3 - "$MODEL_PROVIDER" "$key" <<'PY'
import json, pathlib, sys
p = pathlib.Path("../kanban/models.json")
d = json.loads(p.read_text())
provider = sys.argv[1] or d["default_provider"]
key = sys.argv[2]
print(d["providers"][provider][key])
PY
}

read_effort() {
  local key="$1"
  python3 - "$MODEL_PROVIDER" "$key" <<'PY'
import json, pathlib, sys
p = pathlib.Path("../kanban/models.json")
d = json.loads(p.read_text())
provider = sys.argv[1] or d["default_provider"]
key = sys.argv[2]
print(d.get("reasoning_effort", {}).get(provider, {}).get(key, ""))
PY
}

MODEL_PLANNER=$(read_model planner)
MODEL_CRITIC=$(read_model critic)
MODEL_BUILDER=$(read_model builder)
MODEL_SHIELD=$(read_model shield)
MODEL_INSPECTOR=$(read_model inspector)
MODEL_RANGER=$(read_model ranger)
EFFORT_PLANNER=$(read_effort planner)
EFFORT_CRITIC=$(read_effort critic)
EFFORT_BUILDER=$(read_effort builder)
EFFORT_SHIELD=$(read_effort shield)
EFFORT_INSPECTOR=$(read_effort inspector)
EFFORT_RANGER=$(read_effort ranger)
```

#### Implementation

```bash
# 1. Read current task state (status + level only)
TASK=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=status,level")
STATUS=$(echo "$TASK" | jq -r '.status')

# 2. Dispatch agent (see Agent Dispatch below)
# 3. After agent: append to agent_log (see schema.md for format)
# 4. Re-read state, loop until done or circuit breaker
```

#### Agent Nicknames & Identity

Each agent has a fixed **nickname** used consistently across all records. The task card becomes a work log — every field and every log entry is signed.

| Nickname | Role | Model Key | Reasoning Effort (codex) | Status trigger |
|----------|------|-------|---------------------------|----------------|
| `Planner` | Plan Agent | `planner` | `high` | `todo` |
| `Critic` | Plan Review Agent | `critic` | `medium` | `plan_review` |
| `Builder` | Worker Agent | `builder` | `high` | `impl` (step 1) |
| `Shield` | TDD Tester | `shield` | `medium` | `impl` (step 2) |
| `Inspector` | Code Review Agent | `inspector` | `medium` | `impl_review` |
| `Ranger` | Test Runner | `ranger` | `medium` | `test` |

> See `../kanban/schema.md` for JSON formats and the Signature Header Rule.

#### Agent Dispatch

Template files are at `../kanban/templates/`.

| Status | Template | Nickname | Model Key |
|--------|----------|----------|-------|
| `todo` | `templates/plan-agent.md` | `Planner` | `planner` |
| `plan_review` | `templates/review-agent.md` | `Critic` | `critic` |
| `impl` step 1 | `templates/worker-agent.md` | `Builder` | `builder` |
| `impl` step 2 | `templates/tdd-tester.md` | `Shield` | `shield` |
| `impl_review` | `templates/code-review-agent.md` | `Inspector` | `inspector` |
| `test` | `templates/test-runner.md` | `Ranger` | `ranger` |

**Agent minimum fields (fetch only what each agent needs):**

| Nickname | Required Fields |
|----------|----------------|
| `Planner` | `title,description` |
| `Critic` | `title,description,plan,decision_log,done_when` |
| `Builder` | `title,description,plan,done_when,plan_review_comments` |
| `Shield` | `title,description,implementation_notes` |
| `Inspector` | `title,description,plan,done_when,implementation_notes` |
| `Ranger` | `title,implementation_notes` |

**Dispatch procedure — execute in this order for every agent:**

```
⓪ Fetch project brief (once per pipeline run, cache for all agents)
   PROJECT_DATA = curl GET /api/projects/$PROJECT
   PROJECT_BRIEF = extract .brief field (empty string if null or project not found)
   This is injected into every agent template via <project_brief> placeholder.

① Read task fields (use per-agent fields to minimize token usage)
   # Planner
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description
   # Critic
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,decision_log,done_when
   # Builder
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,done_when,plan_review_comments
   # Shield
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,implementation_notes
   # Inspector
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,done_when,implementation_notes
   # Ranger
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,implementation_notes
   Extract only the fields listed above for each agent

② Mark agent as active
   curl PATCH /api/task/$ID  →  { "current_agent": "<Nickname>" }

③ Read template file
   Read tool: ../kanban/templates/<agent>.md

④ Fill placeholders in template
   Replace every occurrence of:
     <ID>                     → actual task ID
     <PROJECT>                → actual project name
     <project_brief>          → project brief from step ⓪ (empty string if not set)
     <title>                  → task title
     <description>            → task description (requirements)
     <plan>                   → plan field value
     <decision_log>           → decision_log field value
     <done_when>              → done_when field value
     <implementation_notes>   → implementation_notes field value
     <plan_review_comments>   → plan_review_comments field value
     <TIMESTAMP>              → current UTC time (ISO 8601)
     <MODEL_PLANNER>          → $MODEL_PLANNER
     <MODEL_CRITIC>           → $MODEL_CRITIC
     <MODEL_BUILDER>          → $MODEL_BUILDER
     <MODEL_SHIELD>           → $MODEL_SHIELD
     <MODEL_INSPECTOR>        → $MODEL_INSPECTOR
     <MODEL_RANGER>           → $MODEL_RANGER
     <EFFORT_PLANNER>         → $EFFORT_PLANNER
     <EFFORT_CRITIC>          → $EFFORT_CRITIC
     <EFFORT_BUILDER>         → $EFFORT_BUILDER
     <EFFORT_SHIELD>          → $EFFORT_SHIELD
     <EFFORT_INSPECTOR>       → $EFFORT_INSPECTOR
     <EFFORT_RANGER>          → $EFFORT_RANGER

   Recommended helper script:
   ```bash
   PROMPT=$(python3 ../kanban/scripts/render_agent_prompt.py \
     --template ../kanban/templates/<agent>.md \
     --models ../kanban/models.json \
     --provider "$MODEL_PROVIDER" \
     --set ID="$ID" \
     --set PROJECT="$PROJECT" \
     --set project_brief="$PROJECT_BRIEF" \
     --set title="$TITLE" \
     --set description="$DESCRIPTION" \
     --set plan="$PLAN" \
     --set decision_log="$DECISION_LOG" \
     --set done_when="$DONE_WHEN" \
     --set implementation_notes="$IMPLEMENTATION_NOTES" \
     --set plan_review_comments="$PLAN_REVIEW_COMMENTS" \
     --set TIMESTAMP="$TIMESTAMP")
   ```
   If a field is missing, pass empty string (`--set key=""`).
   Use `--strict` only when every unresolved `<...>` token should be treated as an error.

⑤ Launch Task tool with filled prompt
   If MODEL_PROVIDER is `codex`:
   Task(
     subagent_type         = "general-purpose",
     model                 = "<resolved model from models.json>",
     model_reasoning_effort= "<resolved effort from models.json>",
     prompt                = <filled template content>
   )

   Otherwise (`claude`):
   Task(
     subagent_type = "general-purpose",
     model         = "<resolved model from models.json>",
     prompt        = <filled template content>
   )

⑥ After Task completes — append signed entry to agent_log
   (use schema.md › "Appending to agent_log" snippet,
    set agent=<Nickname>, model=<model>, message=<summary>)
```

After Builder + Shield both complete, move to `impl_review`:
```bash
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "impl_review", "current_agent": null}'
```

**Default mode**: after `plan_review` and `impl_review` agents complete, ask user with AskUserQuestion to accept/reject before advancing.
**Auto mode (`--auto`)**: auto-accept the agent's decision.

#### → Done Transition (all levels)

```bash
# 1. Commit pending changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A
  git commit -m "feat: <TITLE> [kanban #<ID>]"
fi
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

# 2. Move to done
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "done"}'

# 3. Record commit hash in notes
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task/$ID/note?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"content\": \"Commit: $COMMIT_HASH\"}"
```

If no commits yet, skip note or record `"Commit: (none)"`.

### `/kanban-run review <ID>` — Code Review

Trigger Code Review agent for a task in `impl_review` status (same as impl_review step).
