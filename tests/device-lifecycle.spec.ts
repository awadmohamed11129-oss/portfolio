import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { assertWidth, attachJson } from './helpers';
import { worldMetrics } from './metrics';

type Device = 'monitor' | 'phone';
type Projection = { device: Device | null; left: number; top: number; width: number; height: number; ready: boolean };
type Snapshot = {
  camera: { position: number[]; quaternion: number[]; target: number[] };
  flightActive: boolean; homeProgress: number; aboutProgress: number; pathProgress: number;
  frames: number; geometries: number; textures: number; destination: string; mode: string;
};
type EvidenceWindow = Window & { qaProjections?: Projection[] };

test.beforeEach(async ({ page }) => {
  test.skip(process.env.QA_WORLD !== '1', 'Requires coordinator-confirmed integrated Room/World and assigned browser slot.');
  await page.addInitScript(() => {
    const target = window as EvidenceWindow;
    target.qaProjections = [];
    window.addEventListener('portfolio:device-projection', event => target.qaProjections!.push((event as CustomEvent<Projection>).detail));
  });
});

async function snapshot(page: Page) {
  const result = await worldMetrics(page) as unknown as Snapshot;
  expect(result.camera?.position, 'Actual rendered camera diagnostics must be present').toHaveLength(3);
  expect(result.camera?.quaternion).toHaveLength(4);
  expect([...result.camera.position, ...result.camera.quaternion, ...result.camera.target].every(Number.isFinite)).toBe(true);
  return result;
}

async function settled(page: Page, destination: string) {
  const stage = page.locator('[data-world-status]');
  await expect(stage).toHaveAttribute('data-world-status', 'ready');
  await expect(stage).toHaveAttribute('data-world-destination', destination);
  await expect(stage).toHaveAttribute('data-world-flying', 'false');
  await expect.poll(async () => (await snapshot(page)).flightActive).toBe(false);
  return snapshot(page);
}

async function enterRoom(page: Page) {
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'About me', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Step into the room', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'world');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).toBe('hidden');
  await expect(page.getByRole('navigation', { name: 'Room devices' })).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(true);
}

