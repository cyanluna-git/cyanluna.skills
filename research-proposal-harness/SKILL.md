---
name: research-proposal-harness
description: aSSIST MBA 논문 연구계획서를 자유형식 아이디어 텍스트에서 자동 생성하는 에이전트 파이프라인. 6단계(가설정제→선행연구수집→출처검증→논문분석→근거검증→계획서작성) + 2개 인간검토 게이트. 트리거: "연구계획서", "research proposal", "논문 아이디어", "선행연구", "가설 정제", "aSSIST 논문", "MBA 논문", "연구 주제", "research gap", "literature review 하고 싶어", "proposal 써줘", "연구 시작하고 싶어".
---

# Research Proposal Harness

aSSIST MBA 논문 연구계획서(Research Proposal)를 자유형식 아이디어에서 자동 생성하는 에이전트 파이프라인.

## When to Use

**활성화 조건** — 아래 상황에서 사용:
- 논문 아이디어가 있고 aSSIST 연구계획서 초안이 필요할 때
- 선행연구를 검색·정리하고 연구 공백(gap)을 도출하고 싶을 때
- 가설을 학술적으로 구조화해야 할 때 (변수·대상·지표 불명확)
- "연구계획서 써줘", "논문 시작하고 싶어", "선행연구 조사해줘" 등의 표현

**Out of Scope** — 아래는 이 하네스 범위 밖:
- 논문 본문(2장 이후) 작성
- 실험 데이터 수집 (설문, 인터뷰, 재무 데이터)
- 통계 분석 실행 (SPSS, R, Python)
- IRB 절차 지원
- 이미 계획서가 완성된 상태에서 교정만 필요한 경우

---

## Pipeline Overview

```
[User Input: 자유형식 아이디어 텍스트]
        │
        ▼
  ┌─────────────┐
  │  Agent 1    │  가설 정제 · 경계 정의
  │  (A1)       │  → agent1_output.json
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Gate 1    │  ← 인간 검토 ① (가설 승인/반려/수정)
  └──────┬──────┘
         │ approved
         ▼
  ┌─────────────┐
  │  Agent 2    │  국내 수집: KCI/RISS via Exa
  │  (A2)       │  → "Deep Research 프롬프트" 출력 후 대기
  └──────┬──────┘
         │ ← 사용자: Gemini Deep Research 실행 후 리포트 붙여넣기
         ▼
  ┌─────────────┐
  │  A2-DR-     │  DR 리포트 파싱 → 논문 메타데이터 추출
  │  Parser     │  → 국내+국제 병합 → agent2_output.json
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Validator A │  출처 신빙성 검증 (URL·게재지·중복)
  │  (VA)       │  → validator_a_output.json
  └──────┬──────┘
         │ final_count ≥ 5
         ▼
  ┌─────────────┐
  │  Agent 3    │  논문 분석 · 가설 대조 · gap 도출
  │  (A3)       │  → agent3_output.json
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Validator B │  근거 정합성 검증 · 할루시네이션 탐지
  │  (VB)       │  → validator_b_output.json
  └──────┬──────┘
         │ overall_reliability ≥ medium
         ▼
  ┌─────────────┐
  │  Agent 4    │  aSSIST 6섹션 연구계획서 초안 작성
  │  (A4)       │  → proposal_draft.md + references.bib
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │   Gate 2    │  ← 인간 검토 ② (초안 승인/섹션수정/전면재작성)
  └──────┬──────┘
         │ approved
         ▼
  ┌─────────────┐
  │  convert.sh │  md → tex → ZIP (Overleaf용) + HTML 미리보기
  └─────────────┘
         │
         ▼
  [proposal_overleaf.zip → Overleaf 업로드 → PDF]
  [proposal.html  — 로컬 미리보기]
```

### 피드백 루프

| 조건 | 처리 |
|------|------|
| VA: `final_count < 5` | A2로 재수집 (쿼리 확장) |
| A3: `duplication_risk: high` | Gate 1으로 복귀 (대안 가설 3개 제시) |
| VB: `overall_reliability: low` | A3으로 재분석 (의심 클레임 목록 전달) |
| Gate 2: 섹션 단위 수정 요청 | 해당 섹션만 A4 재생성 |
| Gate 2: 전면 재작성 | A4 전체 재실행 |

