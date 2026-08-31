import { test, expect } from '@playwright/test';
import { signup } from '../helpers'

test.describe('login', () => {
  test('login with seeded user', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('navigation').getByRole('link', { name: 'Sign In' }).click();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('testUser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('1234567890');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('login with seeded user and incorrect credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    await page.getByRole('navigation').getByRole('link', { name: 'Sign In' }).click();
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('testUser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).click();
    await page.getByRole('textbox', { name: 'Password' }).fill('asdf wrong password');
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    await page.getByText('Incorrect email or password.').click();
    await expect(page).toHaveURL('http://localhost:3000/login');
  });
})

test.describe('register', () => {
  test('register with email', async ({ page }) => {
    await signup(page, 'john autoflow', 'john51@email.com', 'Password123!');

    await expect(page).toHaveURL('http://localhost:3000/dashboard');
  });

  test('register with email already in use', async ({ page }) => {
    await signup(page, 'john autoflow', 'testUser@example.com', 'Password123!');

    await expect(page).toHaveURL('http://localhost:3000/signup');
  });

  test('register with password too short', async ({ page }) => {
    await signup(page, 'john autoflow', 'john51@email.com', 'a!');

    await expect(page).toHaveURL('http://localhost:3000/signup');
  });
})
