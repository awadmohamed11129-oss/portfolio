import { test, expect } from '@playwright/test';

test('room computer text fits when mobile browser controls reduce viewport height', async ({ page }) => {
  for (const [width, height] of [[393, 600], [390, 650], [393, 700], [393, 844], [844, 390], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    await page.evaluate(() => document.fonts.ready);
    const monitor = page.getByRole('button', { name: 'Open my profile on the room computer' });
    await expect(monitor).toBeVisible();
    const fits = await monitor.evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const name = element.querySelector('span')!;
      const range = document.createRange();
      range.selectNodeContents(name.firstChild!);
      const nameBounds = range.getBoundingClientRect();
      const promptBounds = element.querySelector('small')!.getBoundingClientRect();
      return [nameBounds, promptBounds].every(text => text.left >= bounds.left + 1 && text.right <= bounds.right - 1 && text.top >= bounds.top && text.bottom <= bounds.bottom);
    });
    expect(fits, `Text must stay inside the monitor at ${width}x${height}`).toBe(true);
    await monitor.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close profile' }).click();
  }
});