---

## Recommended Models

| 에이전트 | 모델 | 이유 |
|----------|------|------|
| A1 — 가설 정제 | `claude-sonnet-4-6` | 자유 텍스트 → 구조화 변환, 재질문 생성 |
| A2 — 선행연구 수집 | `claude-sonnet-4-6` | KCI/RISS Exa 검색 + DR 파싱·병합·스크리닝 |
| VA — 출처 검증 | `claude-opus-4-7` | URL·게재지·메타데이터 신뢰도 판단 (nuanced judgment) |
| A3 — 논문 분석 | `claude-opus-4-7` | 유사도 추론·gap 도출·중복 위험 판정 (deep reasoning) |
| VB — 근거 검증 | `claude-opus-4-7` | 클레임-초록 교차검증·할루시네이션 탐지 (critical reasoning) |
| A4 — 계획서 작성 | `claude-sonnet-4-6` | 6섹션 초안 생성 (structured writing) |

---

## Input / Output Spec

### 입력

```
자유형식 텍스트 (한국어 또는 영어 혼용).
예: "스마트 팩토리 도입이 중소기업 생산성에 미치는 영향을 연구하고 싶어요.
     독립변수는 스마트 팩토리 도입 수준, 종속변수는 생산성인데 측정 방법을 모르겠어요."
```

### 중간 산출물 (JSON)

| 파일 | 생성 에이전트 | 스키마 |
|------|-------------|--------|
| `agent1_output.json` | A1 | schemas/a1.schema.json |
| `agent2_output.json` | A2 | schemas/a2.schema.json |
| `validator_a_output.json` | VA | schemas/va.schema.json |
| `agent3_output.json` | A3 | schemas/a3.schema.json |
| `validator_b_output.json` | VB | schemas/vb.schema.json |

### 최종 산출물

| 파일 | 형식 | 설명 |
|------|------|------|
| `proposal_draft.md` | Markdown | pandoc YAML front matter + 6섹션 본문 |
| `proposal_draft.tex` | LaTeX | pandoc 변환 결과 (`% !TEX program = xelatex` 포함) |
| `proposal_draft_overleaf.zip` | ZIP | tex + bib 패키징 — Overleaf에 바로 업로드 |
| `proposal_draft.html` | HTML | 로컬 즉시 확인용 미리보기 |
| `references.bib` | BibTeX | 인용 문헌 전체 |

---

## Orchestrator Pseudocode

