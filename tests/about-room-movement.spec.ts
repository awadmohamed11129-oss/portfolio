import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

for (const requestedRoom of ['photographic', 'blender']) {
  test(`About photographic (?room=${requestedRoom}): drag, keyboard, reset and profile remain usable`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/about?room=${requestedRoom}`);
    await expect(page.locator('html')).toHaveAttribute('data-destination', 'about');
    await expect(page.locator('#loading')).toHaveAttribute('hidden', '');
    const room = page.locator('[data-room-variant]');
    await expect(room).toHaveAttribute('data-room-variant', 'photographic');
    await expect(page.getByTestId('blender-about-room')).toHaveCount(0);
    await expect(room.getByRole('button', { name: 'Reset view' })).toHaveCount(0);
    await expect(room.getByRole('group', { name: 'Compare About room designs' })).toHaveCount(0);
    await expect(room.getByText('Drag to look around')).toHaveCount(0);
    expect(await page.evaluate(() => innerWidth)).toBe(info.project.use.viewport!.width);
    const view = room.getByRole('group', { name: 'Photographic room view', exact: true });
    await expect(view).toHaveAccessibleDescription('Arrow keys move; Home resets.');
    const box = (await view.boundingBox())!;
    const start = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.63 };
    // Visibility alone does not wait for the journey startup layer to release input.
    await expect.poll(() => view.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), start), { message: 'Room becomes reachable after startup layers release input' }).toBe(true);
    const before = await view.screenshot();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + box.width * 0.25, start.y - box.height * 0.12, { steps: 12 });
    await page.mouse.up();
    await expect(view).not.toHaveAttribute('data-view-x', '0.000');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect((await view.screenshot()).equals(before), 'The rendered room changes after dragging').toBe(false);
    await view.focus();
    await page.keyboard.press('Home');
    await expect(view).toHaveAttribute('data-view-x', '0.000');
    await expect(view).toHaveAttribute('data-view-y', '0.000');
    await view.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(view).toHaveAttribute('data-view-x', '-0.160');
    await page.keyboard.press('Home');
    await expect(view).toHaveAttribute('data-view-x', '0.000');

    // Starting a drag over the computer/profile control must not open its dialog.
    const opener = room.getByRole('button', { name: /Open my profile/ });
    const control = (await opener.boundingBox())!;
    await page.mouse.move(control.x + control.width / 2, control.y + control.height / 2);
    await page.mouse.down();
    await page.mouse.move(control.x + control.width / 2 + 40, control.y + control.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await view.focus();
    await page.keyboard.press('Home');
    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await view.focus();
    await page.keyboard.press('ArrowRight');
    await expect(view).toHaveAttribute('data-view-x', '0.160');
    await page.waitForTimeout(300);
    await expect(view).toHaveAttribute('data-view-x', '0.160');
    await page.keyboard.press('Home');
    const portrait = page.locator('figure img[alt="Mohamad Awad"]');
    await expect.poll(() => portrait.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const work = page.locator('figure img[alt^="PaveScan output"]');
    await work.scrollIntoViewIfNeeded();
    await expect.poll(() => work.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(1600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical')).toEqual([]);
    await mkdir('docs/qa/refinement/about', { recursive: true });
    await page.screenshot({ path: `docs/qa/refinement/about/photographic-${requestedRoom}-${info.project.name}-full.png`, fullPage: true });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `docs/qa/refinement/about/photographic-${requestedRoom}-${info.project.name}.png` });
    expect(errors).toEqual([]);
  });

  test(`About photographic (?room=${requestedRoom}): native touch can move horizontally and scroll vertically`, async ({ page }, info) => {
    test.skip(!info.project.use.hasTouch, 'Native touch is verified in the phone project.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/about?room=${requestedRoom}`);
    await expect(page.locator('html')).toHaveAttribute('data-destination', 'about');
    await expect(page.locator('#loading')).toHaveAttribute('hidden', '');
    const room = page.locator('[data-room-variant]');
    await expect(room).toHaveAttribute('data-room-variant', 'photographic');
    await expect(page.getByTestId('blender-about-room')).toHaveCount(0);
    const view = room.locator('[data-view-x]');
    const box = (await view.boundingBox())!;
    const x = Math.round(box.x + box.width * 0.4), y = Math.round(box.y + box.height * 0.65);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', tx: number, ty: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: tx, y: ty }] });
    await touch('touchStart', x, y);
    for (let i = 1; i <= 8; i++) await touch('touchMove', x + i * 10, y);
    await touch('touchEnd', 0, 0);
    await expect(view).not.toHaveAttribute('data-view-x', '0.000');
    await expect(view).toHaveAttribute('data-view-y', '0.000');
    await touch('touchStart', x, y);
    for (let i = 1; i <= 8; i++) await touch('touchMove', x, y - i * 15);
    await touch('touchEnd', 0, 0);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(30);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await cdp.detach();
  });
}
