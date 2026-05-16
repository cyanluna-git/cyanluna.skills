---
name: tdd-setup
description: Set up Vitest + Testing Library (unit/integration) and optionally Playwright (E2E) for an existing project. Detects framework, installs tools, enforces Red-Green-Refactor cycle with git checkpoints, and writes first tests from real code.
---

# TDD Setup Skill

기존 프로젝트에 Vitest + Testing Library를 설정하고 실제 코드 기반의 첫 TDD 사이클을 완료합니다.
프레임워크를 자동 감지하고 최소한의 설정으로 즉시 `pnpm test`가 동작하는 상태를 만듭니다.

## Commands

### `/tdd-setup` — Full Setup (unit + optional E2E)

```
① Audit    → 현재 테스트 환경 감지
② Install  → Vitest + Testing Library 설치 및 설정 (coverage threshold 포함)
③ TDD      → Red → Green → Refactor 사이클 (git checkpoint 필수)
④ Verify   → pnpm test + coverage 80%+ 확인
⑤ E2E?     → Playwright 세팅 여부 확인 (선택)
```

### `/tdd-setup e2e` — E2E Only

Playwright + POM 구조만 추가. 이미 Vitest가 있을 때 사용.

---

## Procedure

### ① Audit — 현재 상태 파악

```bash
PM=$([ -f pnpm-lock.yaml ] && echo pnpm || [ -f yarn.lock ] && echo yarn || echo npm)

FRAMEWORK=$(node -e "
const p = require('./package.json');
const deps = {...p.dependencies, ...p.devDependencies};
if (deps['next']) console.log('nextjs');
else if (deps['vite']) console.log('vite');
else if (deps['react']) console.log('react');
else console.log('node');
" 2>/dev/null || echo "unknown")

HAS_VITEST=$(grep -q '"vitest"' package.json && echo yes || echo no)
HAS_JEST=$(grep -q '"jest"' package.json && echo yes || echo no)
HAS_PLAYWRIGHT=$(grep -q '"@playwright/test"' package.json && echo yes || echo no)

echo "Framework: $FRAMEWORK | PM: $PM"
echo "Vitest: $HAS_VITEST | Jest: $HAS_JEST | Playwright: $HAS_PLAYWRIGHT"
```

- 이미 Vitest 있으면 ②를 건너뛰고 ③으로 이동
- Jest 있으면 공존/마이그레이션 여부 사용자 확인 (references/frameworks.md 참조)

---

### ② Install — 패키지 설치 및 설정

#### 2-A. 설치 (Next.js 기준, 다른 프레임워크는 references/frameworks.md 참조)

```bash
$PM add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @vitest/coverage-v8
```

#### 2-B. `vitest.config.ts` 작성 (coverage threshold 포함)

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/e2e/**', '**/*.config.*'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

#### 2-C. `vitest.setup.ts` 작성

```ts
import '@testing-library/jest-dom'
```

#### 2-D. `package.json` scripts 추가

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

#### 2-E. TypeScript 설정 확인

`tsconfig.json`에 `vitest/globals` 타입 추가:
```json
{ "compilerOptions": { "types": ["vitest/globals"] } }
```

---

### ③ TDD — Red → Green → Refactor 사이클

**핵심 원칙:** 테스트를 먼저 작성하고 실패를 확인한 뒤 코드를 작성한다.
절대 가상의 파일을 테스트하지 않는다 — 프로젝트 코드를 먼저 읽는다.

#### 3-A. 테스트 대상 선정 (우선순위 순)

```bash
# 1. 커스텀 훅 (가장 테스트하기 쉬움)
find src/hooks -name "*.ts" -not -name "*.test.ts" | head -5

# 2. 순수 유틸 함수
find src/lib src/utils -name "*.ts" -not -name "*.test.ts" | head -5

# 3. UI 컴포넌트 (단순한 것부터)
find src/components -name "*.tsx" -not -name "*.test.tsx" | head -5
```

> **Next.js Server Component 제약:** `src/app` 내 서버 컴포넌트는 jsdom에서 직접 렌더 불가.
> 유틸/훅/클라이언트 컴포넌트를 우선 테스트하고, 서버 컴포넌트 동작은 E2E로 커버한다.

#### 3-B. 🔴 RED — 실패하는 테스트 먼저 작성

테스트를 작성하고 **반드시 실행해서 실패를 확인한다.** 실패 확인 없이 코드 작성 금지.

```bash
$PM test 2>&1
# 반드시 FAIL 출력 확인
```

실패 확인 후 git checkpoint:
```bash
git add -A && git commit -m "test: add failing test for <feature>"
```

**훅 테스트 예시 (RED 상태):**
```ts
// src/hooks/__tests__/useCounter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('counts to end value', async () => {
    const { result } = renderHook(() =>
      useCounter({ end: 10, duration: 0, enabled: true, suffix: '' })
    )
    await act(async () => { await new Promise(r => setTimeout(r, 100)) })
    expect(result.current).toBe('10')
  })

  it('skips animation when prefers-reduced-motion', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: q.includes('reduce'),
        addListener: () => {}, removeListener: () => {},
      }),
    })
    const { result } = renderHook(() =>
      useCounter({ end: 42, duration: 400, enabled: true, suffix: '+' })
    )
    expect(result.current).toBe('42+')
  })
})
```

