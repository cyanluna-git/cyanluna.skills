---
name: kanban-gen-wiki
description: 프로젝트의 전체 아키텍처, 목표, 주요 결정사항을 wiki/ 디렉토리에 합성하여 정리합니다. 첫 실행 시 전체 생성, update로 변경분 반영. 매 카드가 아닌 프로젝트 수준의 지식을 정리합니다.
---

> Shared context: read `../kanban/shared.md` for DB path, API endpoints, auth, and error handling.

## `/kanban-gen-wiki` — 프로젝트 위키 초기 생성

**When to use**: 프로젝트의 전체 맥락(아키텍처, 목표, 도메인 지식, 주요 결정)을 `wiki/` 디렉토리에 정리하고 싶을 때.
매 칸반 카드가 아닌, **프로젝트 수준의 지식**을 합성한다.
**이 스킬은 소스 코드를 수정하지 않는다.**

## `/kanban-gen-wiki update` — 변경분 반영

**When to use**: 이미 `wiki/`가 존재하고, 이후 변경된 코드/칸반 상태를 반영하고 싶을 때.

---

### 소스 (읽기 전용 — 합성의 재료)

위키는 아래 4개 소스를 읽어서 합성한다. 소스 자체는 수정하지 않는다.

| 소스 | 읽는 것 | 왜 |
|------|---------|-----|
| **칸반 프로젝트** | project metadata (purpose, brief, stack) + 보드 요약 (todo/done 비율, 마일스톤) | 현재 목표와 진행 상태 |
| **칸반 카드 (선별)** | exploration report 태그 카드 + done 카드 중 decision_log가 있는 것만 | 주요 아키텍처 결정만 (구현 디테일 제외) |
| **프로젝트 파일** | CLAUDE.md, README.md, .claude/rules/, claudeos-core/standard/ (있으면) | 코딩 규칙, 아키텍처 정의 |
| **코드 구조** | 디렉토리 트리, package.json, 주요 config 파일 | 기술 스택, 의존성 |

### 카드 선별 기준 (노이즈 방지)

칸반 카드를 **전수 조사하지 않는다**. 아래 조건에 해당하는 카드만 읽는다:

1. **Exploration report**: `tags`에 `explore-report` 포함 → description 전문 읽기
2. **주요 결정이 있는 done 카드**: `decision_log`가 비어있지 않은 done 카드 → decision_log만 읽기 (impl_notes, review_comments 무시)
3. **진행 중 카드**: todo/plan/impl 상태 카드 → title + priority만 읽기 (현재 방향 파악용)

이 기준으로 보통 전체 카드의 20-30%만 읽게 된다.

---

### 출력 구조: `wiki/`

```
wiki/
├── INDEX.md                 # 진입점 — 프로젝트 개요 + 토픽 링크
├── architecture.md          # 시스템 아키텍처, 기술 스택, 데이터 흐름
├── goals.md                 # 현재 목표, 마일스톤, 로드맵 (칸반 상태 기반)
├── decisions.md             # 주요 아키텍처 결정 이력 (exploration + decision_log 합성)
└── domains/                 # 도메인별 지식 (프로젝트마다 다름)
    ├── {domain-1}.md        # 예: courses.md, auth.md, upload.md
    ├── {domain-2}.md
    └── ...
```

### 파일 포맷

모든 위키 파일은 아래 형식을 따른다:

```markdown
---
topic: {토픽명}
generated: {ISO timestamp}
sources: {소스 수}
---

# {토픽명}

## Summary
{2-3 문단. 이 파일만 읽어도 토픽을 이해할 수 있어야 함.}

## {토픽 고유 섹션}
{소스에서 합성한 내용. 구체적 사실 + 파일 경로 인용.}

## Open Questions
{아직 결정되지 않았거나 불확실한 사항.}

## Sources
- CLAUDE.md
- kanban #ID: {exploration report title}
- README.md
```

---

### Procedure: 초기 생성 (`/kanban-gen-wiki`)

