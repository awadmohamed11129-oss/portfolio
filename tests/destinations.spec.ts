import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { assertWidth, attachJson } from './helpers';
import { casePaths, destinationPaths, destinationId, snapshot, worldReady, installFlightRecorder, clickDestination, finishRecorder, type StageWindow } from './destination-helpers';

// Phase 1 deliberately tests persistence on every route, but only the Moon's
// destination behavior. Mars/descent/night-side/document flights are later work.
for (const route of destinationPaths) {
  test(`P1-G1 direct + reload persistent stage ${route}`, async ({ page }, info) => {
    await installFlightRecorder(page);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const reload of [false, true]) {
      const response = reload ? await page.reload() : await page.goto(route);
      expect(response?.status()).toBe(200);
      await worldReady(page, destinationId(route));
      await assertWidth(page, info);
      await page.waitForTimeout(500);
      expect((await snapshot(page))?.flightActive).toBe(false);
      const events = await page.evaluate(() => (window as StageWindow).__qaFlight!.events);
      expect(events.filter(event => event.detail.type === 'start')).toEqual([]);
      if (route.startsWith('/projects')) {
        expect((await snapshot(page))?.body).toBe('moon');
        expect((await snapshot(page))?.groundAsleep).toBe(true);
        expect((await snapshot(page))?.filmProgress).toBe(1);
      }
    }
    expect(errors).toEqual([]);
  });
}