```python
SONNET = "claude-sonnet-4-6"
OPUS   = "claude-opus-4-7"

def run_research_proposal_harness(user_idea: str, output_dir: str):

    # A1: 가설 정제 (Sonnet — 구조화 변환)
    a1_out = run_agent("prompts/p1-hypothesis.md", input=user_idea, model=SONNET)
    validate_schema(a1_out, "schemas/a1.schema.json")

    # Gate 1: 인간 검토
    gate1_result = run_gate("gates/gate1.md", data=a1_out)
    if gate1_result.action == "reject":
        return "사용자가 가설을 반려했습니다. 아이디어를 수정 후 재시작하세요."
    if gate1_result.action == "revise":
        a1_out = gate1_result.revised_hypothesis

    # A2: 선행연구 수집 (Sonnet — KCI/RISS Exa + DR 핸드오프)
    while True:
        # p2-collection.md 실행:
        # 1) KCI/RISS Exa 검색 수행
        # 2) DR 프롬프트 출력 후 사용자 입력 대기 (HITL 핸드오프)
        # 3) 사용자가 붙여넣은 DR 리포트를 p2-dr-parser.md로 파싱
        # 4) 국내+국제 병합 → 중복 제거 → 3단계 스크리닝
        a2_out = run_agent("prompts/p2-collection.md", input=a1_out, model=SONNET)
        validate_schema(a2_out, "schemas/a2.schema.json")

        # VA: 출처 검증 (Opus — 신뢰도 판단)
        va_out = run_agent("prompts/va-source-check.md", input=a2_out, model=OPUS)
        validate_schema(va_out, "schemas/va.schema.json")

        if va_out.final_count >= 5:
            break
        a1_out["retry_hint"] = "검색 범위 확장 필요"

    # A3: 논문 분석 (Opus — deep reasoning)
    while True:
        a3_out = run_agent("prompts/p3-analysis.md",
                           input={"hypothesis": a1_out, "papers": va_out}, model=OPUS)
        validate_schema(a3_out, "schemas/a3.schema.json")

        if a3_out.duplication_risk == "high":
            gate1_result = run_gate("gates/gate1.md", data=a3_out, mode="duplication")
            if gate1_result.action == "select_alternative":
                a1_out = gate1_result.selected_alternative
                continue
            elif gate1_result.action == "accept_risk":
                break
        else:
            break

    # VB: 근거 정합성 검증 (Opus — 할루시네이션 탐지)
    while True:
        vb_out = run_agent("prompts/vb-claim-check.md",
                           input={"analysis": a3_out, "papers": va_out}, model=OPUS)
        validate_schema(vb_out, "schemas/vb.schema.json")

        if vb_out.overall_reliability == "low":
            a3_out = run_agent("prompts/p3-analysis.md",
                               input={"hypothesis": a1_out, "papers": va_out,
                                      "flagged_claims": vb_out.hallucination_flags},
                               model=OPUS)
        else:
            break

    # A4: 연구계획서 초안 작성 (Sonnet — structured writing)
    while True:
        a4_out = run_agent("prompts/p4-proposal.md",
                           input={"hypothesis": a1_out, "analysis": a3_out,
                                  "papers": va_out, "validation": vb_out},
                           model=SONNET)

        gate2_result = run_gate("gates/gate2.md", data=a4_out)

        if gate2_result.action == "approve":
            break
        elif gate2_result.action == "revise_section":
            a4_out = run_agent("prompts/p4-proposal.md",
                               input={..., "revise_only": gate2_result.sections},
                               model=SONNET)
        elif gate2_result.action == "rewrite_all":
            a4_out = run_agent("prompts/p4-proposal.md",
                               input={..., "feedback": gate2_result.feedback},
                               model=SONNET)

    # 변환: tex + zip (Overleaf) + html
    run_shell("templates/convert.sh", input_md="proposal_draft.md", output_dir=output_dir)

    return {
        "overleaf_zip": f"{output_dir}/proposal_draft_overleaf.zip",  # Overleaf 업로드용
        "html": f"{output_dir}/proposal_draft.html",                  # 로컬 미리보기
        "tex": f"{output_dir}/proposal_draft.tex",
        "bib": f"{output_dir}/references.bib"
    }
```

---

## Files

```
~/.skills/research-proposal-harness/
├── SKILL.md                     ← 이 파일
├── prompts/
│   ├── p1-hypothesis.md         ← Agent 1: 가설 정제
│   ├── p2-collection.md         ← Agent 2: 국내(Exa) 수집 + DR 핸드오프
│   ├── p2-dr-parser.md          ← Agent 2 보조: DR 리포트 → 논문 메타데이터
│   ├── va-source-check.md       ← Validator A: 출처 검증
│   ├── p3-analysis.md           ← Agent 3: 논문 분석
│   ├── vb-claim-check.md        ← Validator B: 근거 검증
│   └── p4-proposal.md           ← Agent 4: 계획서 작성
├── schemas/
│   ├── a1.schema.json
│   ├── a2.schema.json
│   ├── va.schema.json
│   ├── a3.schema.json
│   └── vb.schema.json
├── gates/
│   ├── gate1.md                 ← Gate 1: 가설 검토
│   └── gate2.md                 ← Gate 2: 초안 검토
├── style/
│   └── academic-prose-ko.md    ← 한국어 학술 문체 규칙
└── templates/
    ├── proposal.md.template     ← pandoc YAML + 6섹션 마커
    ├── convert.sh               ← md→tex→pdf+html
    └── apa.csl                  ← APA 7th 인용 스타일
```
