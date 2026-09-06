import { expect, type Page } from '@playwright/test';

export type StageSnapshot = {
  destination: string; body: string; flightActive: boolean; filmProgress: number;
  groundAsleep?: boolean; globeReady?: boolean; sceneAlive?: boolean;
  [key: string]: unknown;
};
export type FlightEvent = { at: number; detail: Record<string, unknown> };
export type FlightFrame = { at: number; path: string; opacity: number; flight: unknown; fontsReady: boolean;
  header: { opacity: string; visibility: string; display: string; x: number; y: number; width: number; height: number } | null;
  nav: { opacity: string; visibility: string; display: string } | null };
export type StageWindow = Window & {
  __portfolioWorld?: { id: string };
  __world?: { snapshot(): StageSnapshot; performance(reset?: boolean): Record<string, unknown> };
  roomProof?: { state: { progress: number; playing: boolean; playbackRate: number; ready: boolean }; seek?: (value: number) => void };
  __qaFlight?: { events: FlightEvent[]; frames: FlightFrame[]; active: boolean; started: number };
};

export const casePaths = ['/projects/pavescan-ai', '/projects/civic-data-pipeline', '/projects/localflow', '/projects/pop-up-chapel'];
export const destinationPaths = ['/', '/projects', '/experience', '/about', '/resume', '/contact', ...casePaths];
export const destinationId = (path: string) => path === '/' ? 'home' : path.split('/')[1];

export async function snapshot(page: Page) {
  return page.evaluate(() => (window as StageWindow).__world?.snapshot());
}

export async function worldReady(page: Page, destination?: string) {
  await expect(page.locator('canvas')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => (window as StageWindow).__portfolioWorld?.id)).toBeTruthy();
  // About renders its own room while the suspended world remains at the film origin.
  if (destination === 'about') await expect(page.locator('html')).toHaveAttribute('data-destination', 'about');
  else if (destination) await expect.poll(async () => (await snapshot(page))?.destination).toBe(destination);
  await expect.poll(async () => (await snapshot(page))?.sceneAlive).toBe(true);
}

// Ancestor opacity multiplies: h1 alone remains 1 while its column is invisible.
export async function installFlightRecorder(page: Page) {
  await page.addInitScript(() => {
    const record = { events: [] as FlightEvent[], frames: [] as FlightFrame[], active: false, started: 0 };
    (window as StageWindow).__qaFlight = record;
    document.addEventListener('stage:flight', event => record.events.push({ at: performance.now(), detail: (event as CustomEvent<Record<string, unknown>>).detail }));
    function tick(now: number) {
      if (record.active) {
        let opacity = 1;
        let node: Element | null = document.querySelector('main h1');
        if (!node) opacity = 0;
        while (node) {
          const css = getComputedStyle(node);
          opacity *= Number(css.opacity);
          if (css.display === 'none' || css.visibility === 'hidden') opacity = 0;
          node = node.parentElement;
        }
        const header = document.querySelector('.site-header');
        const nav = header?.querySelector('nav');
        const headerStyle = header && getComputedStyle(header);
        const navStyle = nav && getComputedStyle(nav);
        const rect = header?.getBoundingClientRect();
        record.frames.push({ at: now, path: location.pathname, opacity, flight: (window as StageWindow).__world?.snapshot().flightActive, fontsReady: document.fonts.status === 'loaded',
          header: headerStyle && rect ? { opacity: headerStyle.opacity, visibility: headerStyle.visibility, display: headerStyle.display, x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null,
          nav: navStyle ? { opacity: navStyle.opacity, visibility: navStyle.visibility, display: navStyle.display } : null });
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

export async function clickDestination(page: Page, href = '/projects') {
  // A real DOM activation preserves React/Next interception and avoids an
  // automation click waiting for flight transforms to settle before timing starts.
  return page.evaluate(path => {
    const record = (window as StageWindow).__qaFlight!;
    record.events.length = 0;
    record.frames.length = 0;
    record.active = true;
    record.started = performance.now();
    const link = document.querySelector(`nav[aria-label="Primary"] a[href="${path}"]`) as HTMLAnchorElement;
    if (!link) throw new Error(`Missing navigation link ${path}`);
    link.click();
    return record.started;
  }, href);
}

export async function finishRecorder(page: Page) {
  return page.evaluate(() => {
    const record = (window as StageWindow).__qaFlight!;
    record.active = false;
    return record;
  });
}
