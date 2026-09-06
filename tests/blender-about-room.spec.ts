import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("Legacy Blender link opens only the photographic room", async ({ page }, testInfo) => {
  const errors: string[] = [];
  const blenderRequests: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/room/") || /BlenderAboutRoom/i.test(path)) blenderRequests.push(request.url());
  });
  await page.goto("/about?room=blender");
  const room = page.locator('[data-room-variant="photographic"]');
  await expect(room).toBeVisible();
  await expect(page.getByTestId("blender-about-room")).toHaveCount(0);
  await expect(room.locator("canvas")).toHaveCount(0);
  const photograph = room.locator('img[src="/assets/about-room-photo-v1.webp"]');
  await expect(photograph).toBeVisible();
  await expect.poll(() => photograph.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const opener = room.getByRole("button", { name: "Open my profile on the room computer" });
  await opener.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(opener).toBeFocused();
  await mkdir("docs/qa/launch-polish", { recursive: true });
  await page.screenshot({ path: `docs/qa/launch-polish/photo-${testInfo.project.name}.png`, fullPage: true });
  expect(blenderRequests).toEqual([]);
  expect(errors).toEqual([]);
});
