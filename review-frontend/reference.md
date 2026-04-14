# Frontend 리뷰 관점 가이드 & 출력 포맷

## 리뷰 관점 (10개)

각 관점에서 diff를 분석하고, 발견 사항을 아래 태그로 분류합니다.

### 1. Component Design `[Component]`

- **단일 책임**: 하나의 컴포넌트가 너무 많은 역할을 하는지
- **컴포넌트 크기**: 200줄 이상의 컴포넌트는 분리 검토
- **Props 설계**: prop drilling 과다, 불필요한 props, props 수가 많은 경우
- **합성 패턴**: children, render props, compound components 적절한 사용
- **재사용성**: 도메인 로직과 UI의 분리, 범용 vs 특수 컴포넌트
- **파일 구조**: 관련 파일 co-location (컴포넌트, 스타일, 테스트)

### 2. State Management `[State]`

- **상태 위치**: local state vs global state 적절한 선택
- **상태 구조**: 정규화, 중복 상태, 파생 상태
- **상태 동기화**: 서버 상태와 클라이언트 상태 분리 (TanStack Query 등)
- **불필요한 상태**: props나 계산으로 대체 가능한 상태
- **상태 업데이트**: 비동기 상태 업데이트 시 stale closure 문제
- **Context 범위**: Provider가 너무 넓은 범위를 감싸는 경우

### 3. Hooks `[Hooks]`

- **Rules of Hooks**: 조건부 호출, 루프 내 호출 금지
- **의존성 배열**: useEffect/useCallback/useMemo의 누락/과다 의존성
- **useEffect 남용**: 이벤트 핸들러로 대체 가능한 effect
- **커스텀 Hook**: 로직 재사용을 위한 커스텀 Hook 추출 기회
- **cleanup**: useEffect cleanup 함수 누락 (구독, 타이머, AbortController)
- **useRef 오용**: 렌더링에 영향을 주는 값에 ref 사용

### 4. Rendering Performance `[Perf]`

- **불필요한 리렌더**: React.memo, useMemo, useCallback 필요성
- **무거운 계산**: 렌더 중 O(n²) 이상 연산
- **가상화**: 긴 리스트에 대한 windowing/virtualization 부재
- **이미지 최적화**: next/image, lazy loading, 적절한 포맷
- **코드 분할**: dynamic import, React.lazy 활용
- **번들 크기**: 불필요한 라이브러리 임포트, tree shaking

### 5. Type Safety `[TypeSafety]`

- **any 사용**: 명시적 타입 대신 any/unknown 과다 사용
- **null 처리**: optional chaining 누락, non-null assertion 남용
- **타입 가드**: 런타임 타입 체크 부재
- **제네릭**: 재사용 가능한 타입 정의
- **API 응답 타입**: 서버 응답에 대한 타입 정의 일치
- **enum vs union**: 적절한 타입 표현 방식

### 6. UX & Accessibility `[UX]`

- **로딩 상태**: 비동기 작업 시 로딩 인디케이터
- **에러 표시**: 사용자 친화적 에러 메시지, 폼 검증 피드백
- **빈 상태**: 데이터가 없을 때의 UI 처리
- **접근성 (a11y)**: aria 속성, 키보드 내비게이션, 색상 대비
- **반응형**: 다양한 화면 크기 대응
- **낙관적 업데이트**: 사용자 체감 속도 개선

### 7. Security `[Security]`

- **XSS**: dangerouslySetInnerHTML, 사용자 입력의 직접 렌더링
- **인증 토큰**: 토큰 저장 위치 (localStorage vs httpOnly cookie)
- **CSRF**: POST 요청 시 CSRF 토큰
- **민감 데이터**: 클라이언트에 노출되면 안 되는 데이터
- **의존성 보안**: 취약한 npm 패키지

### 8. Styling `[Style]`

- **일관성**: 디자인 시스템/토큰 사용, 하드코딩된 색상/크기
- **TailwindCSS**: 유틸리티 클래스 일관성, 커스텀 클래스 적절성
- **다크 모드**: 테마 전환 지원 여부
- **레이아웃**: flexbox/grid 적절한 사용
- **애니메이션**: 과도한 애니메이션, prefers-reduced-motion 대응

