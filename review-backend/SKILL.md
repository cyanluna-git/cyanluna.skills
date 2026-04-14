---
name: review-backend
description: "Backend 코드 리뷰. PR의 백엔드 코드를 API 설계, DB, 보안, 동시성, 에러 처리 관점으로 분석. 사용법: /review-backend <PR_URL>"
argument-hint: "<pr_url> [--no-post] [--no-save]"
allowed-tools: Bash(python3 *), Read, Grep, WebFetch
---

# /review-backend - Backend 코드 리뷰

PR URL을 입력받아 백엔드 코드를 도메인 전문 관점으로 분석하고, 구조화된 리뷰 코멘트를 PR에 자동으로 게시합니다.

## 대상 코드

- Python (FastAPI, Flask, Django)
- Node.js (Express, NestJS, Next.js API Routes)
- Go, Java, C# 등 서버 사이드 코드
- SQL 마이그레이션, ORM 모델
- 설정 파일 (.env, config, docker-compose)

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

### Step 2.5: 컨텍스트 & 작성자 의도 파악

**항상 실행합니다.** diff 분석 전에 작성자의 의도를 먼저 이해합니다.

1. **PR 설명 읽기**: Step 2 JSON의 `pr.description` 확인 (비어 있어도 계속 진행)

2. **PR 코멘트 읽기**: Step 2 JSON의 `pr_comments` 배열 확인
   - 작성자의 자기 설명, 리뷰어 질문, 설계 결정 논의 내용 파악

3. **Jira 스토리 조회**: Step 2 JSON의 `jira_key` 값 확인
   - `jira_key`가 있으면:
     ```bash
     python3 ../review-pr/scripts/review_pr.py jira <jira_key>
     ```
   - JSON이 없거나 오류가 나면 무시하고 진행
   - `jira_key`가 없으면 PR 제목/브랜치에서 `[A-Z]+-\d+` 패턴 수동 탐색

4. **INTENT_CONTEXT 구성**: 아래 질문에 답하며 컨텍스트 정리
   - 어떤 문제를 해결하는가? (Jira 요약 + PR 제목)
   - 합의된 범위는 무엇인가? (Jira 설명 / AC)
   - 의도적인 설계 결정이 있는가? (PR 코멘트, 커밋 메시지)

5. **이 컨텍스트를 다음에 활용**:
   - "변경 요약" 섹션을 정확하게 작성
   - 의도적인 설계 결정을 이슈로 오인하지 않도록 판단
   - Jira AC와 실제 구현 범위 일치 여부 확인

---

### Step 3: 코드 분석 & 리뷰 작성

1. diff 전체를 읽고 [reference.md](reference.md)의 **10가지 백엔드 전문 관점**으로 분석합니다.
2. 특히 다음에 집중합니다:
   - API 설계와 RESTful 원칙
   - DB 쿼리 성능과 인덱스
   - 인증/인가 및 입력 검증
   - 에러 처리와 로깅
   - 동시성과 트랜잭션
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

- 백엔드 리뷰 관점 및 출력 포맷: [reference.md](reference.md)
- 사용 예시: [../review-pr/examples.md](../review-pr/examples.md)
- API 헬퍼 스크립트: [../review-pr/scripts/review_pr.py](../review-pr/scripts/review_pr.py)
