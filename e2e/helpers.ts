import { Page } from '@playwright/test';

export async function signup(page: Page, fullName: string, email: string, password: string) {
    await page.goto('http://localhost:3000/');
    await page.getByRole('link', { name: 'Sign Up' }).click();
    await page.getByRole('textbox', { name: 'Full Name' }).click();
    await page.getByRole('textbox', { name: 'Full Name' }).fill(fullName);
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).click();
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
    await page.getByRole('textbox', { name: 'Confirm Password' }).click();
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill(password);
    await page.getByRole('button', { name: 'Create Account' }).click();
}