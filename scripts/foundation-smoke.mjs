import { chromium, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.PORTFOLIO_BASE_URL || "http://127.0.0.1:5190";
const evidence = resolve("C:/Garage/civil-drone/archive/personal-portfolio-2026-09-05");
mkdirSync(evidence, { recursive: true });
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, heading] of [["/","Mohamad"], ["/projects","Projects"], ["/experience","Experience"], ["/about","About me"], ["/projects/pavescan-ai","PaveScan AI"], ["/projects/localflow","LocalFlow"]]) {
      const response = await page.goto(base + path);
      expect(response.status()).toBe(200);
      await expect(page.locator("h1")).toContainText(heading);
      expect(await page.evaluate(() => innerWidth)).toBe(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  }
  await page.goto(base + "/#projects");
  await expect(page).toHaveURL(/\/projects$/);
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto(base + "/projects/pavescan-ai");
  await expect(page.getByText("275 are flagged as possible shadows", { exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(evidence, "foundation-pavescan.png"), fullPage: true });
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await nojs.newPage();
  await staticPage.goto(base + "/projects");
  await expect(staticPage.getByRole("heading", {name:"Projects",exact:true})).toBeVisible();
  await expect(staticPage.getByRole("link", {name:"PaveScan AI",exact:true})).toBeVisible();
  await nojs.close();
  expect(errors).toEqual([]);
  console.log(JSON.stringify({ status:"PASS", routeViewportChecks:18, legacyFragment:true, browserBack:true, noJavaScriptContent:true, pageErrors:errors }, null, 2));
} finally { await browser.close(); }
