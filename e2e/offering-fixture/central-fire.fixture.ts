import {test,expect} from '@playwright/test';
import {execFileSync} from 'node:child_process';
const expectedCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
test.afterEach(async({page})=>{await expect(page.locator('.fixture-shell')).toHaveAttribute('data-fixture-sha',expectedCommit);});
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());});
for(const width of [390,1440])test(`Council and Fire remain distinct, return, Back and refresh at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const writes:string[]=[],errors:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/review/council-offerings.html?companion=hoopoe');
 const fire=page.getByRole('button',{name:'Bring something to the Fire',exact:true});
 await fire.scrollIntoViewIfNeeded();await expect(page.getByRole('region',{name:'The Fire — review only'})).toContainText('No confirmed scheduled live Fire');await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-${width}-entry.png`});
 await fire.click();const dialog=page.getByRole('dialog',{name:'The Fire',exact:true});await expect(dialog.getByRole('heading',{name:'What happened?'})).toBeFocused();
 const practices=dialog.locator('.practice-token');await expect(practices).toHaveCount(5);for(const b of await practices.all()){const box=await b.boundingBox();expect(box!.width).toBeGreaterThanOrEqual(84);expect(box!.height).toBeGreaterThanOrEqual(84);}
 await expect(dialog.getByRole('button',{name:'Notice',exact:true})).toHaveAccessibleDescription('met · saw');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-${width}-practices.png`});
 await dialog.getByRole('button',{name:'Make',exact:true}).click();await expect(dialog.getByRole('button',{name:'Continue',exact:true})).toBeDisabled();
 await dialog.getByRole('textbox',{name:'What happened?',exact:true}).fill('A fictional moment tending a garden.');await expect(dialog.locator('details')).not.toHaveAttribute('open');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-${width}-compose.png`});
 await dialog.getByRole('button',{name:'Continue',exact:true}).click();const privateChoice=dialog.getByRole('radio',{name:'Only me',exact:true}),review=dialog.getByRole('radio',{name:'The curators for this Circle',exact:true}),aloud=dialog.getByRole('checkbox',{name:'Read aloud at the Fire'});
 await expect(privateChoice).toBeChecked();await expect(review).not.toBeChecked();await expect(aloud).toBeDisabled();await review.check();await expect(aloud).not.toBeChecked();await aloud.check();await privateChoice.check();await expect(aloud).not.toBeChecked();await expect(aloud).toBeDisabled();
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-${width}-holding.png`});
 await dialog.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await expect(dialog.getByLabel('Fire demo receipt')).toContainText('not saved, not submitted, not published');await expect(dialog).toContainText('StarPod Circle 238');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-${width}-receipt.png`});
 await dialog.getByRole('button',{name:'Return to the Council'}).click();await expect(dialog).toHaveCount(0);await expect(fire).toBeFocused();await expect(page.getByRole('region',{name:'Companion encounter'})).toContainText('Hoopoe');
 // Existing Council composer still addresses a companion, not the Fire or a nomination.
 await page.getByRole('button',{name:/^Leave something with /}).click();const council=page.getByRole('dialog');await expect(council).toHaveAccessibleName('Hoopoe');await page.getByRole('button',{name:'Message',exact:true}).click();await page.getByRole('textbox',{name:'Your words'}).fill('A fictional message to Hoopoe.');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await expect(page.getByLabel('Demo receipt')).toContainText('Hoopoe');await page.getByRole('button',{name:'Return to Hoopoe'}).click();
 const offer=page.getByRole('button',{name:/^Leave something with /});await offer.click();await page.goBack();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(offer).toBeFocused();
 await fire.click();await page.goBack();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(fire).toBeFocused();await fire.click();await page.getByRole('button',{name:'Notice',exact:true}).click();await page.getByRole('textbox',{name:'What happened?',exact:true}).fill('Discard this synthetic draft');await page.reload();
 await expect(page.getByRole('dialog',{name:'The Fire',exact:true})).toBeVisible();await page.getByRole('button',{name:'Notice',exact:true}).click();await expect(page.getByRole('textbox',{name:'What happened?',exact:true})).toHaveValue('');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(fire).toBeFocused();
 await expect(page.getByRole('region',{name:'Yours this week — demo'})).toHaveCount(0);expect(writes).toEqual([]);expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
