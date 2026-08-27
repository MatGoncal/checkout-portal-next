import { expect, test } from '@playwright/test';

test.describe('simulator guard', () => {
  test('returns 404 and hides nav link when ENABLE_SIMULATOR is off', async ({ page }) => {
    const response = await page.goto('/simulator');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('link', { name: 'Simulator' })).toHaveCount(0);
  });

  test('loads simulator when ENABLE_SIMULATOR is on', async ({ page }) => {
    await page.goto('/simulator');
    await expect(page.getByRole('heading', { name: /webhook simulator/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Simulator' })).toBeVisible();
  });
});
