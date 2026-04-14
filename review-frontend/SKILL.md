---
name: review-frontend
description: "Frontend 코드 리뷰. PR의 프론트엔드 코드를 컴포넌트 설계, 상태 관리, 렌더링 성능, 접근성 관점으로 분석. 사용법: /review-frontend <PR_URL>"
argument-hint: "<pr_url> [--no-post] [--no-save]"
allowed-tools: Bash(python3 *), Read, Grep, WebFetch
---

# /review-frontend - Frontend 코드 리뷰

PR URL을 입력받아 프론트엔드 코드를 도메인 전문 관점으로 분석하고, 구조화된 리뷰 코멘트를 PR에 자동으로 게시합니다.

## 대상 코드

- React / Next.js (TypeScript, JSX/TSX)
- Vue.js, Angular, Svelte
- CSS / TailwindCSS / CSS-in-JS
- 상태 관리 (Redux, Zustand, Context, TanStack Query)
- 테스트 (Jest, Vitest, Testing Library, Playwright)

## 옵션

| 옵션 | 설명 |
|------|------|
| (없음) | 리뷰 + PR 코멘트 게시 + 로컬 MD 저장 |
| `--no-post` | PR 코멘트 게시 생략 (분석만) |
| `--no-save` | 로컬 MD 저장 생략 |

## 필수 실행 워크플로우

아래 단계를 반드시 순서대로 실행하세요. 건너뛰지 마세요.

### Step 1: 인자 파싱

사용자 입력에서 PR URL과 옵션을 파싱합니다.

```
입력: <pr_url> [--no-post] [--no-save]
```

### Step 2: PR 데이터 수집

```bash
python3 ../review-pr/scripts/review_pr.py fetch <pr_url>
```

JSON 출력을 분석합니다. `diff_file` 키가 있으면 diff가 별도 파일로 저장된 것이므로 Read 도구로 해당 파일을 읽으세요.

### Step 3: 코드 분석 & 리뷰 작성

1. diff 전체를 읽고 [reference.md](reference.md)의 **10가지 프론트엔드 전문 관점**으로 분석합니다.
2. 특히 다음에 집중합니다:
   - 컴포넌트 설계와 책임 분리
   - React Hooks 규칙 및 상태 관리 패턴
   - 렌더링 성능 (불필요한 리렌더, 메모이제이션)
   - 타입 안전성과 null 처리
   - 사용자 경험과 접근성
3. [reference.md](reference.md)의 **출력 포맷**에 맞춰 구조화된 리뷰를 작성합니다.
4. `/tmp/review_pr_{id}.md`에 임시 저장합니다.

**리뷰 언어**: 한국어로 작성합니다.

### Step 4: PR에 코멘트 게시

`--no-post` 옵션이 **없는 경우**에만 실행합니다.

```bash
python3 ../review-pr/scripts/review_pr.py comment <pr_url> < /tmp/review_pr_{id}.md
```

### Step 5: 로컬 MD 저장

`--no-save` 옵션이 **없는 경우**에만 실행합니다.

1. 파일명 정보 조회:
```bash
python3 ../review-pr/scripts/review_pr.py save <pr_url>
```

2. `/tmp/review_pr_{id}.md` 내용을 `reviews/{filename}`에 저장합니다. `reviews/` 디렉토리가 없으면 생성합니다.

### Step 6: 결과 요약

사용자에게 결과를 요약하여 보여줍니다:
- 리뷰한 PR 정보 (제목, 브랜치, 작성자)
- 발견한 이슈 수 (머지 전 확인 필요 / 개선 권장)
- 최종 판정 (APPROVED / APPROVED with suggestions / CHANGES REQUESTED)
- 코멘트 게시 여부 및 URL
- MD 저장 경로

## 추가 리소스

- 프론트엔드 리뷰 관점 및 출력 포맷: [reference.md](reference.md)
- 사용 예시: [../review-pr/examples.md](../review-pr/examples.md)
- API 헬퍼 스크립트: [../review-pr/scripts/review_pr.py](../review-pr/scripts/review_pr.py)