// Each case exercises one complete journey with continuous original rendering.
// CI traces showed two journeys exhausted the total budget, not a failed focus assertion.
for(const action of ['listen','offering'] as const)test(`original Deck Fire ${action}: edition, exact context and focus return`,async({page},info)=>{
 test.setTimeout(180000);const writes:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/review/council-offerings.html?view=deck&node=live_fire');const frame=page.frameLocator('iframe');const fire=frame.locator('[data-fixture-fire]').first();await expect(fire).toBeAttached({timeout:60000});
 if(await frame.locator('body').getAttribute('data-sheet')==='peek')await frame.locator('#grab').tap();
 await expect(frame.locator('#panel .eyebrow.part')).toContainText('238');await fire.scrollIntoViewIfNeeded();await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-deck-${action}-doorway.png`});
 await fire.click();await expect(page.getByRole('dialog',{name:'The Fire',exact:true})).toBeVisible();
 if(action==='listen'){await page.getByRole('button',{name:/Or simply sit by the Fire and listen/}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(fire).toBeFocused();}
 else{await page.getByRole('button',{name:'Learn',exact:true}).click();await page.getByRole('textbox',{name:'What happened?',exact:true}).fill('A fictional learning moment');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await page.getByRole('button',{name:'Return to the Council'}).click();await expect(fire).toBeFocused();}await expect(frame.locator('body')).toHaveAttribute('data-sheet',/mid|full/);expect(new URL(page.frames()[1].url()).hash).toBe('#live_fire');
 await expect(frame.locator('#open-circle')).not.toBeVisible();

 expect(writes).toEqual([]);
});
test('narrow keyboard flow, safety and synthetic-only optional media',async({page},info)=>{
 await page.setViewportSize({width:320,height:740});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/review/council-offerings.html?companion=fig');await page.getByRole('button',{name:'Bring something to the Fire',exact:true}).click();const d=page.getByRole('dialog',{name:'The Fire',exact:true});await expect(d.locator('.practice-ring')).toHaveCSS('display','grid');await expect(d.getByRole('heading',{name:'What happened?'})).toBeFocused();
 await page.keyboard.press(info.project.name==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await expect(d.getByRole('button',{name:'Notice',exact:true})).toBeFocused();
 await d.getByRole('button',{name:'Gather',exact:true}).click();await d.getByRole('radio',{name:'Wild',exact:true}).check();await expect(d.getByLabel('Wild food needs care')).toBeVisible();await d.getByRole('textbox',{name:'What happened?',exact:true}).fill('A fictional observation, not food advice.');await d.getByText('Add more (optional)',{exact:true}).click();await d.getByRole('button',{name:'Use synthetic photo example'}).click();await d.getByRole('button',{name:'Use synthetic voice example'}).click();await expect(d.locator('input[type=file]')).toHaveCount(0);await expect(d.getByLabel('Kind of place (optional)')).toBeVisible();await page.setViewportSize({width:844,height:390});const b=await d.boundingBox();expect(b!.y).toBeGreaterThanOrEqual(0);expect(b!.y+b!.height).toBeLessThanOrEqual(391);await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-fire-landscape.png`});
});
test('server refuses writes and backend routes; gathering is QA-only',async({page,request})=>{
 const blocked=await request.post('/rest/v1/council-ledger',{data:{synthetic:true}});expect(blocked.status()).toBe(405);expect((await request.get('/functions/v1/offering-media')).status()).toBe(403);
 await page.goto('/review/council-offerings.html?fireState=gathering');await expect(page.getByRole('region',{name:'The Fire — review only'})).toContainText('Not happening now');
 await page.goto('/review/council-offerings.html?qa=1&fireState=gathering');await expect(page.getByRole('region',{name:'The Fire — review only'})).toContainText('Synthetic QA state: Happening now — not a live announcement');
});

test('original Deck independent recommendation: name-only and exact focus return',async({page})=>{
 test.setTimeout(180000);const writes:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/review/council-offerings.html?view=deck&node=live_fire');const frame=page.frameLocator('iframe');const recommendation=frame.locator('[data-fixture-recommend]');await expect(recommendation).toBeAttached({timeout:60000});if(await frame.locator('body').getAttribute('data-sheet')==='peek')await frame.locator('#grab').tap();
 await recommendation.click();const d=page.getByRole('dialog');await expect(d).toHaveAccessibleName('Recommend a companion');await d.getByRole('combobox',{name:'Suggested companion'}).fill('A fictional bird');await d.getByRole('button',{name:'Preview recommendation (demo)'}).click();await expect(d.getByLabel('Demo receipt')).toContainText('Nothing was sent.');await d.getByRole('button',{name:'Return to the Council',exact:true}).click();await expect(recommendation).toBeFocused();expect(new URL(page.frames()[1].url()).hash).toBe('#live_fire');expect(writes).toEqual([]);
});

for(const width of [320,390,1440])test(`first arrival: heading, three choices and reading order at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.goto('/review/council-offerings.html');
 const heading=page.getByRole('heading',{level:1});const meet=page.getByRole('button',{name:'Meet the ten companions',exact:true});const recommendation=page.getByRole('button',{name:'Recommend a companion for next week',exact:true});const fire=page.getByRole('button',{name:'Bring something to the Fire',exact:true});
 await expect(heading).toBeFocused();expect(await page.locator('.circle237').evaluate(m=>m.firstElementChild?.tagName)).toBe('HEADER');for(const button of [meet,recommendation,fire]){await expect(button).toBeInViewport({ratio:1});await expect(button).toHaveCount(1);}
 expect(await heading.evaluate((h)=>{const choices=document.querySelector('[aria-label="Ways to explore the Council"]');return !!choices&&!!(h.compareDocumentPosition(choices)&Node.DOCUMENT_POSITION_FOLLOWING);})).toBe(true);
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-arrival-${width}.png`});
 await heading.press(info.project.name==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await expect(meet).toBeFocused();await meet.press(info.project.name==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await expect(recommendation).toBeFocused();await recommendation.press(info.project.name==='webkit'&&process.platform==='darwin'?'Alt+Tab':'Tab');await expect(fire).toBeFocused();await meet.click();await expect(page.getByRole('region',{name:'Ten Council companions'})).toBeFocused();
});