**유틸 테스트 예시:**
```ts
// src/lib/__tests__/utils.test.ts
import { cn } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })
  it('deduplicates tailwind conflicts', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
  })
})
```

**컴포넌트 테스트 예시:**
```tsx
// src/components/__tests__/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders without crashing', () => {
    render(<StatusBadge status="live" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<StatusBadge status="live" onClick={handleClick} />)
    await user.click(screen.getByRole('status'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### 3-C. 🟢 GREEN — 최소 코드로 통과

테스트를 통과시키는 **최소한의 코드**만 작성한다.

```bash
$PM test 2>&1
# PASS 확인 필수 — 통과 전 refactor 금지
```

통과 확인 후 git checkpoint:
```bash
git add -A && git commit -m "feat: implement <feature> (tests passing)"
```

#### 3-D. 🔵 Refactor — 품질 개선

테스트가 green인 상태를 유지하면서 코드 정리:
- 중복 제거
- 네이밍 개선
- 불필요한 로직 제거

```bash
$PM test 2>&1  # 여전히 PASS인지 확인
```

리팩터 완료 후 git checkpoint:
```bash
git add -A && git commit -m "refactor: clean up <feature>"
```

최소 3개 파일 (훅 1 + 유틸 1 + 컴포넌트 1)에 대해 사이클 완료.

---

### ④ Verify — 커버리지 확인

```bash
$PM test:coverage 2>&1
```

목표: `N passed`, 전체 커버리지 **80%+** (branches / functions / lines / statements).

실패 시 오류별 수정:
- **Module not found**: tsconfig paths / vitest alias 확인
- **window is not defined**: `environment: 'jsdom'` 확인, `typeof window` 가드 추가
- **matchMedia not a function**: 테스트 파일 상단에 `window.matchMedia` mock 추가
- **Cannot find @testing-library/jest-dom**: setupFiles 경로 확인
- **커버리지 미달**: 미달 파일 확인 후 edge case / error path 테스트 추가

---

### ⑤ E2E — Playwright (선택)

사용자에게 확인:
> "Playwright E2E도 함께 설정할까요? (POM 구조 + 핵심 유저플로우 + 접근성 smoke test)"

**Yes면 references/playwright.md 절차 따름.**

---

## Testing Anti-patterns (피해야 할 것)

```ts
// ❌ 구현 세부사항 테스트 (내부 state)
expect(component.state.count).toBe(5)

// ✅ 사용자가 보는 결과 테스트
expect(screen.getByText('Count: 5')).toBeInTheDocument()

// ❌ 테스트 간 의존성
test('creates item', () => { /* ... */ })
test('updates same item', () => { /* 이전 테스트 결과에 의존 */ })

// ✅ 각 테스트가 독립적으로 setup
test('updates item', () => {
  const item = createTestItem()  // 자체 setup
})
```

---

## Output

완료 후 출력:

```
✅ Vitest + Testing Library + @vitest/coverage-v8 설치
✅ vitest.config.ts (coverage threshold 80%) / vitest.setup.ts 생성
✅ 테스트 스크립트 추가 (pnpm test / test:watch / test:coverage)
✅ Red→Green→Refactor 3개 파일 완료 → N passed
✅ Coverage: branches 82% / functions 85% / lines 88%

📁 생성된 파일:
  vitest.config.ts
  vitest.setup.ts
  src/hooks/__tests__/useXxx.test.ts       (RED→GREEN→Refactor)
  src/lib/__tests__/utils.test.ts          (RED→GREEN→Refactor)
  src/components/__tests__/Xxx.test.tsx    (RED→GREEN→Refactor)

📌 Git checkpoints:
  test: add failing test for useXxx
  feat: implement useXxx (tests passing)
  refactor: clean up useXxx
  ... (파일별 3 commits)

▶ 다음 단계:
  pnpm test:watch    → 개발 중 실시간 실행
  pnpm test:coverage → 커버리지 리포트 (htmlreporter → coverage/index.html)
  /tdd-setup e2e     → Playwright E2E + POM 구조 추가
```

## Notes

- **Red gate 필수:** 테스트 실행해서 실패 확인 없이 코드 작성 금지
- **Git checkpoint 필수:** RED / GREEN / Refactor 각 단계 커밋
- **Server Component:** `src/app` 내 Next.js 서버 컴포넌트는 jsdom 불가 → E2E로 커버
- **kanban 프로젝트:** 완료 후 kanban task에 commit hash + coverage 수치 note 기록 권장

## References

- [references/frameworks.md](references/frameworks.md) — Vite/Node/Rails/Jest→Vitest 마이그레이션
- [references/playwright.md](references/playwright.md) — Playwright E2E + POM 패턴 + CI 설정
