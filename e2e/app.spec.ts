import { test, expect } from '@playwright/test';

test.describe('App Health Checks', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');

    // The login page should have a form with username and password inputs
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    await page.screenshot({ path: 'test-results/login-page.png' });
  });

  test('auto-login redirects to home (DEV_AUTO_LOGIN=true)', async ({ page }) => {
    // With DEV_AUTO_LOGIN=true the proxy auto-creates an admin session,
    // so navigating to / should NOT redirect to /login.
    await page.goto('/');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    });

    expect(page.url()).not.toContain('/login');

    await page.screenshot({ path: 'test-results/home-page.png' });
  });

  test('admin page accessible', async ({ page }) => {
    await page.goto('/admin');

    // Should load the admin dashboard (not redirect back to login)
    await page.waitForURL((url) => url.pathname.startsWith('/admin'), {
      timeout: 15_000,
    });

    expect(page.url()).toContain('/admin');

    await page.screenshot({ path: 'test-results/admin-page.png' });
  });

  test('recent assets panel images do not overlap', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 15_000,
    });

    // Look for the "Recent" section label
    const recentSection = page.getByText('Recent', { exact: false });

    // Only run overlap check if the Recent section is visible (requires uploaded images)
    if (await recentSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const images = page.locator('img[alt="Recent upload"]');
      const count = await images.count();

      if (count >= 2) {
        const boxes: { top: number; bottom: number; left: number; right: number }[] = [];

        for (let i = 0; i < count; i++) {
          const box = await images.nth(i).boundingBox();
          if (box) {
            boxes.push({
              top: box.y,
              bottom: box.y + box.height,
              left: box.x,
              right: box.x + box.width,
            });
          }
        }

        // Assert no pair of bounding boxes overlap
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            const overlaps =
              a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            expect(overlaps, `Image ${i} and image ${j} overlap`).toBe(false);
          }
        }
      }
    }

    await page.screenshot({ path: 'test-results/recent-assets.png' });
  });
});
