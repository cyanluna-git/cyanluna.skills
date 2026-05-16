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

# python3으로 감지 — node require()는 ESM 프로젝트("type":"module")에서 실패함
FRAMEWORK=$(python3 - << 'PY'
import json
try:
    p = json.load(open("package.json"))
    deps = {**p.get("dependencies", {}), **p.get("devDependencies", {})}
    if "next" in deps: print("nextjs")
    elif "vite" in deps: print("vite")
    elif "react" in deps: print("react")
    else: print("node")
except Exception: print("unknown")
PY
)

HAS_VITEST=$(python3 -c "import json; p=json.load(open('package.json')); print('yes' if 'vitest' in {**p.get('dependencies',{}),**p.get('devDependencies',{})} else 'no')")
HAS_JEST=$(python3 -c "import json; p=json.load(open('package.json')); print('yes' if 'jest' in {**p.get('dependencies',{}),**p.get('devDependencies',{})} else 'no')")
HAS_PLAYWRIGHT=$(python3 -c "import json; p=json.load(open('package.json')); print('yes' if '@playwright/test' in {**p.get('dependencies',{}),**p.get('devDependencies',{})} else 'no')")

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

threshold는 기존 코드 규모에 따라 조정한다. 소스 파일이 많은 프로젝트에 처음부터 80%를 강제하면 첫 실행부터 실패한다.

```bash
# 기존 소스 파일 수 확인 → threshold 결정
SRC_COUNT=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -v '\.test\.' | grep -v '__tests__' | wc -l | tr -d ' ')
if [ "$SRC_COUNT" -gt 20 ]; then
  THRESHOLD=60  # 기존 코드 많음 → 60%부터 시작, 점진적으로 올릴 것
else
  THRESHOLD=80  # 신규 프로젝트 → 처음부터 80%
fi
echo "Coverage threshold: $THRESHOLD% (src files: $SRC_COUNT)"
```

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
        // 기존 코드 > 20 파일이면 60으로 시작, 신규는 80
        // 안정화되면 숫자를 올려서 ratchet effect를 만든다
        branches: $THRESHOLD,
        functions: $THRESHOLD,
        lines: $THRESHOLD,
        statements: $THRESHOLD,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

> **Ratchet 원칙:** threshold는 내리지 않는다. 커버리지가 올라가면 숫자를 올리고, 절대 낮추지 않는다.

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

아래 중 **존재하는 카테고리**에서 최소 3개 파일을 고른다. 없는 카테고리를 억지로 만들지 않는다.

```bash
# 존재하는 카테고리 자동 탐지
echo "=== 테스트 가능한 파일 ===" 
[ -d src/hooks ]      && echo "[훅]"      && find src/hooks      -name "*.ts"  -not -name "*.test.*" | head -5
[ -d src/lib ]        && echo "[유틸(lib)]" && find src/lib        -name "*.ts"  -not -name "*.test.*" | head -5
[ -d src/utils ]      && echo "[유틸]"    && find src/utils      -name "*.ts"  -not -name "*.test.*" | head -5
[ -d src/components ] && echo "[컴포넌트]" && find src/components  -name "*.tsx" -not -name "*.test.*" | head -5
[ -d src/stores ]     && echo "[스토어]"  && find src/stores      -name "*.ts"  -not -name "*.test.*" | head -5
```

선정 기준 (우선순위):
1. **순수 함수 / 유틸** — 의존성 없어서 가장 쉬움
2. **커스텀 훅** — jsdom으로 충분, renderHook으로 빠르게 테스트
3. **클라이언트 컴포넌트** — `'use client'` 표시된 것만, 서버 컴포넌트는 스킵
4. **Zustand / 상태 스토어** — 순수 함수처럼 단위 테스트 가능

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

존재하는 카테고리 중 최소 3개 파일에 대해 사이클 완료.

---

### ④ Verify — 커버리지 확인

```bash
FORCE_COLOR=0 $PM test:coverage 2>&1 | tee /tmp/tdd_coverage.txt
```

실제 수치를 파싱해서 출력에 반영한다:

```bash
python3 - << 'PY'
import re, os

text = open("/tmp/tdd_coverage.txt").read() if os.path.exists("/tmp/tdd_coverage.txt") else ""

# vitest coverage text 출력에서 All files 행 파싱
# 예: All files | 88.23 | 81.25 | 85.71 | 88.23 |
m = re.search(r'All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)', text)
if m:
    stmt, branch, fn, line = m.groups()
    passed = re.search(r'(\d+) passed', text)
    n = passed.group(1) if passed else "?"
    print(f"\n✅ {n} passed")
    print(f"Coverage: statements {stmt}% / branches {branch}% / functions {fn}% / lines {line}%")
    low = [(name, val) for name, val in [("statements", stmt), ("branches", branch), ("functions", fn), ("lines", line)] if float(val) < 80]
    if low:
        print(f"⚠ 미달: {', '.join(f'{n} {v}%' for n, v in low)}")
    else:
        print("✅ 모든 threshold 통과")
else:
    print("(coverage 수치 파싱 실패 — 위 로그 확인)")

os.remove("/tmp/tdd_coverage.txt") if os.path.exists("/tmp/tdd_coverage.txt") else None
PY
```

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

완료 후 실제 측정값을 포함해 출력한다 (④ Verify에서 파싱한 수치 사용):

```
✅ Vitest + Testing Library + @vitest/coverage-v8 설치
✅ vitest.config.ts (coverage threshold <THRESHOLD>%) / vitest.setup.ts 생성
✅ 테스트 스크립트 추가 (pnpm test / test:watch / test:coverage)
✅ Red→Green→Refactor <N>개 파일 완료 → <passed> passed
✅ Coverage: statements <X>% / branches <Y>% / functions <Z>% / lines <W>%

📁 생성된 파일:
  vitest.config.ts
  vitest.setup.ts
  <실제 테스트 파일 목록 — git diff HEAD~N --name-only로 확인>

📌 Git checkpoints (git log --oneline -<N*3>):
  <실제 커밋 메시지 목록>

▶ 다음 단계:
  pnpm test:watch    → 개발 중 실시간 실행
  pnpm test:coverage → 커버리지 리포트 (coverage/index.html)
  /tdd-setup e2e     → Playwright E2E + POM 구조 추가
```

`<THRESHOLD>`, `<passed>`, `<X/Y/Z/W>%` 등은 하드코딩하지 않고 반드시 실제 측정값으로 채운다.

## Notes

- **Red gate 필수:** 테스트 실행해서 실패 확인 없이 코드 작성 금지
- **Git checkpoint 필수:** RED / GREEN / Refactor 각 단계 커밋
- **Server Component:** `src/app` 내 Next.js 서버 컴포넌트는 jsdom 불가 → E2E로 커버
- **kanban 프로젝트:** 완료 후 kanban task에 commit hash + coverage 수치 note 기록 권장

## References

- [references/frameworks.md](references/frameworks.md) — Vite/Node/Rails/Jest→Vitest 마이그레이션
- [references/playwright.md](references/playwright.md) — Playwright E2E + POM 패턴 + CI 설정