async function openDevice(page: Page, device: Device) {
  // Deliberately do not wait for the room's flight/compile first. An early opener
  // is a real user action and must not strand a session on a stale camera.
  const opener = page.getByRole('button', { name: `Open ${device}`, exact: true });
  await expect(opener, 'Only Room owns persistent device openers').toHaveCount(1);
  await opener.click();
  const dialog = page.getByRole('dialog', { name: device === 'monitor' ? 'Projects' : 'Profile & contact', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('data-device', device);
  await expect(dialog.getByRole('button', { name: /Exit device/ })).toBeFocused();
  await expect(dialog.locator('[data-device-scroll]')).toBeVisible();
  await settled(page, 'about');
  return { dialog, opener, screen: dialog.locator('[data-device-scroll]') };
}

async function projection(page: Page) {
  return page.evaluate(() => {
    window.dispatchEvent(new Event('portfolio:request-device-projection'));
    return (window as EvidenceWindow).qaProjections?.at(-1) ?? null;
  });
}

function sameCamera(before: Snapshot, after: Snapshot) {
  for (const key of ['position', 'quaternion', 'target'] as const) {
    before.camera[key].forEach((value, index) => expect(after.camera[key][index], `camera.${key}[${index}]`).toBeCloseTo(value, 6));
  }
  expect(after.homeProgress).toBe(before.homeProgress);
  expect(after.aboutProgress).toBe(before.aboutProgress);
  expect(after.pathProgress).toBeCloseTo(before.pathProgress, 6);
}

for (const device of ['monitor', 'phone'] as const) {
  test(`${device}: actual projection, contained scrolling, keyboard and focus lifecycle`, async ({ page }, testInfo) => {
    await enterRoom(page);
    const overflowBefore = await page.evaluate(() => document.body.style.overflow);
    const { dialog, opener, screen } = await openDevice(page, device);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    if (testInfo.project.use.viewport!.width === 390) await expect(dialog).toHaveAttribute('data-expanded', 'true');
    if (testInfo.project.use.viewport!.width === 1440) await expect(dialog, 'Desktop must exercise the actual focused screen, not silently pass via expansion').toHaveAttribute('data-expanded', 'false');
    const expanded = await dialog.getAttribute('data-expanded') === 'true';
    const actualProjection = await projection(page);
    if (!expanded) {
      expect(actualProjection?.device).toBe(device);
      expect(actualProjection?.ready).toBe(true);
      const box = await screen.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeCloseTo(actualProjection!.left, 0);
      expect(box!.y).toBeCloseTo(actualProjection!.top, 0);
      expect(box!.width).toBeCloseTo(actualProjection!.width, 0);
      expect(box!.height).toBeCloseTo(actualProjection!.height, 0);
    }
    const before = await snapshot(page);
    const pageScroll = await page.evaluate(() => scrollY);
    expect(await screen.evaluate(node => node.scrollHeight > node.clientHeight), 'The real device content must be scrollable for this check').toBe(true);
    const box = await screen.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.wheel(0, 450);
    await expect.poll(() => screen.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    sameCamera(before, await snapshot(page));
    expect(await page.evaluate(() => scrollY)).toBe(pageScroll);
    await screen.evaluate(node => { node.scrollTop = 0; });
    await screen.focus();
    await page.keyboard.press('PageDown');
    await expect.poll(() => screen.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    sameCamera(before, await snapshot(page));

    const focusables = dialog.locator('button, a[href], [tabindex="0"]');
    await focusables.first().focus();
    await page.keyboard.press('Shift+Tab');
    await expect(focusables.last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(focusables.first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(overflowBefore);
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'world');
    await expect.poll(async () => (await projection(page))?.ready).toBe(false);
    await assertWidth(page, testInfo);
    await attachJson(testInfo, 'device-focus-scroll', { device, expanded, actualProjection, before, afterExit: await settled(page, 'about') });
  });

  test(`${device}: expansion, resize and accessible device views`, async ({ page }, testInfo) => {
    await enterRoom(page);
    const { dialog, screen, opener } = await openDevice(page, device);
    const focusedAxe = await new AxeBuilder({ page }).analyze();
    await attachJson(testInfo, 'device-axe-before-expansion', { violations: focusedAxe.violations, incomplete: focusedAxe.incomplete });
    expect(focusedAxe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    if (await dialog.getAttribute('data-expanded') === 'false') {
      const eventCount = await page.evaluate(() => (window as EvidenceWindow).qaProjections!.length);
      await page.setViewportSize({ width: 1100, height: 900 });
      await expect.poll(() => page.evaluate(start => (window as EvidenceWindow).qaProjections!.slice(start).some(value => !value.ready), eventCount)).toBe(true);
      await expect(screen).toBeVisible();
      if (await dialog.getAttribute('data-expanded') === 'false') {
        await expect.poll(async () => (await projection(page))?.ready).toBe(true);
        const adjusted = await projection(page);
        const adjustedBox = await screen.boundingBox();
        expect(adjustedBox!.x).toBeCloseTo(adjusted!.left, 0);
        expect(adjustedBox!.y).toBeCloseTo(adjusted!.top, 0);
      }
    }
    if (await dialog.getAttribute('data-expanded') === 'false') await dialog.getByRole('button', { name: 'Expand view', exact: true }).click();
    await expect(dialog).toHaveAttribute('data-expanded', 'true');
    await expect(screen).toBeVisible();
    await expect.poll(async () => (await projection(page))?.ready).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(dialog).toHaveAttribute('data-expanded', 'true');
    expect(await page.evaluate(() => innerWidth)).toBe(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    const box = await screen.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    const expandedAxe = await new AxeBuilder({ page }).analyze();
    await attachJson(testInfo, 'device-axe-expanded', { violations: expandedAxe.violations, incomplete: expandedAxe.incomplete });
    expect(expandedAxe.violations.filter(v => v.impact === 'serious' || v.impact === 'critical')).toEqual([]);
    await dialog.getByRole('button', { name: /Exit device/ }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

test('device content navigation and same-path Back clean up sessions', async ({ page }) => {
  await enterRoom(page);
  let opened = await openDevice(page, 'monitor');
  await opened.screen.getByRole('link', { name: 'PaveScan AI', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/pavescan-ai$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main h1')).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole('button', { name: 'Step into the room' }).click();
  opened = await openDevice(page, 'phone');
  await opened.screen.getByRole('link', { name: 'Full profile', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'About me', exact: true })).toBeVisible();
  // Same-route history is created in the browser only, never published in app data.
  await page.evaluate(() => history.pushState(history.state, '', '/about#qa-history'));
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await openDevice(page, 'phone');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/about$/);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await expect.poll(async () => (await projection(page))?.ready).toBe(false);
});

test('rapid cancellation and three room re-entries do not revive obsolete devices or grow resources', async ({ page }, testInfo) => {
  await page.goto('/projects');
  const projectsCamera = await settled(page, 'projects');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Step into the room' })).toBeVisible();
  await page.getByRole('button', { name: 'Step into the room' }).click();
  await page.getByRole('button', { name: 'Open monitor', exact: true }).click();
  // Close while focus is pending. A later projection must never revive the modal.
  await page.getByRole('dialog').getByRole('button', { name: /Exit device/ }).click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
  sameCamera(projectsCamera, await settled(page, 'projects'));
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await projection(page))?.ready).toBe(false);
  const samples: Snapshot[] = [];
  // First complete visit warms resources that frustum culling did not upload
  // during a cancelled arrival; compare the following three complete visits.
  for (let cycle = 0; cycle < 4; cycle++) {
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
    await page.getByRole('button', { name: 'Step into the room' }).click();
    const { dialog } = await openDevice(page, 'phone');
    samples.push(await settled(page, 'about'));
    await expect(page.locator('canvas[data-world-canvas]')).toHaveCount(1);
    await dialog.getByRole('button', { name: /Exit device/ }).click();
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true }).click();
    sameCamera(projectsCamera, await settled(page, 'projects'));
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await attachJson(testInfo, 'room-reentry-resources', { warmup: samples[0], completeVisits: samples.slice(1) });
  for (const sample of samples.slice(2)) {
    expect(sample.geometries).toBe(samples[1].geometries);
    expect(sample.textures).toBe(samples[1].textures);
  }
});

test('WebGL loss during an active device restores readable main and releases modal scroll lock', async ({ page }, testInfo) => {
  await enterRoom(page);
  await openDevice(page, 'monitor');
  const supported = await page.evaluate(() => {
    const extension = document.querySelector('canvas')!.getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    (window as Window & { qaRestoreContext?: () => void }).qaRestoreContext = () => extension.restoreContext();
    extension.loseContext();
    return true;
  });
  expect(supported).toBe(true);
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', 'lost');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  await expect(page.getByRole('heading', { name: 'About me', exact: true })).toBeVisible();
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('main h1').hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await expect.poll(async () => (await projection(page))?.ready).toBe(false);
  await page.evaluate(() => (window as Window & { qaRestoreContext?: () => void }).qaRestoreContext!());
  await expect(page.locator('[data-world-status]')).toHaveAttribute('data-world-status', 'ready');
  await page.getByRole('button', { name: 'Step into the room' }).click();
  const { dialog } = await openDevice(page, 'monitor');
  await expect(dialog.locator('[data-device-scroll]')).toBeVisible();
  await attachJson(testInfo, 'device-context-restored', await snapshot(page));
});

test('About world locks document scrolling and Read this page restores it', async ({ page }, testInfo) => {
  await enterRoom(page);
  const before = await settled(page, 'about');
  const documentPosition = await page.evaluate(() => scrollY);
  await page.mouse.move(testInfo.project.use.viewport!.width / 2, 300);
  await page.mouse.wheel(0, -400);
  await expect.poll(async () => (await snapshot(page)).aboutProgress).toBeLessThan(before.aboutProgress);
  await expect.poll(async () => (await snapshot(page)).pathProgress).toBeLessThan(before.pathProgress);
  await settled(page, 'about');
  expect(await page.evaluate(() => scrollY), 'Accepted world travel must not scroll hidden route content').toBe(documentPosition);
  await page.getByRole('button', { name: 'Read this page', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-mode', 'content');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflowY)).not.toBe('hidden');
  expect(await page.locator('main').evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.locator('main h1').hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await attachJson(testInfo, 'world-document-scroll-lock', { before, worldDocumentPosition: documentPosition, restoredContentScroll: await page.evaluate(() => scrollY) });
});

test('world keyboard travel changes progress while content scrolling preserves camera', async ({ page }, testInfo) => {
  await page.goto('/');
  const before = await settled(page, 'home');
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press('ArrowDown');
  await expect.poll(async () => (await snapshot(page)).homeProgress).toBeGreaterThan(before.homeProgress);
  await settled(page, 'home');
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: true }).click();
  const content = await settled(page, 'about');
  const start = await page.evaluate(() => scrollY);
  await page.locator('main h1').hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(start);
  sameCamera(content, await snapshot(page));
  await attachJson(testInfo, 'world-versus-content-input', { before, content, afterContentWheel: await snapshot(page) });
});

test('Back restores the exact Home scroll position and corresponding camera', async ({ page }, testInfo) => {
  await page.goto('/');
  await settled(page, 'home');
  await page.evaluate(() => window.scrollTo({ top: Math.min(1681, document.documentElement.scrollHeight - innerHeight - 50), behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect.poll(async () => {
    const actual = await snapshot(page);
    const progress = await page.evaluate(() => scrollY / (document.documentElement.scrollHeight - innerHeight));
    return Math.abs(actual.homeProgress - progress);
  }).toBeLessThan(.002);
  const camera = await settled(page, 'home');
  const position = await page.evaluate(() => scrollY);
  const nav = page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Projects', exact: true });
  const navBounds = await nav.boundingBox();
  expect(navBounds).not.toBeNull();
  expect(navBounds!.y).toBeGreaterThanOrEqual(0);
  expect(navBounds!.y + navBounds!.height).toBeLessThanOrEqual(testInfo.project.use.viewport!.height);
  // Locator.click() scrollIntoView moved this already-visible sticky link's
  // document before activation. Use a real pointer at its observed rectangle;
  // keep the exact saved-position assertion unchanged.
  await page.mouse.click(navBounds!.x + navBounds!.width / 2, navBounds!.y + navBounds!.height / 2);
  await settled(page, 'projects');
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await settled(page, 'home');
  const returned = await snapshot(page);
  await attachJson(testInfo, 'home-back-restoration', { savedScrollY: position, returnedScrollY: await page.evaluate(() => scrollY), before: camera, after: returned });
  await expect.poll(() => page.evaluate(() => scrollY), { message: 'Back must restore the actual saved Home position, not merely align the camera to an incorrect restored position' }).toBeCloseTo(position, 0);
  sameCamera(camera, await snapshot(page));
});

test('native Home wheel/reversal and mobile release inertia stay aligned with document scroll', async ({ page, context }, testInfo) => {
  await page.goto('/');
  await settled(page, 'home');
  const observations: unknown[] = [];
  async function aligned(label: string) {
    await expect.poll(async () => {
      const state = await snapshot(page);
      const position = await page.evaluate(() => ({ y: scrollY, range: document.documentElement.scrollHeight - innerHeight }));
      return Math.max(Math.abs(state.homeProgress - position.y / position.range), Math.abs(state.pathProgress - position.y / position.range));
    }).toBeLessThan(.002);
    await settled(page, 'home');
    observations.push({ label, scroll: await page.evaluate(() => ({ y: scrollY, range: document.documentElement.scrollHeight - innerHeight })), world: await snapshot(page) });
  }
  if (testInfo.project.use.hasTouch) {
    const cdp = await context.newCDPSession(page);
    await page.evaluate(() => { document.addEventListener('scrollend', () => { document.documentElement.dataset.qaScrollEnded = 'true'; }, { once: true }); });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y: 550 }] });
    for (let y = 510; y >= 190; y -= 40) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 330, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(page.locator('html'), 'Observe actual native scrollend after touch release, not an arbitrary inertia sleep').toHaveAttribute('data-qa-scroll-ended', 'true');
    await aligned('touch release and native scrollend');
  } else {
    await page.locator('.home-summary').hover();
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
    await aligned('unprotected hero wheel');
  }
  const forward = await page.evaluate(() => scrollY);
  await page.mouse.move(testInfo.project.use.viewport!.width - 45, 300);
  await page.mouse.wheel(0, -300);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(forward);
  await aligned('reverse');
  await page.getByRole('button', { name: 'Read introduction', exact: true }).click();
  await expect(page.locator('.journey-spacer')).toBeHidden();
  await expect(page.locator('.journey-cue')).toBeHidden();
  await attachJson(testInfo, 'native-home-scroll', observations);
});

test('390px native touch tap and swipe scroll the phone without world travel', async ({ page, context }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'Touch emulation only; this does not close physical iPhone Safari gate.');
  await enterRoom(page);
  await page.getByRole('button', { name: 'Open phone', exact: true }).tap();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAttribute('data-expanded', 'true');
  const screen = dialog.locator('[data-device-scroll]');
  await expect(screen).toBeVisible();
  const before = await settled(page, 'about');
  const box = await screen.boundingBox();
  const cdp = await context.newCDPSession(page);
  const x = box!.x + box!.width / 2;
  const startY = box!.y + box!.height * .8;
  await screen.evaluate(node => node.addEventListener('scrollend', () => node.setAttribute('data-qa-scroll-ended', 'true'), { once: true }));
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: startY }] });
  for (let step = 1; step <= 8; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: startY - step * 40 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => screen.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
  await expect(screen, 'Wait for native momentum to finish before testing a new discrete tap').toHaveAttribute('data-qa-scroll-ended', 'true');
  sameCamera(before, await snapshot(page));
  await dialog.getByRole('button', { name: /Exit device/ }).tap();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await attachJson(testInfo, 'touch-scope', { viewport: await page.evaluate(() => innerWidth), device: 'Edge touch emulation', physicalIPhone: 'UNVERIFIED' });
});
