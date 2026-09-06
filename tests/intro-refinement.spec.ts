import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { worldReady } from './destination-helpers';

type WorldWindow = Window & { roomProof?: {state:{progress:number;playing:boolean;playbackRate:number;ready:boolean}}, __portfolioWorld?: {film:{pause():void;render(p:number):void;snapshot():{progress:number}},navigator:{snapshot():{active:boolean}}} };
const readState = () => (window as WorldWindow).roomProof?.state;

test('fresh and refresh intro starts in room; visible clicks accelerate continuously', async ({ page }, info) => {
  await page.goto('/'); await page.waitForFunction(()=> (window as WorldWindow).roomProof?.state.ready);
  expect((await page.evaluate(readState))!.progress).toBeLessThan(.12);
  const x=info.project.use.viewport!.width*.75,y=info.project.use.viewport!.height*.55;
  for(const rate of [2,4,8,8]) {
    const before=(await page.evaluate(readState))!.progress;
    if(info.project.use.hasTouch) await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
    const after=(await page.evaluate(readState))!;
    expect(after.playbackRate).toBe(rate);expect(after.progress-before).toBeLessThan(.18);
    await expect(page.locator('#film-hint')).toBeHidden();
  }
  await expect.poll(async()=> (await page.evaluate(readState))!.progress).toBe(1);
  await page.reload();await page.waitForFunction(()=> (window as WorldWindow).roomProof?.state.ready);
  const fresh=(await page.evaluate(readState))!;
  expect(fresh.progress).toBeLessThan(.12);expect(fresh.playing).toBe(true);expect(fresh.playbackRate).toBe(1);
  const dir=`docs/qa/refinement/intro/${info.project.name}`;mkdirSync(dir,{recursive:true});await page.screenshot({path:`${dir}/refreshed-room.png`});
});

test('About follows the Earth to neighbourhood to room path and can be superseded',async({page},info)=>{
  await page.goto('/experience');await worldReady(page,'experience');
  await page.locator('nav[aria-label="Primary"] a[href="/about"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-returning','true');
  await expect(page).toHaveURL(/\/about$/);
  const first=(await page.evaluate(readState))!.progress;expect(first).toBeGreaterThan(.65);
  await page.waitForTimeout(2700);const middle=(await page.evaluate(readState))!.progress;
  expect(middle).toBeLessThan(first);expect(middle).toBeGreaterThan(.2);
  await expect(page.locator('html')).toHaveAttribute('data-destination','about',{timeout:9000});
  expect((await page.evaluate(readState))!.progress).toBe(0);
  await expect(page.getByRole('group',{name:'Photographic room view',exact:true})).toBeVisible();
  await page.locator('nav[aria-label="Primary"] a[href="/experience"]').click();await worldReady(page,'experience');
  await page.locator('nav[aria-label="Primary"] a[href="/about"]').click();
  await page.waitForTimeout(800);
  await page.locator('nav[aria-label="Primary"] a[href="/projects"]').click();
  await worldReady(page,'projects');await page.waitForTimeout(7000);
  await expect(page.locator('html')).toHaveAttribute('data-destination','projects');
  await expect(page.locator('html')).not.toHaveAttribute('data-returning','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(info.project.use.viewport!.width).toBeGreaterThan(300);
});

test('city and reading content clicks do not blank or cancel the scene',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.waitForFunction(()=> (window as WorldWindow).roomProof?.state.ready);
  await page.evaluate(()=>{const film=(window as WorldWindow).__portfolioWorld!.film;film.pause();film.render(.52);});await page.waitForTimeout(1000);
  const x=info.project.use.viewport!.width*.8,y=info.project.use.viewport!.height*.6;
  await page.mouse.move(x,y);await page.mouse.down();
  expect(await page.locator('#hero-scene').evaluate(el=>getComputedStyle(el).getPropertyValue('-webkit-tap-highlight-color'))).toBe('rgba(0, 0, 0, 0)');
  expect((await page.evaluate(readState))!.progress).toBe(.52);
  const dir=`docs/qa/refinement/intro/${info.project.name}`;mkdirSync(dir,{recursive:true});await page.screenshot({path:`${dir}/city-pointer-held.png`});await page.mouse.up();
  expect((await page.evaluate(readState))!.playing).toBe(true);
  expect((await page.evaluate(readState))!.playbackRate).toBe(2);
  await page.locator('nav[aria-label="Primary"] a[href="/experience"]').click();await page.waitForTimeout(1100);
  const before=await page.evaluate(()=> (window as WorldWindow).__portfolioWorld!.navigator.snapshot().active);
  await page.locator('#data-engineering h2').click();
  if(before)expect(await page.evaluate(()=> (window as WorldWindow).__portfolioWorld!.navigator.snapshot().active)).toBe(true);
  await worldReady(page,'experience');expect(errors).toEqual([]);
});
