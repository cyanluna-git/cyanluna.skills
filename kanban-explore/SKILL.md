---
name: kanban-explore
description: Codebase exploration skill for uncertain implementation direction. Deeply explores the codebase, produces a direction report, and creates phased kanban tasks. Use when you don't know exactly how to implement something. NOT for direct implementation.
license: MIT
---

> Shared context: read `~/.claude/skills/kanban/shared.md` for DB path, pipeline levels, status transitions, API endpoints, and error handling.

## `/kanban-explore [topic]` — Explore & Plan

**When to use**: You have a vague idea or problem but don't know *how* to implement it.
This skill explores first, reports direction, then seeds the kanban board with phased tasks.
**This skill does NOT write code.**

---

### Procedure

```
① Receive and validate topic

   If topic is missing (no argument):
   → Immediately enter the clarification interview (skip to ①-B).

   ①-A Check for missing context (NOT word count):
   A topic lacks context if ANY of these are true:
   - No indication of which part of the codebase is involved
   - The "why" is completely absent (what problem does this solve?)
   - The scope is unbounded ("improve everything", "refactor")

   If context is missing → ①-B
   If the topic is self-sufficient (e.g. "add dark mode toggle to settings page") → skip to ②

   ①-B Clarification (one round, max 2 questions via AskUserQuestion):
   - "What problem are you trying to solve or what outcome do you want?"
   - "Is there a specific area of the codebase you suspect is involved, or is it unknown?"
   Do NOT ask more than 2 questions in this round.

② Deep codebase exploration (Task → Explore agent)

   Launch a Task subagent with subagent_type="Explore".
   Pass the following prompt — fill in <TOPIC> and <PROJECT> before launching:

   ───────────────────────────────────────────────
   You are performing a pre-implementation exploration for the topic: "<TOPIC>"
   Project: <PROJECT>
   Thoroughness: very thorough

   Investigate the following areas IN ORDER and report findings for each:

   A. PROJECT STRUCTURE
      - List top-level directories and their roles (1 line each)
      - Identify main entry files (main.ts, index.ts, app.ts, server.ts, etc.)
      - Read key config files: package.json (dependencies), tsconfig, vite.config or equivalent

   B. TOPIC-RELEVANT CODE
      - Find all files, modules, and components directly related to "<TOPIC>"
      - Identify existing patterns used for similar features (search by keyword)
      - Trace the data flow: where does data enter, how does it move, where does it exit?
      - Note any existing abstractions that could be extended vs. replaced

   C. PAIN POINTS & GAPS
      - Identify missing abstractions, obvious duplication, or inconsistent patterns
      - List all modules that "<TOPIC>" would need to touch
      - Identify potential conflicts with existing code or dependencies

   D. TECHNOLOGY CONSTRAINTS
      - Which libraries are already in use that are relevant? (from package.json)
      - What patterns does the framework enforce? (routing, state, DI, etc.)
      - What is the test/build/lint setup?

   Return your findings as a structured report with section headers A–D.
   For every claim, cite the exact file path and line number if possible.
   If you cannot find evidence for something, say "not found" — do not guess.
   ───────────────────────────────────────────────

③ Write the Exploration Report

   Using the Explore agent's output, write the following report.
   This report will be stored permanently in the kanban board.

   ┌─────────────────────────────────────────────┐
   ## Exploration Report: <topic>
   *Explored: <ISO timestamp> | Project: <PROJECT>*

   ### Current State
   [2–4 sentences: what exists today that is directly relevant to this topic.
    Reference specific files.]

   ### Key Findings
   - <finding> (`path/to/file.ts:line`)
   - <finding> (`path/to/file.ts:line`)
   - ... (list all significant findings)

   ### Possible Directions

   #### Direction A: <name>
   **Approach**: [1–2 sentences — concrete, not abstract]
   **Pros**: [bulleted]
   **Cons**: [bulleted]
   **Estimated complexity**: Low / Medium / High
   **Files likely touched**: [`file1.ts`, `file2.ts`, ...]

   #### Direction B: <name>
   [same structure]

   #### Direction C: <name>  ← only if genuinely distinct; omit if not
   [same structure]

   ### Recommended Direction
   [State which direction you recommend and WHY, citing codebase evidence.
    If there is only one sensible direction, say so clearly.]
   └─────────────────────────────────────────────┘

   Honesty rules:
   - If only one direction makes sense, present one. Do not fabricate alternatives.
   - Every claim must cite a file path. No assumptions without evidence.
   - If the codebase gives no signal on something, say "unclear from codebase".

④ Present report + ask user to choose direction

   Print the full Exploration Report to the user.

   Then use AskUserQuestion:
   - One option per direction (e.g. "Direction A: <name>")
   - "Cancel — save report only, don't create tasks"

   If user selects Cancel → jump to ⑥-Cancel.

⑤ Generate phased kanban tasks

   ⑤-A Plan all tasks BEFORE creating any.
   Write out the full task list mentally first:
   - 3–7 tasks in logical implementation order
   - Each task completable independently in one pipeline run
   - Split if a task would touch more than 3 unrelated files

   For each task determine:
   - title: concise imperative verb phrase ("Add X", "Refactor Y", "Integrate Z")
   - phase: sequential number (1, 2, 3…) — used as a tag
   - priority: high (phase 1–2), medium (phase 3–4), low (phase 5+)
   - level: L2 or L3 based on complexity
   - tags: "explore-<topic-slug>, phase:<N>, <module-tag>"

   ⑤-B Create the report anchor task FIRST.
   This special task stores the full exploration report:

   title: "[Explore] <topic>"
   priority: low
   level: 1
   tags: "explore-<topic-slug>, explore-report"
   description:
     <full Exploration Report from ③>

     ---
     ## Task Index
     *(populated after all tasks are created — see below)*

   Save the returned ID as $REPORT_ID.

   ⑤-C Create implementation tasks in phase order.
   For each task, include this block at the bottom of the description:

     ---
     ## Exploration Context
     *Auto-generated by /kanban-explore on <timestamp>*
     **Explore report**: #$REPORT_ID
     **Direction chosen**: <Direction name>
     **Phase**: <N> of <total>
     **Rationale**: <1–2 sentences: why this step at this phase>

   Save each returned ID in order: $IDS = [id1, id2, ...]

   ⑤-D Patch the report anchor task with the task index.
   After all tasks are created, PATCH $REPORT_ID description to append:

     ## Task Index
     | Phase | ID   | Title              | Priority | Level |
     |-------|------|--------------------|----------|-------|
     | 1     | #id1 | Add X              | high     | L3    |
     | 2     | #id2 | Refactor Y         | medium   | L2    |
     ...

   Use API:
   ```bash
   # Create task
   curl -s -X POST http://localhost:5173/api/task \
     -H 'Content-Type: application/json' \
     -d "{\"title\": \"...\", \"project\": \"$PROJECT\", \"priority\": \"high\",
          \"level\": 3, \"description\": \"...\", \"tags\": \"...\"}"

   # Patch report anchor
   curl -s -X PATCH "http://localhost:5173/api/task/$REPORT_ID?project=$PROJECT" \
     -H 'Content-Type: application/json' \
     -d "{\"description\": \"<updated description with task index>\"}"
   ```

⑥ Output final summary

   Print:

   | Phase | ID           | Title              | Priority | Level |
   |-------|--------------|--------------------|----------|-------|
   | —     | #$REPORT_ID  | [Explore] <topic>  | low      | L1    |
   | 1     | #id1         | Add X              | high     | L3    |
   | 2     | #id2         | Refactor Y         | medium   | L2    |
   ...

   Then print:
   > Exploration complete. N tasks created in `todo` for project `<PROJECT>`.
   > Full report stored in task #$REPORT_ID.
   > Run `/kanban-refine <ID>` on any task to add more detail before starting.
   > Run `/kanban-run <ID>` when ready to execute.

   ⑥-Cancel (user chose Cancel):
   Create only the report anchor task (⑤-B) with the full report, no implementation tasks.
   Print:
   > Report saved to task #$REPORT_ID. No implementation tasks created.
   > Run `/kanban-explore <topic>` again to generate tasks when you're ready.
```

---

### Guardrails

- **No implementation**: This skill must NOT write, edit, or create source files.
- **No assumptions**: If the codebase has no clear pattern for something, say so explicitly.
- **Evidence-based**: Every claim in the report must cite a file path or code pattern found.
- **Honest about uncertainty**: If there is only one sensible direction, present one — do not fabricate alternatives.
- **Task granularity**: Each task should be completable independently in one pipeline run. Split tasks that touch more than 3 unrelated files.
- **Report is permanent**: The exploration report MUST be saved to the kanban board (report anchor task) regardless of whether the user proceeds to task creation.