### 9. Data Fetching `[DataFetching]`

- **캐싱 전략**: staleTime, cacheTime 적절한 설정
- **에러/로딩 처리**: isLoading, isError, error 상태 처리
- **요청 최적화**: 불필요한 refetch, 중복 요청
- **낙관적 업데이트**: mutation 후 캐시 무효화 전략
- **무한 스크롤/페이지네이션**: 올바른 구현 패턴
- **AbortController**: 컴포넌트 언마운트 시 요청 취소

### 10. Testing `[Testing]`

- **테스트 커버리지**: 주요 사용자 인터랙션에 대한 테스트
- **Testing Library 패턴**: 구현 세부사항 테스트 지양, 사용자 행동 테스트
- **비동기 테스트**: waitFor, findBy 적절한 사용
- **모킹**: API 모킹, 타이머 모킹 적절성
- **스냅샷 테스트**: 과도한 스냅샷 테스트 남용
- **E2E 테스트**: 핵심 사용자 플로우 커버리지

---

## 분류 기준

### "머지 전 확인 필요" (Must-fix)

다음 중 하나에 해당:
- React Hooks 규칙 위반 (런타임 에러 유발)
- XSS 등 보안 취약점
- 치명적 렌더링 버그 (무한 루프, 크래시)
- 타입 오류로 인한 런타임 에러 가능성
- Breaking change (기존 컴포넌트 API 변경)

### "개선 권장" (Nice-to-have)

다음 중 하나에 해당:
- 렌더링 성능 개선 기회
- 접근성 향상
- 코드 구조/가독성 개선
- 테스트 보강
- UX 개선 기회

## 최종 판정 기준

| 판정 | 조건 |
|------|------|
| **APPROVED** | "머지 전 확인 필요" 항목 없음 |
| **APPROVED with suggestions** | "머지 전 확인 필요" 항목 없고, "개선 권장" 항목 있음 |
| **CHANGES REQUESTED** | "머지 전 확인 필요" 항목 1개 이상 |

---

## 출력 포맷

```markdown
## PR #{id} Frontend Code Review: {title}

**Repo**: {workspace}/{repo}
**Branch**: {source} → {target}
**Author**: {author}
**Date**: {date}
**Domain**: Frontend

---

### 변경 요약

{이 PR이 무엇을 하는지 2-3문장으로 요약}

---

### 머지 전 확인 필요

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [Hooks] | `EditModal.tsx:30` | 설명 |
| 2 | [Security] | `UserProfile.tsx:45` | 설명 |

{각 항목에 대한 상세 설명과 수정 제안}

---

### 개선 권장

| # | 유형 | 파일 | 내용 |
|---|------|------|------|
| 1 | [Perf] | `Dashboard.tsx:88` | 설명 |
| 2 | [Component] | `DataTable/` | 설명 |

{각 항목에 대한 상세 설명과 수정 제안}

---

### 잘 된 부분

- {칭찬할 만한 구현 결정이나 코드 품질}
- {좋은 컴포넌트 설계나 사용자 경험 고려}

---

### 최종 판정

**APPROVED / APPROVED with suggestions / CHANGES REQUESTED**

{판정 이유 1-2문장}
```

---

## 리뷰 작성 원칙

1. **사용자 경험 우선**: 런타임 에러, UI 깨짐, 접근성 문제는 최우선 검토합니다.
2. **React 패턴 준수**: Hooks 규칙, 상태 관리 패턴, 렌더링 최적화에 집중합니다.
3. **구체적으로**: 파일명과 라인 번호를 명시합니다.
4. **근거 제시**: 왜 문제인지, 어떤 상황에서 문제가 발생하는지 설명합니다.
5. **대안 제시**: 문제만 지적하지 말고, 코드 예시와 함께 수정 방법을 제안합니다.
6. **균형 유지**: 문제점뿐 아니라 잘 된 부분도 언급합니다.
