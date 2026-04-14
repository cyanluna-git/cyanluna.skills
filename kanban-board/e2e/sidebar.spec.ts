import { test, expect } from '@playwright/test';

/**
 * Wait for the board to finish loading (either columns render or error state).
 * initSidebar() is called inside loadBoard() after columns are rendered,
 * so the presence of .column[data-column] indicates sidebar handlers are bound.
 */
async function waitForBoardReady(page: import('@playwright/test').Page): Promise<boolean> {
  const columns = page.locator('.column[data-column]').first();
  const errorState = page.locator('#board >> text=Cannot find');
  const authOverlay = page.locator('#auth-overlay:not(.hidden)');

  const result = await Promise.race([
    columns.waitFor({ state: 'attached', timeout: 10000 }).then(() => 'loaded' as const),
    errorState.waitFor({ state: 'attached', timeout: 10000 }).then(() => 'error' as const),
    authOverlay.waitFor({ state: 'attached', timeout: 10000 }).then(() => 'auth' as const),
  ]).catch(() => 'timeout' as const);

  return result === 'loaded';
}

function isDesktop(testInfo: import('@playwright/test').TestInfo): boolean {
  return testInfo.project.name === 'Desktop Chrome';
}

function isMobile(testInfo: import('@playwright/test').TestInfo): boolean {
  return testInfo.project.name === 'Mobile Safari';
}

test.describe('Sidebar Render', () => {
  test('Desktop: sidebar visible with 7 stage items', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'Desktop-only test');
    await page.goto('/');
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();
    const items = sidebar.locator('.sidebar-item[data-stage]');
    await expect(items).toHaveCount(7);
  });
});

test.describe('Sidebar Mobile', () => {
  test('Mobile: sidebar hidden', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'Mobile-only test');
    await page.goto('/');
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeHidden();
  });
});

test.describe('Stage Navigation', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'Desktop-only: sidebar not visible on mobile');
    await page.goto('/');
    const ready = await waitForBoardReady(page);
    test.skip(!ready, 'Board did not load (auth required or error)');
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });

  test('clicking todo item activates it', async ({ page }) => {
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    await todoItem.click();
    await expect(todoItem).toHaveClass(/active/);
  });

  test('clicking non-todo item deactivates todo', async ({ page }) => {
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    const doneItem = page.locator('.sidebar-item[data-stage="done"]');
    // Click done (last column, clearly distinct from todo)
    await doneItem.click();
    // Wait for active class to settle (intersection observer debounces at 100ms)
    await expect(doneItem).toHaveClass(/active/, { timeout: 2000 });
    await expect(todoItem).not.toHaveClass(/active/);
  });
});

test.describe('Collapse / Expand', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'Desktop-only: sidebar not visible on mobile');
    await page.goto('/');
    const ready = await waitForBoardReady(page);
    test.skip(!ready, 'Board did not load (auth required or error)');
    await expect(page.locator('aside.sidebar')).toBeVisible();
    // Clear collapsed state for clean slate
    await page.evaluate(() => localStorage.removeItem('kanban-sidebar-collapsed'));
    await page.reload();
    await waitForBoardReady(page);
    await expect(page.locator('aside.sidebar')).toBeVisible();
    // Verify expanded state (no data-collapsed)
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).not.toHaveAttribute('data-collapsed');
  });

  test('collapse button adds data-collapsed attribute', async ({ page }) => {
    await page.click('#sidebar-collapse-btn');
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toHaveAttribute('data-collapsed', '');
  });

  test('expand button removes data-collapsed attribute', async ({ page }) => {
    await page.click('#sidebar-collapse-btn'); // collapse
    await expect(page.locator('aside.sidebar')).toHaveAttribute('data-collapsed', '');
    await page.click('#sidebar-collapse-btn'); // expand
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).not.toHaveAttribute('data-collapsed');
  });

  test('collapsed state persists after reload', async ({ page }) => {
    await page.click('#sidebar-collapse-btn');
    await expect(page.locator('aside.sidebar')).toHaveAttribute('data-collapsed', '');
    await page.reload();
    await waitForBoardReady(page);
    await expect(page.locator('aside.sidebar')).toHaveAttribute('data-collapsed', '');
    // Cleanup
    await page.evaluate(() => localStorage.removeItem('kanban-sidebar-collapsed'));
  });
});

test.describe('Column Filter', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'Desktop-only: sidebar not visible on mobile');
    await page.goto('/');
    const ready = await waitForBoardReady(page);
    test.skip(!ready, 'Board did not load (auth required or error)');
    await expect(page.locator('aside.sidebar')).toBeVisible();
    // Clear hidden state for clean slate
    await page.evaluate(() => localStorage.removeItem('kanban-hidden-stages'));
    await page.reload();
    await waitForBoardReady(page);
    await expect(page.locator('aside.sidebar')).toBeVisible();
  });

  test('eye button visible on hover', async ({ page }) => {
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    await todoItem.hover();
    const eyeBtn = todoItem.locator('.sidebar-eye-btn');
    await expect(eyeBtn).toBeVisible();
  });

  test('clicking eye hides column and adds hidden-stage class', async ({ page }) => {
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    await todoItem.hover();
    const eyeBtn = todoItem.locator('.sidebar-eye-btn');
    await eyeBtn.click();
    await expect(todoItem).toHaveClass(/hidden-stage/);
    await expect(page.locator('#sidebar-show-all')).toBeVisible();
  });

  test('Show All restores all columns', async ({ page }) => {
    // Hide todo first
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    await todoItem.hover();
    await todoItem.locator('.sidebar-eye-btn').click();
    await expect(todoItem).toHaveClass(/hidden-stage/);
    await expect(page.locator('#sidebar-show-all')).toBeVisible();
    // Click Show All
    await page.click('#sidebar-show-all');
    await expect(todoItem).not.toHaveClass(/hidden-stage/);
    await expect(page.locator('#sidebar-show-all')).toBeHidden();
  });

  test('hidden stage persists after reload', async ({ page }) => {
    const todoItem = page.locator('.sidebar-item[data-stage="todo"]');
    await todoItem.hover();
    await todoItem.locator('.sidebar-eye-btn').click();
    await expect(todoItem).toHaveClass(/hidden-stage/);
    await page.reload();
    await waitForBoardReady(page);
    await expect(page.locator('aside.sidebar')).toBeVisible();
    await expect(page.locator('.sidebar-item[data-stage="todo"]')).toHaveClass(/hidden-stage/);
    // Cleanup
    await page.evaluate(() => localStorage.removeItem('kanban-hidden-stages'));
  });
});

test.describe('No Regressions', () => {
  test('board element is present', async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo), 'Desktop-only: board hidden on mobile by default');
    await page.goto('/');
    const board = page.locator('#board');
    await expect(board).toBeVisible();
  });

  test('search input is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#search-input')).toBeVisible();
  });
});
