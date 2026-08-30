import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('test', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('navigation').getByRole('link', { name: 'Sign In' }).click();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('testUser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234567890');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });
})
