---
name: kanban-local
description: Local markdown-file kanban for toy and personal projects. No server, no PostgreSQL, no auth — all state lives in KANBAN.md in the project root. Use for solo/small projects where the remote kanban board is overkill. Auto-trigger when KANBAN.md exists and user says "태스크 추가", "add task", "칸반 보여줘", "다음 할 일", "task list", or similar task-management phrases. Sub-commands: init, list, add, move, done, show, edit, refine, run, rm, stats.
---

# kanban-local

로컬 `KANBAN.md` 한 파일로 모든 태스크 상태 관리. 원격 DB, 인증, 서버 불필요.

> Safety principles: read `../kanban/principles.md` — **mandatory, not optional.**

## When to Use

- 토이 프로젝트, 개인 실험 레포 — SQLite 칸반이 과한 경우
- KANBAN.md가 있는 디렉터리에서 태스크 관련 요청이 오는 경우
- **사용하지 말 것**: 팀 공유, 멀티-프로젝트 통합 뷰, `/kanban-run` 에이전트 파이프라인 필요 시 → `/kanban` 사용

## KANBAN.md 파일 포맷

파일은 **상단: 보드 개요**, **하단: 태스크 상세** 두 섹션으로 구성된다.

```markdown
---
project: <name>
last_id: 0
updated: YYYY-MM-DD
---

## todo
## doing
## review
## done

---

<!-- details -->
```

### 보드 개요 — 태스크 라인 포맷

```
- #001 [high] Task title · tag1,tag2
```

- `#NNN`: 3자리 zero-padded ID
- `[high|med|low]`: 우선순위
- `· tags`: 옵션, 쉼표 구분

완료 태스크는 strikethrough:
```
- ~~#004~~ [low] ~~Completed task~~ · 2026-05-23
```

### 상세 블록 포맷 (`<!-- details -->` 아래)

```markdown
### #001 · Task title
priority: high · tags: feat · created: 2026-05-23 · status: todo

**Goal**
What needs to happen.

**Acceptance Criteria**
- [ ] Criterion 1

---
```

각 상세 블록은 `---`로 닫는다.

---

## Commands

### `/kanban-local init [name]`

현재 디렉터리에 `KANBAN.md` 생성.

1. `KANBAN.md`가 이미 있으면 현재 상태 표시 후 중단.
2. 프로젝트 이름: 인자 제공 시 사용, 없으면 `basename $(pwd)`.
3. Write 툴로 빈 `KANBAN.md` 생성 (frontmatter + 4개 섹션 헤더 + `<!-- details -->`).
4. "KANBAN.md created for project `<name>`." 확인.

**초기 KANBAN.md 템플릿:**
```markdown
---
project: <name>
last_id: 0
updated: <YYYY-MM-DD>
---

## todo

## doing

## review

## done

---

<!-- details -->
```

---

### `/kanban-local` 또는 `/kanban-local list`

보드 현황 표시.

1. Read 툴로 `KANBAN.md` 읽기.
2. 각 섹션(`## todo`, `## doing`, `## review`, `## done`)에서 태스크 라인 파싱.
3. 아래 형식으로 출력:

```
## 📋 <project> — Kanban

| ID   | Status | Pri  | Title                          | Tags        |
|------|--------|------|--------------------------------|-------------|
| #003 | doing  | high | Currently working on this      | feat,api    |
| #001 | todo   | high | Task title one                 | feat        |
| #002 | todo   | med  | Another task                   | bug         |
```

표시 순서: doing → review → todo → done (done은 최근 5개만). 빈 섹션은 "(empty)" 표시.

---

### `/kanban-local add <title>`

새 태스크 추가.

1. frontmatter의 `last_id`를 읽고 +1 → 새 ID (3자리 zero-pad, 예: `007`).
2. AskUserQuestion으로 확인:
   - 우선순위: high / med(기본) / low
   - 태그: 쉼표 구분 (선택)
   - Goal/설명: 1–2문장 (선택, 없으면 "(TBD)")
3. `## todo` 섹션 마지막에 태스크 라인 추가:
   ```
   - #NNN [<priority>] <title> · <tags>
   ```