```
① 프로젝트 컨텍스트 수집

   ①-A 칸반 프로젝트 메타데이터 읽기:
   ```bash
   curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$PROJECT"
   ```
   → purpose, brief, stack, status, category 추출

   ①-B 칸반 보드 요약 읽기:
   ```bash
   curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true"
   ```
   → 상태별 카드 수, 전체 진행률 파악

   ①-C 선별 카드 읽기 (노이즈 방지):

   exploration report 카드 찾기:
   보드 요약에서 tags에 "explore-report"가 포함된 카드 ID 추출.
   각 카드의 description 전문 읽기:
   ```bash
   curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=title,description,tags"
   ```

   주요 결정 카드 찾기:
   done 상태 카드 중 decision_log가 비어있지 않은 것만.
   보드 요약에서는 decision_log가 생략되므로, done 카드 ID 목록을 뽑은 뒤
   각각 decision_log 필드만 읽기:
   ```bash
   curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=title,decision_log"
   ```
   decision_log가 null/빈 문자열이면 skip.

   진행 중 카드:
   보드 요약에서 todo/plan/impl 상태 카드의 title + priority만 사용.

   ①-D 프로젝트 파일 읽기:
   - CLAUDE.md (프로젝트 루트)
   - README.md (있으면)
   - .claude/rules/ 전체 (있으면)
   - claudeos-core/standard/ 전체 (있으면)

   ①-E 코드 구조 스캔:
   - 최상위 디렉토리 목록 (`ls` — node_modules 등 제외)
   - package.json (dependencies, scripts)
   - 주요 config (tsconfig.json, next.config.ts 등)

② 토픽 구조 결정

   수집한 소스를 기반으로 위키 토픽 구조를 결정한다.

   고정 토픽 (모든 프로젝트):
   - INDEX.md — 전체 개요
   - architecture.md — 시스템 아키텍처
   - goals.md — 현재 목표 + 마일스톤
   - decisions.md — 주요 결정 이력

   도메인 토픽 (프로젝트별 자동 결정):
   - app/ 하위 라우트 그룹, components/ 하위 디렉토리, 또는
     칸반 카드의 explore 태그에서 도메인 추출
   - 도메인이 3개 미만이면 domains/ 디렉토리 생략, architecture.md에 통합
   - 도메인이 8개 초과이면 관련 도메인 묶기 (예: upload + storage → data-pipeline)

   토픽 구조를 사용자에게 제시하고 확인받기 (AskUserQuestion):
   "다음 구조로 위키를 생성합니다. 수정할 토픽이 있나요?"
   - 토픽 목록 표시
   - "이대로 진행" / "토픽 수정" 선택

③ 위키 파일 생성

   wiki/ 디렉토리 생성 후, 각 토픽 파일을 작성한다.

   ③-A INDEX.md 작성:
   ```markdown
   ---
   topic: 프로젝트 개요
   generated: {ISO timestamp}
   sources: {총 소스 수}
   ---

   # {프로젝트명} Wiki

   > 마지막 생성: {날짜} | 토픽: {N}개 | 소스: {N}개

   ## 프로젝트 개요
   {project purpose + brief 기반 2-3 문단}

   ## 기술 스택
   {stack 정보 테이블}

   ## 토픽
   | 토픽 | 설명 | 소스 수 |
   |------|------|---------|
   | [architecture](architecture.md) | 시스템 구조, 데이터 흐름 | N |
   | [goals](goals.md) | 현재 목표, 진행 상태 | N |
   | [decisions](decisions.md) | 주요 아키텍처 결정 | N |
   | [{domain}](domains/{domain}.md) | {한 줄 설명} | N |

   ## 현재 상태 (칸반)
   | 상태 | 카드 수 |
   |------|---------|
   | todo | N |
   | in progress | N |
   | done | N |
   ```

   ③-B architecture.md 작성:
   소스: CLAUDE.md 아키텍처 섹션 + claudeos-core/standard/00.core/ + 코드 구조 스캔
   - 시스템 다이어그램 (텍스트)
   - 디렉토리 구조 + 역할
   - 의존성 방향
   - 기술 스택 상세

   ③-C goals.md 작성:
   소스: project brief + 칸반 보드 상태 + 진행 중 카드 제목
   - 프로젝트 목적 (왜 만들었나)
   - 현재 마일스톤 / 진행 중 작업
   - 완료된 주요 작업 (done 카드 중 의미 있는 것)
   - 다음 단계 (todo 카드에서 추론)

   ③-D decisions.md 작성:
   소스: exploration report 카드 + done 카드의 decision_log
   - 시간순 정렬
   - 각 결정: 날짜, 맥락, 결정 내용, 근거
   - exploration report는 "방향 선택" 섹션으로 포함
   - 사소한 구현 결정은 제외 (아키텍처 수준만)

   ③-E domains/{domain}.md 작성 (각 도메인별):
   소스: 해당 도메인의 코드 구조 + CLAUDE.md/rules 중 관련 부분 + 관련 칸반 카드
   - 도메인 목적
   - 주요 파일/컴포넌트
   - 데이터 흐름
   - 제약사항/금지 패턴 (rules에서)

④ 완료 출력

   생성된 파일 목록 + 각 파일의 소스 수 표시:

   | 파일 | 소스 수 | 주요 소스 |
   |------|---------|-----------|
   | INDEX.md | — | 전체 합성 |
   | architecture.md | N | CLAUDE.md, standard/, package.json |
   | goals.md | N | project brief, 칸반 보드 |
   | decisions.md | N | exploration reports, decision_logs |
   | domains/courses.md | N | app/courses/, components/courses/ |

   > Wiki generated: N files in `wiki/`.
   > Run `/kanban-gen-wiki update` after significant changes to refresh.
```

