import {test,expect} from '@playwright/test';
test.beforeEach(async({context})=>{await context.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort();});});
for(const host of ['2d','deck'])test(`${host}: ring, separate privacy, honest receipt, focus and next companion`,async({page},info)=>{
 // Two complete Deck offering/return journeys plus screenshots exceed 90s on CI software WebGL.
 if(host==='deck')test.setTimeout(180_000);
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const writes:string[]=[],errors:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/review/council-offerings.html?companion=bishop-ely-plane${host==='deck'?'&view=deck':''}`);
 // Safari/WebKit uses Option-Tab for full keyboard access to buttons.
 const tab=(back=false)=>page.keyboard.press((info.project.name==='webkit'&&process.platform==='darwin'?'Alt+':'')+(back?'Shift+':'')+'Tab');
 const frame=page.frameLocator('iframe');const offer=host==='deck'?frame.locator('[data-fixture-offer]'):page.getByRole('button',{name:/^Leave something with /});
 await expect(offer).toBeVisible({timeout:60000});
 await expect(offer).toHaveCSS('text-decoration-line','none');
 if(host==='deck'){await expect(frame.locator('body')).toHaveAttribute('data-sheet','mid');await offer.scrollIntoViewIfNeeded();await expect(frame.locator('[data-fixture-invitation]')).toHaveCount(1);await expect(frame.locator('.fixture-invitation .q')).toHaveCSS('font-family',/EB Garamond/);const embeddedFont=await frame.locator('.fixture-invitation .q').evaluate(async el=>(await el.ownerDocument.fonts.load('italic 21px "Council Offering EB Garamond"')).some(f=>f.family.includes('Council Offering EB Garamond')&&f.status==='loaded'));expect(embeddedFont).toBe(true);}
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-entry.png`});
 await offer.click();const dialog=page.getByRole('dialog');await expect(dialog).toHaveAttribute('data-host',host);
 await expect(dialog.locator('.oq')).toBeFocused();
 await tab();await expect(dialog.getByRole('button',{name:'Song',exact:true})).toBeFocused();
 await tab(true);await expect(dialog.getByRole('button',{name:'Close offering'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');await expect(dialog.getByRole('button',{name:'Or simply sit with it a while'})).toBeFocused();
 await page.keyboard.press('Tab');await expect(dialog.getByRole('button',{name:'Close offering'})).toBeFocused();
 await expect(dialog).toContainText('DEMO · nothing is saved');await expect(dialog.getByRole('button',{name:'Link an existing Ancient Friend offering'})).toHaveCount(0);
 const tokens=dialog.locator('.offering-token');await expect(tokens).toHaveCount(6);
 const boxes=await tokens.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));for(const b of boxes){expect(b.w).toBeGreaterThanOrEqual(76);expect(b.h).toBeGreaterThanOrEqual(76);}for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];expect(Math.hypot(a.x+a.w/2-b.x-b.w/2,a.y+a.h/2-b.y-b.h/2)).toBeGreaterThanOrEqual((a.w+b.w)/2);}
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-ring.png`});
 await dialog.getByRole('button',{name:'Song',exact:true}).click();await dialog.getByRole('button',{name:/A canopy hum/}).click();await dialog.getByRole('textbox',{name:'Why this song? (optional)'}).fill('A fictional canopy song.');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-compose.png`});
 await expect(dialog.getByRole('radio')).toHaveCount(0);await dialog.getByRole('button',{name:'Continue',exact:true}).click();await expect(dialog.getByLabel('Only me',{exact:true})).toBeChecked();
 await expect(dialog.getByRole('group',{name:'How should your song be held?'})).toBeVisible();
 const privateOption=dialog.getByRole('radio',{name:'Only me',exact:true}),reviewOption=dialog.getByRole('radio',{name:'The curators for this Circle',exact:true});
 await expect(privateOption).toHaveAccessibleDescription(/only you would see/);await expect(reviewOption).toHaveAccessibleDescription(/public sharing would need your separate agreement/);
 await privateOption.focus();await privateOption.press('ArrowRight');await expect(reviewOption).toBeChecked();await reviewOption.press('ArrowLeft');await expect(privateOption).toBeChecked();
 await expect(dialog.getByLabel('Future-design promises')).toBeVisible();await expect(dialog.getByLabel('Demo outcome')).toHaveCount(0);
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-hold-private.png`});
 await dialog.getByLabel('The curators for this Circle',{exact:true}).check();await expect(dialog).toContainText('public sharing would need your separate agreement');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-hold-review.png`});
 await dialog.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await expect(dialog.getByLabel('Demo receipt')).toBeVisible();await expect(dialog).toContainText('nothing was stored or sent');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-${host}-receipt.png`});
 await dialog.getByRole('button',{name:/Return to Bishop/}).click();await expect(dialog).toHaveCount(0);await expect(offer).toBeFocused();
 if(host==='deck'){await expect(frame.locator('body')).toHaveAttribute('data-sheet','mid');await expect(frame.locator('#grab')).toHaveAttribute('aria-expanded','true');}
 await offer.click();await expect(dialog.locator('.oq')).toBeFocused();await page.getByRole('button',{name:'Message',exact:true}).click();await page.getByRole('textbox',{name:'Your words'}).fill('Fictional message');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page.getByLabel('Only me',{exact:true})).toBeChecked();
 await page.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await page.getByRole('button',{name:'Meet the next companion'}).click();await expect(dialog).toHaveCount(0);
 if(host==='deck')await expect(frame.locator('#panel h2')).toContainText('Fig');else await expect(page).toHaveURL(/companion=fig/);
 const nextOffer=host==='deck'?frame.locator('[data-fixture-offer]'):page.getByRole('button',{name:/^Leave something with /});await expect(nextOffer).toBeFocused();await nextOffer.click();await expect(dialog).toContainText('Fig');await expect(dialog.locator('.oq')).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(nextOffer).toBeFocused();
 await nextOffer.click();await expect(dialog.locator('.oq')).toBeFocused();await page.locator('.offering-veil').click({position:{x:5,y:10}});await expect(dialog).toHaveCount(0);await expect(nextOffer).toBeFocused();
 expect(writes).toEqual([]);expect(errors).toEqual([]);await page.reload();await expect(dialog).toHaveCount(0);
});
test('QA only: synthetic source and unknown outcome; responsive narrow/landscape sheet',async({page},info)=>{
 await page.setViewportSize({width:320,height:740});await page.goto('/review/council-offerings.html?companion=hoopoe&qa=1');await page.getByRole('button',{name:/^Leave something with /}).click();
 const dialog=page.getByRole('dialog');await expect(dialog.locator('.offering-ring')).toHaveCSS('display','grid');
 await page.getByRole('button',{name:'Link an existing Ancient Friend offering'}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}).click();await page.getByLabel('Demo outcome').selectOption('unknown');await page.getByRole('button',{name:'Simulate offering'}).click();await expect(page.getByRole('alert')).toContainText('unknown');await expect(page.getByLabel('Demo receipt')).toHaveCount(0);
 await page.setViewportSize({width:844,height:390});await expect(dialog).toBeVisible();const box=await dialog.boundingBox();expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(391);await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-landscape-qa.png`});
});
test('seed path explains future curator-only privacy and never sends',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/review/council-offerings.html?companion=hoopoe');await page.getByRole('button',{name:/^Leave something with /}).click();await page.getByRole('button',{name:'Recommend a companion for next week'}).click();await expect(page.getByRole('dialog')).toContainText('your suggestion and your name would be seen by the curators only');await page.getByRole('combobox',{name:'Suggested companion'}).fill('A fictional tree');await page.getByRole('textbox',{name:'Why recommend them? (optional)'}).fill('A fictional suggestion');await page.getByRole('button',{name:'Preview recommendation (demo)'}).click();await expect(page.getByLabel('Demo receipt')).toContainText('Nothing was sent.');});

test('independent recommendation needs only a name and returns to its entrance',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 const writes:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});
 await page.goto('/review/council-offerings.html');const entrance=page.getByRole('button',{name:'Recommend a companion for next week',exact:true});await entrance.click();
 const dialog=page.getByRole('dialog');await expect(dialog.locator('.oq')).toBeFocused();await expect(dialog.getByRole('textbox',{name:'Why recommend them? (optional)'})).not.toHaveAttribute('required');
 await dialog.getByRole('combobox',{name:'Suggested companion'}).fill('A fictional oak');await dialog.getByRole('button',{name:'Preview recommendation (demo)'}).click();
 await expect(dialog.getByLabel('Demo receipt')).toContainText('Nothing was sent.');await expect(dialog).not.toContainText('Addressed to');await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-independent-recommendation.png`});
 await dialog.getByRole('button',{name:'Return to the Council',exact:true}).click();await expect(entrance).toBeFocused();await entrance.click();await page.reload();await expect(dialog.getByRole('combobox',{name:'Suggested companion'})).toHaveValue('');await page.keyboard.press('Escape');await expect(entrance).toBeFocused();expect(writes).toEqual([]);
});
