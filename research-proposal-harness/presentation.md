---
marp: true
theme: default
paginate: true
style: |
  section {
    font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
    font-size: 22px;
    padding: 48px 60px;
  }
  section.lead {
    text-align: center;
    justify-content: center;
  }
  section.lead h1 {
    font-size: 48px;
    line-height: 1.3;
  }
  section.lead p {
    font-size: 20px;
    color: #666;
  }
  h1 { font-size: 34px; border-bottom: 3px solid #4F46E5; padding-bottom: 8px; margin-bottom: 24px; }
  h2 { font-size: 26px; color: #4F46E5; }
  table { font-size: 18px; width: 100%; }
  th { background: #4F46E5; color: white; padding: 8px 12px; }
  td { padding: 6px 12px; }
  tr:nth-child(even) { background: #F5F3FF; }
  code { background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 16px; }
  pre { background: #1E293B; color: #E2E8F0; padding: 20px; border-radius: 8px; font-size: 15px; }
  .tag-opus { background: #7C3AED; color: white; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
  .tag-sonnet { background: #0EA5E9; color: white; padding: 2px 8px; border-radius: 4px; font-size: 14px; }
  blockquote { border-left: 4px solid #4F46E5; background: #F5F3FF; padding: 12px 20px; margin: 16px 0; font-style: normal; }
  .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
---

<!-- _class: lead -->

# Research Proposal Harness

### aSSIST MBA 논문 연구계획서 자동화 파이프라인

아이디어 텍스트 → 검증된 선행연구 → 계획서 초안 (.pdf / .html)

---

# 왜 이 하네스가 필요한가

MBA 연구계획서 작성의 **4가지 병목**

| 단계 | 문제 | 결과 |
|------|------|------|
| 아이디어 | 변수·대상·측정 지표 불명확 | 검색 쿼리 실패 |
| 선행연구 | 4개 소스 수동 탐색 | 반나절~하루 소요 |
| 신빙성 | 블로그·만료 URL·중복 혼입 | 지도교수 신뢰도 문제 |
| 독창성 | gap 판단 주관적 | 계획서 반려 |

> 각 단계의 누적 오류가 최종 산출물 품질을 떨어뜨린다.

---

# 전체 파이프라인

```
[자유형식 아이디어]
        │
   ┌────┴────┐
   │  A1     │  가설 정제          → Sonnet
   └────┬────┘
        │
   ┌────┴────┐
   │ Gate 1  │  ← 인간 검토 ①  (가설 승인 / 수정 / 반려)
   └────┬────┘
        │
   ┌────┴────┐   ┌──────────┐
   │  A2     │──▶│  VA      │  수집 + 출처 검증     → Sonnet / Opus
   └─────────┘   └────┬─────┘
                      │ ≥5편
   ┌──────────────────┘
   │
   ┌────┴────┐   ┌──────────┐
   │  A3     │──▶│  VB      │  분석 + 근거 검증     → Opus / Opus
   └─────────┘   └────┬─────┘
                      │ reliable
   ┌──────────────────┘
   │
   ┌────┴────┐
   │  A4     │  계획서 초안 작성   → Sonnet
   └────┬────┘
        │
   ┌────┴────┐
   │ Gate 2  │  ← 인간 검토 ②  (승인 / 섹션수정 / 전면재작성)
   └────┬────┘
        │
   convert.sh  →  proposal.pdf  +  proposal.html
```

---

# Agent 1 — 가설 정제

**목적**: 모호한 아이디어를 검증 가능한 학술 가설로 구조화

**모델**: `claude-sonnet-4-6`

<br>

**재질문 조건** — 아래 중 하나라도 불명확하면 질문 먼저:

| 확인 항목 | 예시 |
|----------|------|
| 독립변수 | "스마트 팩토리 도입 수준"이 측정 가능한가? |
| 종속변수 | "생산성"을 OEE로 볼 것인가, 매출로 볼 것인가? |
| 연구 대상 | "중소기업" = 50인 이상 제조업? |
| 측정 방법 | 설문 5점 리커트? 재무 데이터? |

<br>

**출력**: `agent1_output.json` — hypothesis / keywords / scope / search_queries

---

# Gate 1 — 가설 인간 검토

**사람이 결정하는 것**: 정제된 가설이 내 연구 의도와 일치하는가

<br>

<div class="columns">

**일반 모드**
```
[A] 승인 → A2 진행
[B] 수정 → 직접 입력
[C] 반려 → 재시작
```

**중복 위험 모드** *(A3가 high 반환 시)*
```
[1] 대안 가설 A 선택
[2] 대안 가설 B 선택
[3] 대안 가설 C 선택
[4] 직접 수정
[5] 위험 감수 후 진행
```

</div>

---

# Agent 2 — 선행연구 수집

**목적**: 4개 소스에서 관련 논문 수집 후 3단계 스크리닝

**모델**: `claude-sonnet-4-6`

<br>

| 소스 | 도구 | 대상 |
|------|------|------|
| KCI | `web_search_exa(category:"research paper")` | 국내 학술지 |
| RISS | `web_search_exa` | 국내 학위논문 |
| Google Scholar | `web_search_exa` | 국제 이론·방법론 |
| Exa neural | `web_search_exa` | 최신 해외 연구 |

**스크리닝**: 제목 → 초록 → 전문 (3단계)

**중복 제거**: DOI → arXiv ID → 제목 완전 일치 → 정규화+저자+연도

**재시도 조건**: 통과 논문 < 5편 → VA에서 `rerun_needed: true` 반환

---

# Validator A — 출처 신빙성 검증

**목적**: 수집 논문의 품질 필터링

**모델**: `claude-opus-4-7` *(신뢰도 판단에 추론 필요)*

<br>

**검증 기준 4가지**

| 기준 | 방법 | 제거 조건 |
|------|------|-----------|
| URL 생존 | `web_fetch_exa(url)` | 404 / 빈 응답 |
| 게재지 등급 | 도메인·출판 유형 분류 | `credibility: low` (블로그·출처불명) |
| 메타데이터 일관성 | 제목·저자·연도 교차 확인 | `metadata_consistent: false` |
| 중복 | DOI·제목 정규화 비교 | 낮은 신뢰도 항목 제거 |

**출력**: `final_count` — 이 값이 5 미만이면 A2 재수집

---

# Agent 3 — 논문 분석 · Gap 도출

**목적**: 선행연구 흐름 파악 + 가설과의 유사도 + 연구 공백 도출

**모델**: `claude-opus-4-7` *(deep reasoning)*

<br>

**3계층 분석**

```
계층 1. 연구 흐름    — 지배 이론, 트렌드 변화 요약
계층 2. 방법론 분포  — 양적/질적/혼합 분류, 지배 방법론
계층 3. 유사도 평가  — 논문별 similarity_score (0.0–1.0)
```

**중복 위험도 판정**

| 판정 | 기준 |
|------|------|
| `low` | 차별점 명확 |
| `medium` | 부분 겹침 (0.5–0.8, 3편 이상) |
| `high` | 핵심 가설 동일 (0.8+, 2편 이상) → Gate 1 복귀 + 대안 3개 제시 |

---

# Validator B — 근거 정합성 검증

**목적**: A3의 분석 클레임이 실제 논문으로 뒷받침되는지 확인

**모델**: `claude-opus-4-7` *(할루시네이션 탐지)*

<br>

**검증 절차**

1. A3에서 인용 기반 주장 전체 추출
2. 해당 논문 초록 대조 → 불일치 시 `web_fetch_exa`로 본문 확인
3. 할루시네이션 판정: `paper_not_found` / `claim_contradicts_paper` 등

**scholar-evaluation 루브릭 적용**

| 차원 | 평가 내용 |
|------|----------|
| Dim 2 — Literature & Context | gap 식별 정확성, 합성 여부 |
| Dim 4 — Data & Evidence | 출처 신뢰성, 샘플 크기 충분성 |
| Dim 9 — Citations | 클레임-인용 일치율 |

`overall_reliability: low` → A3 재분석 신호

---

# Agent 4 — 연구계획서 작성

**목적**: aSSIST 6섹션 초안 생성

**모델**: `claude-sonnet-4-6`

<br>

**6섹션 구성**

| 섹션 | 내용 | 주요 입력 |
|------|------|----------|
| 1. 연구 배경 | 현황 + gap 진술 | A3 research_flow |
| 2. 연구 목적 | 행동 동사 번호 목록 | A1 hypothesis |
| 3. 연구 가설 | H1 + 조작적 정의 | A1 hypothesis |
| 4. 이론적 배경 | 이론 그룹화 합성 | A3 dominant_theories |
| 5. 연구 방법론 | 설계·대상·분석법 | A1 target_population |
| 6. 기대 효과 | 학문적·실무적 기여 | A3 gap.differentiator |

**문체**: `style/academic-prose-ko.md` 12규칙 + K1–K5 한국어 추가 규칙 적용

---

# Gate 2 — 초안 인간 검토

**사람이 결정하는 것**: 6섹션 초안을 최종 승인할 것인가

<br>

```
[A] 승인          → convert.sh 실행 (PDF + HTML 생성)

[B] 섹션 수정     → 예: "B 1 배경에 통계 추가해 주세요"
                      해당 섹션만 A4 재생성

[C] 전면 재작성   → 전체 피드백 입력 → A4 전체 재실행
```

<br>

> 변환 완료 후:
> `proposal.pdf` · `proposal.html` · `references.bib`

---

# 피드백 루프

파이프라인이 스스로 재시도하는 조건

| 조건 | 처리 | 최대 반복 |
|------|------|----------|
| VA `final_count < 5` | A2 재수집 (쿼리 확장) | 2회 |
| A3 `duplication_risk: high` | Gate 1 복귀 → 대안 가설 선택 | 사용자 결정 |
| VB `overall_reliability: low` | A3 재분석 (의심 클레임 전달) | 1회 |
| Gate 2 섹션 수정 | 해당 섹션만 A4 재생성 | 무제한 |
| Gate 2 전면 재작성 | A4 전체 재실행 | 무제한 |

---

# 모델 분류

**분석 필요 → Opus 4.7** | **작업 수행 → Sonnet 4.6**

<br>

| 에이전트 | 역할 | 모델 | 이유 |
|----------|------|------|------|
| A1 | 가설 정제 | `sonnet-4-6` | 구조화 변환 |
| A2 | 선행연구 수집 | `sonnet-4-6` | 검색 실행 |
| VA | 출처 검증 | `opus-4-7` | 신뢰도 판단 |
| A3 | 논문 분석 | `opus-4-7` | Gap 추론 |
| VB | 근거 검증 | `opus-4-7` | 할루시네이션 탐지 |
| A4 | 계획서 작성 | `sonnet-4-6` | 구조화 글쓰기 |

---

# 최종 산출물 & 파일 구조

<div class="columns">

**산출물**

| 파일 | 형식 |
|------|------|
| `proposal_draft.md` | 편집 가능 본문 |
| `proposal.pdf` | 제출용 최종본 |
| `proposal.html` | 웹 뷰어 |
| `references.bib` | BibTeX 인용 |

**스킬 구조**

```
research-proposal-harness/
├── SKILL.md
├── spec.md
├── prompts/      ← A1·A2·VA·A3·VB·A4
├── schemas/      ← JSON 계약 5종
├── gates/        ← Gate1·Gate2
├── style/        ← 한국어 문체 규칙
└── templates/    ← 양식·변환스크립트·CSL
```

</div>

---

<!-- _class: lead -->

# 요약

**아이디어** → A1 → Gate1 → A2 → VA → A3 → VB → A4 → Gate2 → **PDF**

<br>

연구자는 **2번만 개입**한다.

Gate 1 — 가설이 맞는지 확인
Gate 2 — 초안을 승인할지 결정

<br>

나머지는 파이프라인이 처리한다.
