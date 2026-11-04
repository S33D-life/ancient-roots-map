import {test,expect} from '@playwright/test';
import {disconnectedTransport} from './fixtures/circle237-disconnected-transport';
for(const width of [320,390,1440])test(`founding gateway remains free-entry and no-write at${width}`,async({page,context},info)=>{
 await context.addInitScript(disconnectedTransport);
 await context.route('**/*',r=>{const q=r.request();return !['127.0.0.1','localhost'].includes(new URL(q.url()).hostname)||!['GET','HEAD'].includes(q.method())?r.abort():r.continue();});
 await page.setViewportSize({width,height:844});await page.goto('/support/founding');
 const main=page.getByRole('main');await expect(main.getByRole('heading',{name:'Welcome to S33D',exact:true})).toBeVisible();
 await expect(main.getByRole('link',{name:'Join or sign in for free'})).toHaveAttribute('href','/auth');
 await expect(main.getByRole('link',{name:'Visit the weekly Council'})).toHaveAttribute('href','/council-of-life');
 await expect(main.getByText('Crowdfunder — preparing launch',{exact:true})).toBeVisible();
 await expect(main.getByRole('link',{name:'View the existing S33D Giveth project'})).toHaveAttribute('href','https://giveth.io/project/s33dlife');
 await expect(main.locator('form,input,textarea,button')).toHaveCount(0);
 expect(await main.locator('a').evaluateAll(links=>links.every(a=>!a.href.includes('crowdfunder.')&&!a.href.includes('stripe.')))).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Safari's default Mac link-navigation shortcut is Option-Tab; no OS preferences changed.
 const first=main.getByRole('link',{name:'Explore Ancient Friends'});await first.focus();await expect(first).toBeFocused();await page.keyboard.press(info.project.name==='webkit'?'Alt+Tab':'Tab');await expect(main.getByRole('link',{name:'Visit the weekly Council'})).toBeFocused();
 await page.screenshot({path:`output/founding-gateway/${info.project.name}-${width}.png`,fullPage:true});
 await page.reload();await expect(main.getByRole('heading',{name:'Welcome to S33D',exact:true})).toBeVisible();
 await main.getByRole('link',{name:'Visit the weekly Council'}).click();await expect(page).toHaveURL(/council-of-life/);await page.goBack();await expect(main.getByRole('heading',{name:'Welcome to S33D',exact:true})).toBeVisible();
});