4. `<!-- details -->` 아래에 상세 블록 추가:
   ```markdown
   ### #NNN · <title>
   priority: <p> · tags: <tags> · created: <YYYY-MM-DD> · status: todo

   **Goal**
   <description>

   ---
   ```
5. frontmatter의 `last_id`와 `updated` 업데이트.
6. "Added #NNN: <title> → todo." 확인.

---

### `/kanban-local move <ID> <status>`

태스크를 다른 열로 이동.

유효한 status: `todo | doing | review | done`

1. Read 툴로 `KANBAN.md` 읽기.
2. 모든 섹션에서 `- #NNN` 또는 `- ~~#NNN~~` 라인 탐색.
3. 현재 섹션에서 해당 라인 제거.
4. `done`으로 이동 시: strikethrough 적용 (`~~#NNN~~ [pri] ~~title~~`), 날짜 추가 (` · YYYY-MM-DD`).
5. `done`에서 다른 상태로 이동 시: strikethrough 제거, 날짜 제거.
6. 대상 섹션 마지막에 라인 추가.
7. 상세 블록의 `status: <old>` → `status: <new>` 업데이트.
8. frontmatter `updated` 업데이트.
9. "#NNN moved: <old> → <new>." 확인.

---

### `/kanban-local done <ID>`

`/kanban-local move <ID> done` 단축키.

---

### `/kanban-local show <ID>`

태스크 상세 블록 표시.

1. `KANBAN.md`에서 `### #NNN ·` 헤딩 탐색.
2. 해당 헤딩부터 다음 `---` 전까지 출력.

---

### `/kanban-local edit <ID>`

태스크 필드 수정.

1. `show`로 현재 상태 표시.
2. AskUserQuestion으로 수정할 필드 확인 (제목, 우선순위, 태그, goal, 수락 기준).
3. Edit 툴로 상세 블록 수정.
4. 보드 개요 라인도 변경사항에 맞게 수정 (제목/우선순위/태그 변경 시).
5. frontmatter `updated` 업데이트.

---

### `/kanban-local refine <ID>`

구조화된 요구사항 인터뷰 — `/kanban-refine`의 경량 버전.

대상: `todo` 상태 태스크. `doing`/`review` 상태면 경고 후 진행 여부 확인.

**절차:**

① `show`로 현재 상세 블록 읽기.

② 아래 차원에서 갭 분석:
   - WHAT: 정확히 무엇을 만들거나 바꾸는가?
   - WHY: 어떤 문제를 해결하는가?
   - SCOPE: 포함/제외 범위는?
   - ACCEPTANCE: 완료를 어떻게 판단하는가?
   - EDGE CASES: 에러 상태, 경계 조건?

③ AskUserQuestion으로 인터뷰 (1라운드 최대 4개 질문, 최대 2라운드).
   - 이미 명확한 항목은 묻지 않음.
   - 사용자가 "충분해", "enough" 하면 조기 종료.

④ 상세 블록을 아래 템플릿으로 재작성:
   ```markdown
   ### #NNN · <title>
   priority: <p> · tags: <tags> · created: <date> · status: <status>

   **Goal**
   1–2문장: 무엇을, 왜.

   **Scope**
   - IN: ...
   - OUT: ...

   **Requirements**
   1. 구체적이고 테스트 가능한 요구사항
   2. ...

   **Acceptance Criteria**
   - [ ] 검증 가능한 기준 1
   - [ ] ...

   **Edge Cases**
   - 에지 케이스 (있는 경우만)

   ---
   ```
   내용 없는 섹션은 생략.

⑤ 정제된 내용을 사용자에게 보여주고 AskUserQuestion:
   - "Approve & save" → Edit 툴로 저장
   - "Edit more" → 인터뷰 재개
   - "Cancel" → 변경 폐기

⑥ 저장 시 frontmatter `updated` 업데이트.

---

### `/kanban-local run <ID>`

태스크를 실제로 수행하면서 KANBAN.md에 진행 기록을 남긴다.
에이전트 파이프라인 없이 Claude가 직접 구현하고, 상세 블록에 작업 로그를 기록하는 방식.

**절차:**

① KANBAN.md 읽기 → `show <ID>`로 상세 블록 확인.
  - 상태가 `todo`가 아니면 현재 상태를 알리고 진행 여부 확인.

