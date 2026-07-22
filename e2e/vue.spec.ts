import { test, expect } from '@playwright/test'

// Only define Playwright tests if not running under Bun's native runner
if (typeof Bun === 'undefined') {
  test('visits the app root url', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.logo-title')).toHaveText('Content Studio')
  })
}
