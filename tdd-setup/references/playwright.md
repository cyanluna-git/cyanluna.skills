# Playwright E2E Setup

## Install

```bash
$PM add -D @playwright/test
npx playwright install chromium
```

## 디렉토리 구조

```
e2e/
├── pages/          ← Page Object Model 클래스
│   ├── HomePage.ts
│   └── ProjectPage.ts
├── fixtures/       ← 공유 setup / test data
│   └── auth.ts
├── smoke.spec.ts
├── accessibility.spec.ts
└── playwright.config.ts
```

## `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## `package.json` scripts 추가

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed"
  }
}
```

## `.gitignore` 추가

```
/test-results/
/playwright-report/
/playwright/.cache/
```

---

## Page Object Model (POM)

규모가 커지면 spec 파일에 선택자를 직접 쓰지 말고 POM 클래스로 분리한다.
선택자 변경이 생겨도 POM 한 곳만 수정하면 된다.

```ts
// e2e/pages/HomePage.ts
import { Page, Locator } from '@playwright/test'

export class HomePage {
  readonly page: Page
  readonly skipLink: Locator
  readonly hamburgerButton: Locator
  readonly projectCards: Locator
  readonly resultCount: Locator

  constructor(page: Page) {
    this.page = page
    this.skipLink = page.getByText('Skip to main content')
    this.hamburgerButton = page.getByRole('button', { name: /menu/i })
    this.projectCards = page.locator('[data-testid="project-card"]')
    this.resultCount = page.locator('[aria-live="polite"]')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async filterByTrack(track: string) {
    await this.page.getByRole('button', { name: track }).click()
    await this.page.waitForLoadState('networkidle')
  }

  async getProjectCount() {
    return await this.projectCards.count()
  }
}
```

```ts
// e2e/pages/ProjectPage.ts
import { Page, Locator } from '@playwright/test'

export class ProjectPage {
  readonly page: Page
  readonly backLink: Locator
  readonly prevLink: Locator
  readonly nextLink: Locator

  constructor(page: Page) {
    this.page = page
    this.backLink = page.getByRole('link', { name: /back/i })
    this.prevLink = page.getByRole('link', { name: /previous/i })
    this.nextLink = page.getByRole('link', { name: /next/i })
  }

  async goto(slug: string) {
    await this.page.goto(`/projects/${slug}`)
    await this.page.waitForLoadState('networkidle')
  }
}
```

---

## Smoke Tests

프로젝트 코드를 읽고 실제 라우트/텍스트로 교체해서 작성한다.

```ts
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Site smoke', () => {
  test('homepage loads and has title', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await expect(page).toHaveTitle(/.+/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('project cards are visible', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    const count = await home.getProjectCount()
    expect(count).toBeGreaterThan(0)
  })

  test('filter reduces project count', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    const before = await home.getProjectCount()
    await home.filterByTrack('Industrial')  // 실제 필터 이름으로 교체
    const after = await home.getProjectCount()
    expect(after).toBeLessThanOrEqual(before)
  })
})
```

---

## 접근성 E2E 패턴

```ts
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test'
import { HomePage } from './pages/HomePage'

test.describe('Keyboard & A11y', () => {
  test('skip link appears on first Tab', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await page.keyboard.press('Tab')
    await expect(home.skipLink).toBeVisible()
  })

  test('skip link navigates to main content', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('aria-live region exists for filter count', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await expect(home.resultCount).toBeAttached()
  })

  test('mobile menu: focus trap and Escape', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const home = new HomePage(page)
    await home.goto()

    await home.hamburgerButton.click()
    await expect(page.locator('nav a').first()).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(home.hamburgerButton).toBeFocused()
  })

  test('focus ring visible on Tab', async ({ page }) => {
    const home = new HomePage(page)
    await home.goto()
    await page.keyboard.press('Tab')
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible()
    const boxShadow = await focused.evaluate(el =>
      getComputedStyle(el).boxShadow
    )
    expect(boxShadow).not.toBe('none')
  })
})
```

---

## Flaky Test 방지

```ts
// ❌ 하드코딩된 sleep
await page.waitForTimeout(600)

// ✅ 네트워크 / 상태 완료 대기
await page.waitForResponse(res => res.url().includes('/api/'))
await page.waitForLoadState('networkidle')
await expect(locator).toBeVisible()  // auto-retry 내장

// ❌ CSS 클래스 선택자 (리팩터에 취약)
await page.click('.css-xyz123')

// ✅ 시맨틱 선택자 (POM에서 관리)
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByTestId('submit-btn').click()
```

---

## CI (GitHub Actions)

```yaml
# .github/workflows/e2e.yml
name: E2E
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: corepack enable && pnpm install
      - run: npx playwright install --with-deps chromium
      - run: pnpm e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```
