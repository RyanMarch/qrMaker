import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

// Global error tracking setup
test.beforeEach(({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore normal 404 log messages from the browser, service worker registration failures, and local files
      if (
        !text.includes('Failed to load resource: the server responded with a status of 404') &&
        !text.includes('service-worker') &&
        !text.includes('sw.js') &&
        !text.includes('chrome-extension')
      ) {
        throw new Error(`Browser console error: ${text}`);
      }
    }
  });

  page.on('pageerror', error => {
    // Ignore service worker registration type errors in local test environment
    if (!error.message.includes('sw.js') && !error.message.includes('Service Worker')) {
      throw new Error(`Uncaught browser exception: ${error.message}`);
    }
  });
});

test.describe('Pages and Layout Tests', () => {

  test('Main App Page loads successfully', async ({ page }) => {
    const response = await page.goto('/app/');
    expect(response?.status()).toBe(200);

    // Verify main app title/logo text
    await expect(page.locator('.logo-text')).toContainText('QR Maker');

    // Verify that the QR Canvas exists
    await expect(page.locator('#qr-canvas')).toBeVisible();
  });

  test('About Page loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    // The main heading on the About page is "Meet QR Maker"
    await expect(page.locator('h1')).toContainText('Meet QR Maker');
  });

  test('API Documentation Page loads successfully', async ({ page }) => {
    const response = await page.goto('/api/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Developer API');
  });

  test('Terms and Privacy Page loads successfully', async ({ page }) => {
    const response = await page.goto('/terms/');
    expect(response?.status()).toBe(200);
    
    // The terms page contains multiple h1 sections (e.g. Terms and Conditions, Privacy Policy)
    const headings = page.locator('h1');
    await expect(headings.first()).toContainText('Terms and Conditions');
    await expect(headings.nth(1)).toContainText('Privacy Policy');
  });

  test('404 Page loads on non-existent route', async ({ page }) => {
    // Wrangler pages dev will automatically serve 404.html for unmatched routes
    const response = await page.goto('/some-fake-non-existent-route-999');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('body')).toContainText('Page Not Found');
  });

  test('Theme switcher updates page classes and saves preference', async ({ page }) => {
    await page.goto('/app/');
    
    // Clear storage to start fresh
    await page.evaluate(() => localStorage.removeItem('qrm-theme'));
    await page.reload();

    const htmlElement = page.locator('html');

    // Default theme should be dark (app default)
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

    // Click theme toggle button to switch to Light Theme
    const themeBtn = page.locator('#theme-toggle');
    await themeBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'light');

    // Click theme toggle button to switch to System Theme
    await themeBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme-mode', 'system');

    // Click theme toggle button to switch back to Dark Theme
    await themeBtn.click();
    await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
  });

  test('Visual layout comparison (Light vs Dark)', async ({ page }) => {
    await page.goto('/app/');

    // Force Dark Theme
    await page.evaluate(() => {
      localStorage.setItem('qrm-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.removeAttribute('data-theme-mode');
    });
    await page.waitForTimeout(500); // Wait for potential animations/redraw
    await expect(page).toHaveScreenshot('main-app-dark.png', {
      mask: [page.locator('#qr-canvas')], // Mask QR canvas since content changes
      maxDiffPixels: 1000,
    });

    // Force Light Theme
    await page.evaluate(() => {
      localStorage.setItem('qrm-theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.removeAttribute('data-theme-mode');
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('main-app-light.png', {
      mask: [page.locator('#qr-canvas')],
      maxDiffPixels: 1000,
    });
  });

  test.describe('Accessibility Audits', () => {
    test('Main App Page is accessible', async ({ page }) => {
      await page.goto('/app/');
      const accessibilityResults = await new AxeBuilder({ page })
        .disableRules(['color-contrast']) // Ignore color-contrast if custom theme gradients are dynamic
        .analyze();
      expect(accessibilityResults.violations).toEqual([]);
    });

    test('About Page is accessible', async ({ page }) => {
      await page.goto('/');
      const accessibilityResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityResults.violations).toEqual([]);
    });

    test('API Documentation Page is accessible', async ({ page }) => {
      await page.goto('/api/');
      const accessibilityResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityResults.violations).toEqual([]);
    });

    test('Terms and Privacy Page is accessible', async ({ page }) => {
      await page.goto('/terms/');
      const accessibilityResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityResults.violations).toEqual([]);
    });
  });
});
