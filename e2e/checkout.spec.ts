import { expect, test } from '@playwright/test';

test('home lists payments', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();
});

test('checkout → webhook paid → success screen', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByTestId('amount-input').fill('15.00');
  await page.getByTestId('create-payment').click();

  await expect(page.getByText(/polling every 2s/i)).toBeVisible({ timeout: 15_000 });

  const simulatorLink = page.getByRole('link', { name: /webhook simulator/i });
  await expect(simulatorLink).toBeVisible();
  const href = await simulatorLink.getAttribute('href');
  expect(href).toMatch(/payment_id=/);

  await page.goto(href!);
  await page.getByTestId('fire-webhook').click();
  await expect(page.getByTestId('sim-result')).toContainText(/Accepted payment\.paid/i, {
    timeout: 10_000,
  });
  await expect(page.getByTestId('sim-payment-status')).toContainText('PAID');

  const paymentId = (await page.getByTestId('sim-payment-id').inputValue()).trim();
  await page.goto(`/checkout/success?id=${paymentId}`);
  await expect(page.getByTestId('success-screen')).toBeVisible();
  await expect(page.getByText(/PIX received/i)).toBeVisible();
});

test('splits page shows breakdown after apply', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByTestId('create-payment').click();
  await expect(page.getByRole('link', { name: /webhook simulator/i })).toBeVisible({
    timeout: 15_000,
  });
  const href = await page.getByRole('link', { name: /webhook simulator/i }).getAttribute('href');
  await page.goto(href!);
  await page.getByTestId('fire-webhook').click();
  await expect(page.getByTestId('sim-payment-status')).toContainText('PAID');

  const paymentId = (await page.getByTestId('sim-payment-id').inputValue()).trim();
  await page.goto(`/splits?id=${paymentId}`);
  await page.getByTestId('apply-default-splits').click();
  await expect(page.getByTestId('split-breakdown')).toContainText('platform');
  await expect(page.getByTestId('split-breakdown')).toContainText('seller');
  await expect(page.getByTestId('split-breakdown')).toContainText('affiliate');
});
