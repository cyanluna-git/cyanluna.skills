# Gate 2 — 연구계획서 초안 검토 인터랙션 프로토콜

Gate 2는 Agent 4가 생성한 연구계획서 초안을 사용자가 검토하는 최종 중단점이다.
6개 섹션 요약을 표시하고 승인, 섹션 단위 수정, 전면 재작성 3가지 응답을 처리한다.

---

## 1. 표시 형식

`proposal_draft.md`의 각 섹션을 요약하여 표시한다:

```
## Gate 2 — 연구계획서 초안 검토

**[섹션 1] 연구 배경**
[첫 2문장 + "..." + 마지막 문장 — 최대 150자]

**[섹션 2] 연구 목적**
[목적 목록 전체 — 번호 목록이면 그대로 표시]

**[섹션 3] 연구 가설**
[H1 문장 + 조작적 정의 요약]

**[섹션 4] 이론적 배경**
[첫 2문장 + "..." + 핵심 이론명 목록]

**[섹션 5] 연구 방법론**
[연구 설계 + 대상 + 분석 방법 요약 — 3문장 이내]

**[섹션 6] 기대 효과**
[학문적·실무적 기여 항목 전체]

---
인용 논문 수: [references.bib 항목 수]개
Validator B 신뢰도: [validator_b_output.overall_reliability]

---
[A] 승인 — PDF·HTML 변환 시작
[B] 섹션 수정 — 수정할 섹션 번호와 피드백 입력
[C] 전면 재작성 — 전체 피드백 입력
```

---

## 2. 응답 처리

### [A] 승인

```
gate2_result.action = "approve"
```
`templates/convert.sh` 실행:
- `proposal_draft.md` → `proposal.tex` → `proposal.pdf`
- `proposal_draft.md` → `proposal.html`

완료 후 출력:
```
✅ 변환 완료

- proposal.pdf   — [파일 경로]
- proposal.html  — [파일 경로]
- references.bib — [파일 경로]

Gate 2 승인 완료. 지도교수 제출 전 최종 검토를 권장합니다.
```

### [B] 섹션 단위 수정

사용자 입력 형식:
```
B [섹션 번호] [피드백]
예: B 1 배경 설명이 너무 일반적입니다. 국내 중소기업 통계를 추가해 주세요.
    B 4 TAM 이론 설명을 추가해 주세요.
```

복수 섹션 수정 가능:
```
gate2_result.action = "revise_section"
gate2_result.sections = [1, 4]
gate2_result.section_feedback = {
  1: "배경 설명이 너무 일반적입니다...",
  4: "TAM 이론 설명을 추가..."
}
```

A4를 `revise_only` 모드로 재실행 → 해당 섹션만 재생성.
재생성 후 Gate 2 화면 갱신 및 재확인.

### [C] 전면 재작성

사용자 입력: 전체 피드백 자유 텍스트
```
gate2_result.action = "rewrite_all"
gate2_result.feedback = "[사용자 피드백 전문]"
```

A4를 `feedback` 모드로 전체 재실행.
재실행 후 Gate 2 화면 처음부터 재표시.

---

## 3. 모호한 응답 처리

사용자가 선택지 없이 텍스트만 입력한 경우:
- "수정" 또는 섹션 번호 포함 → [B] 섹션 수정으로 처리
- "다시", "전체", "처음부터" 포함 → [C] 전면 재작성으로 처리
- "좋아", "완료", "ok", "승인" 포함 → [A] 승인으로 처리
- 그 외 → 선택지를 다시 표시하고 명확한 선택 요청

---

## 4. 변환 실패 처리

`convert.sh` 실행 중 오류 발생 시:
```
⚠️ 변환 오류
[오류 메시지]

다음을 확인해 주세요:
- pandoc 설치 여부: pandoc --version
- xelatex 설치 여부: xelatex --version
- NanumMyeongjo 폰트 설치 여부: fc-list | grep Nanum

proposal_draft.md와 references.bib는 정상 생성되었습니다.
수동으로 변환하려면: bash templates/convert.sh proposal_draft.md
```

`proposal_draft.md`와 `references.bib`는 항상 저장 후 변환을 시도한다.
