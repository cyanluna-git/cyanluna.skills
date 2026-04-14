# 사용 예시

## 기본 사용법

### 전체 플로우 (리뷰 + 코멘트 게시 + MD 저장)

```bash
/review-pr https://bitbucket.org/ac-avi/device_gateway/pull-requests/3
```

실행 결과:
1. PR #3의 diff, 커밋, 메타데이터를 가져옴
2. 8가지 관점으로 코드 리뷰 수행
3. Bitbucket PR에 리뷰 코멘트 자동 게시
4. `reviews/PR3-device_gateway-review.md`에 저장

### 분석만 (코멘트 게시 안 함)

```bash
/review-pr https://bitbucket.org/ac-avi/device_gateway/pull-requests/3 --no-post
```

PR에 코멘트를 달지 않고 리뷰 결과만 보여줍니다. 먼저 결과를 확인하고 싶을 때 유용합니다.

### MD 저장 안 함

```bash
/review-pr https://bitbucket.org/ac-avi/device_gateway/pull-requests/3 --no-save
```

로컬 파일 저장을 건너뜁니다.

### 분석만 + 저장도 안 함

```bash
/review-pr https://bitbucket.org/ac-avi/device_gateway/pull-requests/3 --no-post --no-save
```

순수하게 리뷰 결과만 화면에 출력합니다.

## 출력 예시

```markdown
## PR #3 Code Review: Add device health monitoring endpoint

**Repo**: ac-avi/device_gateway
**Branch**: feature/health-check → develop
**Author**: John Kim
**Date**: 2025-01-15

---

### 변경 요약

디바이스 상태 모니터링을 위한 `/api/devices/{id}/health` 엔드포인트 추가.
주기적으로 디바이스 상태를 폴링하고 결과를 캐싱하는 로직 포함.

---

### 머지 전 확인 필요

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [Bug] | `src/handlers/health.py:45` | timeout 미설정으로 무한 대기 가능 |
| 2 | [Security] | `src/handlers/health.py:23` | device_id 입력값 검증 없이 쿼리에 사용 |

**1. [Bug] timeout 미설정** (`src/handlers/health.py:45`)

`requests.get(device_url)` 호출 시 timeout 파라미터가 없어서 디바이스가 응답하지 않으면 워커 스레드가 무한 대기합니다.

```python
# 수정 제안
response = requests.get(device_url, timeout=10)
```

**2. [Security] 입력값 검증 누락** (`src/handlers/health.py:23`)

`device_id`를 직접 SQL 쿼리에 사용하고 있습니다. parameterized query를 사용하세요.

---

### 개선 권장

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [Perf] | `src/handlers/health.py:60` | 매 요청마다 DB 조회 대신 캐시 활용 가능 |
| 2 | [Design] | `src/handlers/health.py` | 폴링 로직을 별도 서비스로 분리 권장 |

---

### 잘 된 부분

- 에러 응답 포맷이 기존 API와 일관성 있게 작성됨
- 로깅이 적절한 수준으로 포함되어 있어 디버깅에 도움

---

### 최종 판정

**CHANGES REQUESTED**

timeout 미설정과 SQL 인젝션 가능성은 프로덕션 배포 전 반드시 수정이 필요합니다.
```

## 스크립트 직접 사용

스킬이 아닌 스크립트를 직접 실행할 수도 있습니다:

```bash
# PR 데이터 가져오기
python3 scripts/review_pr.py fetch https://bitbucket.org/ac-avi/device_gateway/pull-requests/3

# 코멘트 게시
cat review.md | python3 scripts/review_pr.py comment https://bitbucket.org/ac-avi/device_gateway/pull-requests/3

# 파일명 정보
python3 scripts/review_pr.py save https://bitbucket.org/ac-avi/device_gateway/pull-requests/3
```
