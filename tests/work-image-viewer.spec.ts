import { test, expect, type Locator, type Page } from '@playwright/test';
import { worldReady, snapshot } from './destination-helpers';
import { assertWidth } from './helpers';

const originalName = 'Compare original image and model findings';
const enlargedName = 'Compare enlarged original and model output';

async function readyComparison(page: Page, route = '/projects/pavescan-ai') {
  await page.goto(route);
  await worldReady(page, 'projects');
  await expect.poll(async () => (await snapshot(page))?.body).toBe('moon');
  await expect(page.locator('main')).toHaveAttribute('data-phase', 'idle');
  const original = page.getByRole('slider', { name: originalName, exact: true, includeHidden: true });
  await original.scrollIntoViewIfNeeded();
  await expect(original).toBeVisible();
  return original;
}

function viewer(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'PaveScan image viewer', exact: true });
  return { dialog, surface: dialog.getByTestId('image-viewer-surface') };
}

async function numericState(surface: Locator, key: 'zoom' | 'pan-x' | 'pan-y') {
  const value = await surface.getAttribute(`data-${key}`);
  expect(value, `Viewer exposes numeric ${key} state`).not.toBeNull();
  const number = Number(value);
  expect(Number.isFinite(number)).toBe(true);
  return number;
}

async function transforms(surface: Locator) {
  return surface.evaluate(element => [element, ...element.querySelectorAll('*')]
    .map(node => getComputedStyle(node).transform).filter(value => value !== 'none'));
}

async function clipping(dialog: Locator) {
  return dialog.evaluate(element => [...element.querySelectorAll('*')]
    .map(node => getComputedStyle(node).clipPath).filter(value => value !== 'none'));
}

