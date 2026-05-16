# Framework-Specific Vitest Setup

## Next.js (App Router)

메인 SKILL.md의 기본 설정 그대로 사용. 추가 주의사항:

- `src/app` 내 Server Component는 RTL로 직접 렌더 불가
  → 유틸/훅/클라이언트 컴포넌트만 단위 테스트
  → Server Component 동작은 Playwright E2E로 커버
- `next/navigation` mock 필요 시:
  ```ts
  vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }))
  ```
- `next/image` mock (jsdom에서 img 렌더 이슈):
  ```ts
  vi.mock('next/image', () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
      React.createElement('img', props),
  }))
  ```

## Vite (React SPA)

SKILL.md 설정과 거의 동일. `vitest.config.ts`에서 Vite 설정 재사용:

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
}))
```

## Node.js / Express / Fastify

jsdom 불필요 — `environment: 'node'` 사용:

```ts
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
})
```

패키지:
```bash
$PM add -D vitest supertest  # HTTP layer 테스트
$PM add -D @types/supertest
```

테스트 패턴:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../app'

describe('GET /health', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
  })
})
```

## FastAPI (Python)

Vitest 대신 pytest 사용 — 이 스킬 범위 밖.

```bash
pip install pytest pytest-asyncio httpx
```

```python
# tests/test_health.py
from httpx import AsyncClient
import pytest
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
```

## Ruby on Rails

```bash
bundle add rspec-rails factory_bot_rails
rails generate rspec:install
```

## Existing Jest → Vitest Migration

공존 전략 (단기):
1. `vitest.config.ts` 추가 (jest.config은 그대로 유지)
2. 새 테스트만 `.test.ts` (vitest) 형태로 작성
3. 기존 Jest 테스트는 점진적으로 마이그레이션

완전 마이그레이션 시:
- `jest.fn()` → `vi.fn()`
- `jest.mock()` → `vi.mock()`
- `jest.spyOn()` → `vi.spyOn()`
- `jest.useFakeTimers()` → `vi.useFakeTimers()`
- `@jest/globals` import → `vitest` import (globals: true면 불필요)
