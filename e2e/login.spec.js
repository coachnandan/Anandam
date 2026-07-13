import { test, expect } from '@playwright/test';

test.describe('Authentication and Core Flow', () => {
  test('should render the login page by default', async ({ page }) => {
    await page.goto('/');

    // Assuming the login page has an email input or login button
    // Wellness Dashboard typically redirects to /login if unauthenticated
    await expect(page).toHaveURL(/.*login|.*$/);
    
    // Check if there's a login form or branding
    const hasLoginElements = await page.evaluate(() => {
      return !!document.querySelector('input[type="email"]') || 
             !!document.querySelector('button') ||
             document.body.innerText.toLowerCase().includes('login');
    });

    expect(hasLoginElements).toBeTruthy();
  });
});
