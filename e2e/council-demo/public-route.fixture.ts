import {test,expect} from '@playwright/test';
const entry='/council/238/offerings.html';
test.beforeEach(async({context})=>{
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'&&['GET','HEAD'].includes(r.request().method())?r.continue():r.abort());
});
test('standalone public entry hands historical and application links back to their own documents',async({page})=>{
 await page.route('**/council/237',r=>r.fulfill({contentType:'text/html',body:'<h1>Historical destination fixture</h1>'}));
 await page.route('**/council-of-life',r=>r.fulfill({contentType:'text/html',body:'<h1>Existing Council destination fixture</h1>'}));
 await page.goto(entry);await page.getByRole('link',{name:'Previous Circle · 237',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Historical destination fixture'})).toBeVisible();await expect(page.locator('.fixture-shell')).toHaveCount(0);
 await page.goBack();await expect(page.locator('.fixture-shell')).toBeVisible();
 await page.getByRole('link',{name:'Return to the Council Canopy',exact:true}).first().click();await expect(page.getByRole('heading',{name:'Existing Council destination fixture'})).toBeVisible();
 await page.goto(entry);await page.getByRole('combobox',{name:'Choose a Council Circle'}).selectOption('237');await expect(page.getByRole('heading',{name:'Historical destination fixture'})).toBeVisible();
});
test('production response keeps demo assets local and permits synthetic voice without microphone or uploads',async({page})=>{
 const mutations:string[]=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))mutations.push(r.url());});
 const response=await page.goto(entry+'?companion=hoopoe');
 expect(response?.headers()['content-security-policy']).toContain("media-src 'self' blob: data:");
 expect(response?.headers()['content-security-policy']).toContain("connect-src 'self'");
 await page.getByRole('button',{name:/^Leave something with /}).click();await page.getByRole('button',{name:'Voice',exact:true}).click();await page.getByRole('button',{name:'Choose synthetic voice example'}).click();
 const audio=page.locator('audio');await expect(audio).toHaveCount(1);await audio.evaluate(async a=>{await(a as HTMLAudioElement).play();});
 expect(await audio.evaluate(a=>(a as HTMLAudioElement).error)).toBeNull();await expect(page.locator('input[type=file]')).toHaveCount(0);expect(mutations).toEqual([]);
});
