# Gate 1 — 가설 검토 인터랙션 프로토콜

Gate 1은 Agent 1 출력 후 인간 검토를 수행하는 첫 번째 중단점이다.
두 가지 모드로 작동한다: 일반 가설 승인 (`mode: "approval"`) 과 중복 위험 대응 (`mode: "duplication"`).

---

## Mode A — 일반 가설 승인

### 1. 표시 형식

`agent1_output.json`을 아래 형식으로 사용자에게 표시한다:

```
## Gate 1 — 가설 검토

**정제된 가설**
H1: [hypothesis.statement]

**연구 대상**: [hypothesis.target_population]
**독립변수**: [hypothesis.independent_variable]
**종속변수**: [hypothesis.dependent_variable]
**측정 방법**: [hypothesis.measurement]

**연구 범위**
- 포함: [scope.include 항목들]
- 제외: [scope.exclude 항목들]

**검색 키워드** (상위 5개): [keywords 상위 5개]

---
[A] 승인 — 선행연구 수집 시작
[B] 가설 수정 — 직접 수정 내용 입력
[C] 반려 — 아이디어부터 재시작
```

### 2. 응답 처리

**[A] 승인**
- `gate1_result.action = "approve"`
- A2로 진행

**[B] 가설 수정**
- 사용자 수정 내용을 입력받는다
- `gate1_result.action = "revise"`, `gate1_result.revised_hypothesis = {수정된 내용}`
- 수정된 가설을 a1.schema.json 형식으로 재구성
- Gate 1 표시 화면을 수정된 내용으로 갱신하고 재확인 요청

**[C] 반려**
- `gate1_result.action = "reject"`
- 파이프라인 종료. 사용자에게 메시지:
  ```
  가설 정제 프로세스가 중단되었습니다.
  새로운 아이디어로 다시 시작하려면 연구 주제를 입력해 주세요.
  ```

---

## Mode B — 중복 위험 대응

Agent 3이 `duplication_risk: "high"`를 반환하면 Gate 1으로 복귀한다.

### 1. 표시 형식

```
## Gate 1 — 중복 위험 알림

**현재 가설**: [hypothesis.statement]

**중복 위험 수준**: 높음
[agent3_output.duplication_detail]

**가장 유사한 기존 연구**:
- [similarity_eval 상위 2–3개: paper title + similarity_score]

---

**대안 가설 제안** (연구 공백 기반):

[A1] [alternatives[0].hypothesis_statement]
      → [alternatives[0].rationale]

[A2] [alternatives[1].hypothesis_statement]
      → [alternatives[1].rationale]

[A3] [alternatives[2].hypothesis_statement]  (있는 경우)
      → [alternatives[2].rationale]

---
[1] 대안 A1 선택 — 해당 가설로 재수집 시작
[2] 대안 A2 선택
[3] 대안 A3 선택  (있는 경우)
[4] 직접 수정 — 새 가설 입력
[5] 위험 감수 — 현재 가설 유지하고 계속 진행
```

### 2. 응답 처리

**[1–3] 대안 선택**
- `gate1_result.action = "select_alternative"`
- `gate1_result.selected_alternative = alternatives[선택된 인덱스]`
- a1.schema.json 형식으로 재구성 후 A2부터 재시작

**[4] 직접 수정**
- 사용자 입력을 A1 재실행 없이 직접 가설 구조로 변환
- Gate 1 Mode A로 재표시

**[5] 위험 감수**
- `gate1_result.action = "accept_risk"`
- 현재 가설 유지하고 VB 단계로 진행
- `agent3_output`에 `duplication_risk_accepted: true` 플래그 추가

---

## 주의사항

- 사용자가 응답하지 않거나 입력이 모호하면 선택지를 다시 표시한다
- 가설 수정 시 a1.schema.json의 모든 필드를 일관성 있게 업데이트한다
- Gate 1 통과 기록을 `agent1_output.json`에 `gate1_approved: true/false` 필드로 추가한다
