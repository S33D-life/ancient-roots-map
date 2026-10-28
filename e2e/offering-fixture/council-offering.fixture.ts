import {test,expect} from '@playwright/test';
test.beforeEach(async({context})=>{await context.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort();});});
test('2D companion: private draft, explicit Circle proposal, demo confirmation and return',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});const writes:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url());});
 await page.goto('/review/council-offerings.html?companion=goji-seed');
 await page.getByRole('button',{name:'Leave an offering · demo'}).click();await expect(page.getByRole('dialog')).toContainText('Goji Berry');
 await page.getByRole('button',{name:'Message / reflection',exact:true}).click();await expect(page.getByLabel('Keep private')).toBeChecked();
 await page.getByRole('textbox',{name:'Your words'}).fill('A fictional reflection beneath the demo canopy.');
 await page.getByLabel('Propose sharing with the Circle').check();await page.getByRole('button',{name:'Preview offering →'}).click();
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-phone-preview.png`});
 await page.getByRole('button',{name:'Simulate offering'}).click();await expect(page.getByText('Demo — not saved to Council Ledger.')).toBeVisible();
 await page.getByRole('button',{name:/Return to Goji/}).click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(writes).toEqual([]);
 await page.reload();await expect(page.getByRole('dialog')).toHaveCount(0);await page.getByRole('button',{name:'Leave an offering · demo'}).click();await page.getByRole('button',{name:'Story',exact:true}).click();await expect(page.getByLabel('Keep private')).toBeChecked();
});
test('authentic original Deck companion opens the same composer and returns',async({page},info)=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/review/council-offerings.html?view=deck&companion=hoopoe');
 const frame=page.frameLocator('iframe');await expect(frame.locator('#grab')).toBeVisible({timeout:60000});await frame.locator('#grab').click();await expect(frame.locator('[data-fixture-offer]')).toBeVisible();
 await expect(frame.locator('#panel h2')).toContainText('Hoopoe');await frame.locator('[data-fixture-offer]').click();
 await page.getByRole('button',{name:'Poem',exact:true}).click();await page.getByPlaceholder('Let the poem begin…').fill('A fixture feather\nrests in a fictional tree.');
 await page.getByRole('button',{name:'Preview offering →'}).click();await page.getByRole('button',{name:'Simulate offering'}).click();await expect(page.getByText('Demo — not saved to Council Ledger.')).toBeVisible();
 await page.getByRole('button',{name:'Return to Hoopoe'}).click();await expect(frame.locator('#panel h2')).toContainText('Hoopoe');
 await page.screenshot({path:`output/playwright/offering-fixture/${info.project.name}-original-deck.png`});
 const inside=page.frames()[1];await inside.evaluate(()=>{(window as any).TETOL_NAV.do('goTo','croom');});await expect(frame.locator('[data-fixture-offer]')).toHaveCount(0);
});