test('P1-G1 renderer identity survives home, projects, case, projects, home', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await worldReady(page, 'home');
  const identity = await page.evaluate(() => {
    (window as unknown as { __qaCanvases: Element[] }).__qaCanvases = [...document.querySelectorAll('canvas')];
    return (window as StageWindow).__portfolioWorld!.id;
  });
  for (const route of ['/projects', '/projects/pavescan-ai', '/projects', '/']) {
    const link = route.includes('/projects/') ? page.locator(`main a[href="${route}"]`).first() : page.locator(route === '/' ? 'a.site-name[href="/"]' : `nav[aria-label="Primary"] a[href="${route}"]`).first();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : route + '$'}`));
    await worldReady(page, destinationId(route));
    expect(await page.evaluate(() => (window as StageWindow).__portfolioWorld!.id)).toBe(identity);
    expect(await page.evaluate(() => (window as unknown as { __qaCanvases: Element[] }).__qaCanvases.every((canvas, index) => canvas === document.querySelectorAll('canvas')[index]))).toBe(true);
    await assertWidth(page, info);
  }
});

for (const route of ['/projects', '/projects/pavescan-ai']) {
  test(`P1-G3 cold Moon ready within 1500 ms ${route}`, async ({ page }, info) => {
    await page.goto(route, { waitUntil: 'commit' });
    await page.waitForFunction(() => {
      const state = (window as StageWindow).__world?.snapshot();
      return state?.body === 'moon' && state?.globeReady && state?.sceneAlive;
    }, undefined, { timeout: 1500 });
    const readyAt = await page.evaluate(() => performance.now());
    await attachJson(info, 'cold-moon-ready', { route, readyAt, snapshot: await snapshot(page), method: 'Cold new Playwright context; milliseconds since navigation time origin, including HTML/JS/texture load.' });
    expect(readyAt).toBeLessThanOrEqual(1500);
    expect((await snapshot(page))?.flightActive).toBe(false);
    expect((await snapshot(page))?.filmProgress).toBe(1);
    await assertWidth(page, info);
  });
}

test('P1-G2 Moon flight timing, readable copy, URL and no reload', async ({ page }, info) => {
  await installFlightRecorder(page);
  await page.goto('/projects');
  await worldReady(page, 'projects');
  // Back/instant navigation gives an Earth endpoint without waiting through the intro.
  await page.locator('a.site-name[href="/"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => (await snapshot(page))?.flightActive).toBe(false);
  const origin = await page.evaluate(() => performance.timeOrigin);
  await clickDestination(page);
  await page.waitForTimeout(5600);
  const record = await finishRecorder(page);
  await attachJson(info, 'flight-timing', record);
  const first = record.frames.find(frame => frame.flight);
  const last = first && record.frames.find(frame => frame.at > first.at && !frame.flight);
  expect(first, 'Observed a live camera flight').toBeTruthy();
  expect(last, 'Observed its completion').toBeTruthy();
  const elapsed = last!.at - first!.at;
  expect(elapsed).toBeGreaterThanOrEqual(2200 - 34);
  expect(elapsed).toBeLessThanOrEqual(5000 + 150);
  const startEvent = record.events.find(event => event.detail.type === 'start');
  expect(startEvent, 'stage:flight start carries formula duration').toBeTruthy();
  const planned = Number(startEvent!.detail.duration);
  expect(Math.abs(elapsed - planned)).toBeLessThanOrEqual(150);
  const urlAt = record.frames.find(frame => frame.path === '/projects');
  expect(urlAt!.at - record.started).toBeLessThanOrEqual(350);
  const readable = record.frames.find(frame => frame.path === '/projects' && frame.opacity >= .99 && frame.fontsReady);
  expect(readable, 'New typeset copy became readable').toBeTruthy();
  expect(readable!.at - first!.at, 'Strong G2 timing gate, not the conflicting late-reveal formula').toBeLessThanOrEqual(elapsed * .35);
  const empty = record.frames.filter(frame => frame.at - first!.at >= 400 && frame.at - first!.at <= 800);
  expect(empty.length).toBeGreaterThan(0);
  expect(Math.max(...empty.map(frame => frame.opacity))).toBeLessThanOrEqual(.01);
  const beforeReveal = record.frames.find(frame => frame.at - first!.at >= 800);
  const afterReveal = record.frames.find(frame => frame.at - first!.at >= 1200);
  expect(beforeReveal!.opacity).toBeLessThanOrEqual(.01);
  expect(afterReveal!.opacity).toBeGreaterThanOrEqual(.99);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(origin);
  expect((await snapshot(page))?.body).toBe('moon');
  expect((await snapshot(page))?.groundAsleep).toBe(true);
  await assertWidth(page, info);
});

for (const cancel of ['pointerdown', 'Escape']) {
  test(`P1-G2 ${cancel} cancels by next frame without changing URL`, async ({ page }, info) => {
    await installFlightRecorder(page);
    await page.goto('/');
    await worldReady(page, 'home');
    await clickDestination(page);
    await expect(page).toHaveURL(/\/projects$/);
    await expect.poll(async () => (await snapshot(page))?.flightActive).toBe(true);
    if (cancel === 'pointerdown') await page.mouse.move(info.project.use.viewport!.width - 16, 400);
    const cancellation = await page.evaluate(kind => new Promise<{ elapsed: number; active: boolean | undefined; path: string }>(resolve => {
      const at = performance.now();
      if (kind === 'pointerdown') document.elementFromPoint(innerWidth - 16, 400)!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 11, button: 0 }));
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      requestAnimationFrame(now => resolve({ elapsed: now - at, active: (window as StageWindow).__world?.snapshot().flightActive, path: location.pathname }));
    }), cancel);
    await attachJson(info, 'cancellation', cancellation);
    expect(cancellation.active).toBe(false);
    expect(cancellation.elapsed).toBeLessThanOrEqual(100);
    expect(cancellation.path).toBe('/projects');
  });
}

test('P1-G2 early cancellation still resolves the URL destination body', async ({ page }, info) => {
  await installFlightRecorder(page);
  await page.goto('/');
  await worldReady(page, 'home');
  await clickDestination(page);
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 })));
  expect((await snapshot(page))?.flightActive).toBe(false);
  await expect(page).toHaveURL(/\/projects$/);
  await expect.poll(async () => (await snapshot(page))?.body).toBe('moon');
  expect((await snapshot(page))?.flightActive).toBe(false);
  expect((await snapshot(page))?.groundAsleep).toBe(true);
  await assertWidth(page, info);
});

test('P1-G3 Back returns to Earth without replay; reduced motion never starts a flight', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installFlightRecorder(page);
  await page.goto('/');
  await worldReady(page, 'home');
  await clickDestination(page);
  await page.waitForTimeout(220);
  const record = await finishRecorder(page);
  const readable = record.frames.find(frame => frame.path === '/projects' && frame.opacity >= .99);
  expect(readable).toBeTruthy();
  expect(readable!.at - record.started).toBeLessThanOrEqual(200);
  expect(record.frames.some(frame => frame.flight)).toBe(false);
  await worldReady(page, 'projects');
  await page.goBack();
  await worldReady(page, 'home');
  expect((await snapshot(page))?.body).toBe('earth');
  expect((await snapshot(page))?.filmProgress).toBe(1);
  expect(await page.evaluate(() => (window as StageWindow).roomProof?.state.playing)).toBe(false);
  await assertWidth(page, info);
});

for (const route of ['/projects', ...casePaths]) {
  test(`P1-G4 column, scroll, screenshots ${route}`, async ({ page }, info) => {
    await page.goto(route);
    await worldReady(page, 'projects');
    await assertWidth(page, info);
    const column = page.locator('[data-destination-column]');
    await expect(column).toHaveCount(1);
    const geometry = await column.evaluate(node => {
      const css = getComputedStyle(node);
      return { width: node.getBoundingClientRect().width, border: css.borderTopWidth, shadow: css.boxShadow, background: css.backgroundColor, scrim: getComputedStyle(node, '::before').backgroundImage };
    });
    if (info.project.use.viewport!.width === 1440) {
      expect(geometry.width / 1440).toBeGreaterThanOrEqual(.4);
      expect(geometry.width / 1440).toBeLessThanOrEqual(.46);
    }
    expect(geometry.border).toBe('0px');
    expect(geometry.shadow).toBe('none');
    expect(geometry.scrim).toContain('gradient');
    const before = await page.locator('#space-canvas').boundingBox();
    const progress = (await snapshot(page))?.filmProgress;
    await page.mouse.move(100, 650);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
    expect(await page.locator('#space-canvas').boundingBox()).toEqual(before);
    expect((await snapshot(page))?.filmProgress).toBe(progress);
    await page.evaluate(() => scrollTo(0, 0));
    const aboveFoldEvidence = await page.locator('[data-evidence-image]').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().top < innerHeight && node.getBoundingClientRect().bottom > 0).length);
    if (route !== '/projects') expect(aboveFoldEvidence).toBe(0);
    const folder = `docs/qa/phase1/${info.project.use.viewport!.width}`;
    mkdirSync(folder, { recursive: true });
    await page.screenshot({ path: `${folder}/${route.slice(1).replaceAll('/', '-')}.png`, fullPage: true });
    await attachJson(info, 'column-geometry', geometry);
  });
}

test('P1-G6 no pause UI; P1-G8 home click acceleration retained', async ({ page }, info) => {
  await page.goto('/');
  await worldReady(page, 'home');
  await expect(page.locator('#pause-motion, .motion-controls')).toHaveCount(0);
  const before = await page.evaluate(() => (window as StageWindow).roomProof?.state);
  expect(before?.playing).toBe(true);
  await page.locator('#hero-scene').dispatchEvent('click', { button: 0 });
  expect(await page.evaluate(() => (window as StageWindow).roomProof?.state.playbackRate)).toBe(2);
  await assertWidth(page, info);
});
