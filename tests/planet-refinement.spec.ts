import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { worldReady, snapshot } from './destination-helpers';
for(const [route,body,label] of [['/experience','jupiter','Jupiter'],['/resume','mars','Mars'],['/contact','mercury','Mercury']]){
 test(`${label} is detailed, rotatable and survives navigation and resize`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(route);await worldReady(page,route.slice(1));
  await expect.poll(async()=> (await snapshot(page))?.body).toBe(body);
  await page.waitForTimeout(900);
  const dir=`docs/qa/refinement/planets/${info.project.name}`;mkdirSync(dir,{recursive:true});await page.screenshot({path:`${dir}/${body}.png`});
  const host=page.locator('#hero-scene');await expect(host).toHaveAttribute('aria-label',new RegExp(label));
  if(info.project.use.hasTouch)await page.getByRole('button',{name:`Rotate ${label}`,exact:true}).click();
  const longitude=()=>page.evaluate(()=> (window.roomProof?.state as {earth:{longitude:number}}).earth.longitude);
  await host.focus();const before=await longitude();await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(150);const after=await longitude();
  expect(Math.abs(after-before)).toBeGreaterThan(1);
  await page.keyboard.press('r');
  const original=info.project.use.viewport!;await page.setViewportSize({width:original.width+30,height:original.height});await page.waitForTimeout(300);
  expect((await snapshot(page))?.body).toBe(body);expect((await snapshot(page))?.sceneAlive).toBe(true);await page.setViewportSize(original);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('nav[aria-label="Primary"] a[href="/projects"]').click();await worldReady(page,'projects');expect((await snapshot(page))?.body).toBe('moon');
  await page.locator('a.site-name[href="/"]').click();await worldReady(page,'home');expect((await snapshot(page))?.body).toBe('earth');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);
 });
}
