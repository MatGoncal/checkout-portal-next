import { expect, test } from '@playwright/test';

test('redirects success screen when payment is still pending', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByTestId('create-payment').click();
  await expect(page.getByRole('link', { name: /webhook simulator/i })).toBeVisible({
    timeout: 15_000,
  });

  const href = await page.getByRole('link', { name: /webhook simulator/i }).getAttribute('href');
  const paymentId = new URL(href!, page.url()).searchParams.get('payment_id');
  expect(paymentId).toBeTruthy();

  await page.goto(`/checkout/success?id=${paymentId}`);
  await expect(page.getByTestId('success-screen')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/checkout\\?id=${paymentId}`));
});
