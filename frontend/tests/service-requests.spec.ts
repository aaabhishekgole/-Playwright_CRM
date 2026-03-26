import { test, expect } from '@playwright/test';

test('service requests page renders dashboard links', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('Admin@123');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByText('CRM Console')).toBeVisible();
  await page.getByRole('link', { name: 'Service Requests' }).click();
  await expect(page.getByText('Request queue')).toBeVisible();
});