② 태스크를 `doing`으로 이동.
  - 보드 개요 라인 이동 (`## todo` → `## doing`).
  - 상세 블록 `status: todo` → `status: doing` 업데이트.
  - 상세 블록에 `**Log**` 섹션이 없으면 추가하고 시작 항목 기록:
    ```
    **Log**
    - [YYYY-MM-DD] 작업 시작
    ```

③ 실제 작업 수행.
  - Goal / Requirements / Acceptance Criteria를 기준으로 구현.
  - 파일 생성·수정이 필요하면 Write/Edit 툴로 직접 처리.
  - **작업 중 중요한 결정이나 발견이 있으면 즉시** Log에 한 줄 추가:
    ```
    - [YYYY-MM-DD] <결정 내용 또는 발견>
    ```
    예: 접근 방식 변경, 제약 발견, 핵심 설계 결정, 파일 경로 등.
  - Log는 무겁게 쓰지 않는다 — "뭘 했다"가 아니라 "왜 그렇게 했는지, 무엇이 달라졌는지"만.

④ 작업 완료 후 상세 블록 마무리.
  - Acceptance Criteria 항목 중 완료된 것은 `- [ ]` → `- [x]` 체크.
  - `**Implementation Notes**` 섹션을 Log 아래에 추가:
    ```
    **Implementation Notes**
    완료된 산출물과 위치를 1–3줄로 요약.
    예: "prompts/p1-hypothesis.md 작성. 재질문 조건은 변수·대상·지표 중 하나라도 불명확할 때로 설정."
    ```
  - Log에 완료 항목 추가:
    ```
    - [YYYY-MM-DD] 작업 완료
    ```

⑤ 태스크를 `done`으로 이동.
  - 보드 개요 라인: strikethrough 적용 + 날짜 추가.
  - 상세 블록 `status: doing` → `status: done`.
  - frontmatter `updated` 갱신.

⑥ 완료 요약 출력:
  ```
  ✅ #NNN done — <title>
  산출물: <파일 경로 또는 결과 요약>
  ```

**Log 작성 원칙:**
- 평범한 진행("파일 생성함")은 쓰지 않는다.
- 남길 가치가 있는 것만: 설계 결정, 트레이드오프, 막혔다가 해결한 지점, 다음 태스크가 알아야 할 사실.
- 한 줄로 충분하면 한 줄만.

**중단/실패 처리:**
- 작업 중 블로커 발생 시: Log에 블로커 내용 기록 후 `status: todo`로 되돌리고 사용자에게 알림.
  ```
  - [YYYY-MM-DD] ⚠️ 블로커: <내용> — todo로 복귀
  ```

---

### `/kanban-local stats`

상태별 태스크 수 요약.

1. `KANBAN.md` 읽고 각 섹션의 태스크 라인 수 집계.
2. 출력:
   ```
   ## Stats — <project>
   todo: N  ·  doing: N  ·  review: N  ·  done: N  ·  total: N
   ```

---

### `/kanban-local rm <ID>` 또는 `/kanban-local remove <ID>`

태스크 삭제.

1. AskUserQuestion으로 삭제 확인.
2. 보드 개요에서 해당 라인 제거.
3. 상세 블록(`### #NNN ·`부터 다음 `---`까지) 제거.
4. frontmatter `updated` 업데이트.
5. `last_id`는 변경하지 않음 (ID 재사용 금지).

---

## 파일 조작 규칙

- 항상 **Read 툴**로 `KANBAN.md` 읽은 후 수정.
- 수정은 **Edit 툴**로 타겟 변경. bash `sed`/`awk` 사용 금지.
- `init` 시에만 **Write 툴** 사용.
- 모든 변경 후 frontmatter의 `updated` 날짜 갱신.
- `last_id`는 단방향 증가만 — 삭제된 태스크 ID 재사용 금지.
- 태스크 라인 구분: `- #NNN` 또는 `- ~~#NNN~~` 패턴.
- 상세 블록 구분: `### #NNN ·` 헤딩부터 다음 `---`까지.

## Auto-trigger 조건

`KANBAN.md`가 현재 디렉터리에 있고 아래 표현이 오면 `/kanban-local` 자동 활성화:
- "태스크 추가", "칸반 보여줘", "다음 할 일", "할 일 목록"
- "add task", "task list", "show board", "what's next"