---

### Procedure: 업데이트 (`/kanban-gen-wiki update`)

```
① 변경 감지

   ①-A 현재 wiki/ 파일의 generated 타임스탬프 읽기 (frontmatter)
   → $LAST_GENERATED

   ①-B 변경된 소스 식별:

   칸반 변경:
   ```bash
   # 마지막 생성 이후 완료된 카드
   curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true"
   ```
   → completed_at > $LAST_GENERATED인 done 카드 중 decision_log가 있는 것
   → 새로 생성된 exploration report 카드
   → project brief 변경 여부

   파일 변경:
   → CLAUDE.md, README.md의 mtime > $LAST_GENERATED
   → .claude/rules/ 변경 여부
   → 주요 디렉토리 구조 변경 (새 route, 새 component 디렉토리)

   ①-C 변경 없으면:
   "No changes detected since {$LAST_GENERATED}. Wiki is up to date."
   → 종료

② 영향받는 토픽 결정

   변경된 소스 → 어떤 토픽이 영향받는지 매핑:

   | 변경 소스 | 영향받는 토픽 |
   |-----------|-------------|
   | project brief 변경 | INDEX.md, goals.md |
   | 새 done 카드 (decision_log) | decisions.md |
   | 새 exploration report | decisions.md |
   | CLAUDE.md 변경 | architecture.md, INDEX.md |
   | .claude/rules/ 변경 | architecture.md, 해당 domain |
   | 새 라우트/컴포넌트 디렉토리 | architecture.md, 새 domain 토픽 생성 |
   | 칸반 보드 상태 변경 | goals.md |

   변경 요약을 사용자에게 표시:
   "다음 토픽을 업데이트합니다:"
   - goals.md (3 new done cards, brief updated)
   - decisions.md (1 new exploration report)

③ 선택적 재생성

   영향받는 토픽만 재생성한다.
   변경 없는 토픽은 그대로 유지.

   재생성 시:
   - 기존 파일 내용을 읽고
   - 새 소스의 내용을 반영하여 업데이트
   - generated 타임스탬프 갱신
   - 기존 내용 중 여전히 유효한 부분은 보존 (전체 재작성 아님)

   INDEX.md는 항상 재생성 (토픽 테이블, 칸반 상태 갱신).

④ 완료 출력

   | 파일 | 상태 | 변경 사유 |
   |------|------|-----------|
   | INDEX.md | updated | 칸반 상태 갱신 |
   | goals.md | updated | 3 new done cards |
   | decisions.md | updated | 1 new exploration report |
   | architecture.md | unchanged | — |
   | domains/courses.md | unchanged | — |

   > Wiki updated: N files changed, M unchanged.
```

---

### Guardrails

- **소스 코드 수정 금지**: 이 스킬은 `wiki/` 디렉토리만 생성/수정한다
- **카드 전수 조사 금지**: 선별 기준(exploration report, decision_log 있는 done, 진행 중 title)만 읽는다
- **구현 디테일 제외**: implementation_notes, review_comments, test_results는 읽지 않는다
- **합성, 복사 아님**: 소스를 그대로 복사하지 않고, 프로젝트 수준으로 합성한다
- **기존 위키 보존**: update 시 변경 없는 토픽은 건드리지 않는다
- **칸반 API 전용**: 칸반 데이터는 반드시 HTTP API로 읽는다 (DB 직접 접근 금지)
- **사용자 확인**: 초기 생성 시 토픽 구조를 사용자에게 확인받는다