async function zoomForBothPanAxes(dialog: Locator, surface: Locator) {
  const zoomIn = dialog.getByRole('button', { name: 'Zoom in', exact: true });
  for (let attempt = 0; attempt < 10 && await numericState(surface, 'zoom') < 4; attempt++) {
    await zoomIn.click();
  }
  expect(await numericState(surface, 'zoom')).toBeGreaterThanOrEqual(4);
  await expect.poll(() => surface.locator('img').first().evaluate(image =>
    (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  const overflow = await surface.evaluate(element => {
    const image = element.querySelector('img')!;
    const fit = Math.min(element.clientWidth / image.naturalWidth, element.clientHeight / image.naturalHeight);
    const zoom = Number(element.getAttribute('data-zoom'));
    return {
      x: image.naturalWidth * fit * zoom - element.clientWidth,
      y: image.naturalHeight * fit * zoom - element.clientHeight,
    };
  });
  expect(overflow.x, 'Scaled fitted image must overflow horizontally before pan assertions').toBeGreaterThan(0);
  expect(overflow.y, 'Scaled fitted image must overflow vertically before pan assertions').toBeGreaterThan(0);
}

for (const route of ['/projects/pavescan-ai', '/projects']) {
  test(`Image click opens viewer, comparison drag does not: ${route}`, async ({ page }, info) => {
    const original = await readyComparison(page, route);
    await assertWidth(page, info);
    const { dialog } = viewer(page);
    const box = await original.boundingBox();
    expect(box).not.toBeNull();
    const y = box!.y + box!.height / 2;
    await page.mouse.move(box!.x + box!.width * .8, y);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * .2, y, { steps: 8 });
    await page.mouse.up();
    await expect(dialog).not.toBeVisible();
    expect(Number(await original.inputValue())).toBeGreaterThanOrEqual(19);
    expect(Number(await original.inputValue())).toBeLessThanOrEqual(21);

    // The existing transparent range is the image's pointer interaction surface.
    if (info.project.use.hasTouch) await original.tap();
    else await original.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(original).toBeFocused();
    await original.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(original).toBeFocused();
  });
}

test('Viewer buttons, keyboard pan, comparison clipping and reset are independent', async ({ page }, info) => {
  const original = await readyComparison(page);
  await original.focus();
  await original.press('Home');
  await expect(original).toHaveValue('0');
  const opener = page.getByRole('button', { name: 'Enlarge images', exact: true });
  await opener.focus();
  await opener.press('Enter');
  const { dialog, surface } = viewer(page);
  await expect(dialog).toBeVisible();
  await expect(surface).toHaveAttribute('data-zoom', '1');
  await expect(dialog.getByText('100%', { exact: true })).toBeVisible();

  const zoomIn = dialog.getByRole('button', { name: 'Zoom in', exact: true });
  await zoomIn.focus();
  await zoomIn.press('Enter');
  const raisedZoom = await numericState(surface, 'zoom');
  expect(raisedZoom).toBeGreaterThan(1);
  await expect(dialog.getByText(`${Math.round(raisedZoom * 100)}%`, { exact: true })).toBeVisible();
  await zoomForBothPanAxes(dialog, surface);
  const beforePan = await transforms(surface);
  await surface.focus();
  await surface.press('ArrowRight');
  await surface.press('ArrowDown');
  expect(Math.abs(await numericState(surface, 'pan-x'))).toBeGreaterThan(0);
  expect(Math.abs(await numericState(surface, 'pan-y'))).toBeGreaterThan(0);
  expect(await transforms(surface)).not.toEqual(beforePan);

  const enlarged = dialog.getByRole('slider', { name: enlargedName, exact: true });
  await enlarged.focus();
  await enlarged.press('Home');
  await expect(enlarged).toHaveValue('0');
  const outputClip = await clipping(dialog);
  expect(outputClip.length).toBeGreaterThan(0);
  await enlarged.press('End');
  await expect(enlarged).toHaveValue('100');
  expect(await clipping(dialog)).not.toEqual(outputClip);
  // A full reveal must update the visible clipping, without moving the page comparison.
  await expect(original).toHaveValue('0');

  await enlarged.press('Home');
  await expect.poll(() => dialog.locator('img').evaluateAll(images => images
    .filter(image => { const bounds = image.getBoundingClientRect(); return bounds.width > 0 && bounds.height > 0; })
    .every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  await assertWidth(page, info);
  const evidence = info.outputPath(`pavescan-enlarged-output-${info.project.name}.png`);
  await page.screenshot({ path: evidence });
  await info.attach('Enlarged model output', { path: evidence, contentType: 'image/png' });

  const beforeZoomOut = await numericState(surface, 'zoom');
  await dialog.getByRole('button', { name: 'Zoom out', exact: true }).click();
  expect(await numericState(surface, 'zoom')).toBeLessThan(beforeZoomOut);
  await zoomIn.click();
  await dialog.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect(surface).toHaveAttribute('data-zoom', '1');
  expect(await numericState(surface, 'pan-x')).toBe(0);
  expect(await numericState(surface, 'pan-y')).toBe(0);
  await surface.focus();
  await surface.press('+');
  expect(await numericState(surface, 'zoom')).toBeGreaterThan(1);
  await surface.press('-');
  await expect(surface).toHaveAttribute('data-zoom', '1');
  await surface.press('+');
  await surface.press('0');
  await expect(surface).toHaveAttribute('data-zoom', '1');
  expect(await numericState(surface, 'pan-x')).toBe(0);
  expect(await numericState(surface, 'pan-y')).toBe(0);
  await dialog.getByRole('button', { name: 'Close image viewer', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('Wheel zoom and pointer drag change the image transform', async ({ page }) => {
  await readyComparison(page);
  const opener = page.getByRole('button', { name: 'Enlarge images', exact: true });
  await opener.click();
  const { dialog, surface } = viewer(page);
  await expect(dialog).toBeVisible();
  await surface.hover();
  await page.mouse.wheel(0, -300);
  await expect.poll(() => numericState(surface, 'zoom')).toBeGreaterThan(1);
  await zoomForBothPanAxes(dialog, surface);
  const box = await surface.boundingBox();
  expect(box).not.toBeNull();
  const before = { x: await numericState(surface, 'pan-x'), y: await numericState(surface, 'pan-y'), transforms: await transforms(surface) };
  await page.mouse.move(box!.x + box!.width * .45, box!.y + box!.height * .45);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height * .6, { steps: 8 });
  await page.mouse.up();
  expect(await numericState(surface, 'pan-x')).not.toBe(before.x);
  expect(await numericState(surface, 'pan-y')).not.toBe(before.y);
  expect(await transforms(surface)).not.toEqual(before.transforms);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test('Wheel zoom keeps the image point under an off-center cursor after panning', async ({ page }) => {
  await readyComparison(page);
  await page.getByRole('button', { name: 'Enlarge images', exact: true }).click();
  const { dialog, surface } = viewer(page);
  await zoomForBothPanAxes(dialog, surface);
  await surface.focus();
  await surface.press('ArrowRight');
  await surface.press('ArrowDown');
  const box = (await surface.boundingBox())!;
  const cursor = { x: box.x + box.width * .62, y: box.y + box.height * .58 };
  await page.mouse.move(cursor.x, cursor.y);

  // Track the same point in each rendered image, independently of viewer state/math.
  const landmarks = await surface.locator('img').evaluateAll((images, point) => images.map(image => {
    const bounds = image.getBoundingClientRect();
    return { x: (point.x - bounds.x) / bounds.width, y: (point.y - bounds.y) / bounds.height };
  }), cursor);
  for (const delta of [-100, -100, 100]) {
    const beforeZoom = await numericState(surface, 'zoom');
    await page.mouse.wheel(0, delta);
    await expect.poll(() => numericState(surface, 'zoom')).not.toBe(beforeZoom);
    const positions = await surface.locator('img').evaluateAll((images, points) => images.map((image, index) => {
      const bounds = image.getBoundingClientRect();
      return { x: bounds.x + bounds.width * points[index].x, y: bounds.y + bounds.height * points[index].y };
    }), landmarks);
    for (const point of positions) {
      expect(Math.abs(point.x - cursor.x), 'Image landmark must stay beneath cursor horizontally').toBeLessThan(1);
      expect(Math.abs(point.y - cursor.y), 'Image landmark must stay beneath cursor vertically').toBeLessThan(1);
    }
  }
});

test('First wheel step anchors the fitted image and zooming out returns to fit', async ({ page }) => {
  await readyComparison(page);
  await page.getByRole('button', { name: 'Enlarge images', exact: true }).click();
  const { surface } = viewer(page);
  const image = surface.locator('img').first();
  await expect.poll(() => image.evaluate(node => node instanceof HTMLImageElement && node.complete && node.naturalWidth > 0)).toBe(true);
  const box = (await surface.boundingBox())!;
  const fittedAxis = await image.evaluate(node =>
    node.clientWidth / (node as HTMLImageElement).naturalWidth <= node.clientHeight / (node as HTMLImageElement).naturalHeight ? 'x' : 'y');
  // The letterboxed axis stays centered until the image fills it; the fitted axis anchors immediately.
  const cursor = { x: box.x + box.width * (fittedAxis === 'x' ? .65 : .5), y: box.y + box.height * (fittedAxis === 'y' ? .65 : .5) };
  const before = (await image.boundingBox())!;
  const landmark = { x: (cursor.x - before.x) / before.width, y: (cursor.y - before.y) / before.height };
  await page.mouse.move(cursor.x, cursor.y);
  await page.mouse.wheel(0, -100);
  await expect.poll(() => numericState(surface, 'zoom')).toBeGreaterThan(1);
  const after = (await image.boundingBox())!;
  expect(Math.abs(after.x + landmark.x * after.width - cursor.x)).toBeLessThan(1);
  expect(Math.abs(after.y + landmark.y * after.height - cursor.y)).toBeLessThan(1);
  await page.mouse.wheel(0, 100);
  await expect(surface).toHaveAttribute('data-zoom', '1');
  expect(await numericState(surface, 'pan-x')).toBe(0);
  expect(await numericState(surface, 'pan-y')).toBe(0);
});

test('Two-finger touch pinch enlarges the image on mobile', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'mobile-390', 'Real touch input uses the touch-enabled project.');
  await readyComparison(page);
  await page.getByRole('button', { name: 'Enlarge images', exact: true }).tap();
  const { dialog, surface } = viewer(page);
  await expect(dialog).toBeVisible();
  const box = await surface.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + box!.height / 2;
  const session = await context.newCDPSession(page);
  const points = (spread: number) => [{ id: 1, x: x - spread, y }, { id: 2, x: x + spread, y }];
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(box!.width * .1) });
    for (const ratio of [.14, .19, .24]) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(box!.width * ratio) });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => numericState(surface, 'zoom')).toBeGreaterThan(1);
    expect(await transforms(surface)).not.toEqual([]);
    await assertWidth(page, info);
    await dialog.getByRole('button', { name: 'Reset view', exact: true }).tap();
    await expect(surface).toHaveAttribute('data-zoom', '1');
  } finally {
    await session.detach();
  }
});
