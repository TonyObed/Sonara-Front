import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Basic check to see if the page loaded
  await expect(page.locator('text=L’IA vocale pour l’Afrique francophone')).toBeVisible();
});
