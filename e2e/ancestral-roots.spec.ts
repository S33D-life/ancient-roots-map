import { test, expect } from '@playwright/test';
const entry='/review/ancestral-roots.html';
for (const width of [320,390,1440]) {
 test(`Root relationship and exact return at ${width}px`,async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
  const page=await context.newPage();const errors:string[]=[];const external:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'&&u.hostname!=='localhost'){external.push(route.request().method()+' '+u.hostname);return route.abort();}return route.continue();});
  await page.goto(`${entry}?visitor=member&tab=encounters&from=circle236&focus=plane`);
  await page.getByRole('button',{name:'Open Ancestral Roots',exact:true}).click();
  await expect(page).toHaveURL(/category=ancestral-roots/);
  await expect(page).toHaveURL(/focus=plane/);
  const mark=page.getByRole('button',{name:'Open the ancestral root Rowan',exact:true});
  if(width<500) await mark.tap();else await mark.click();
  await expect(page.getByRole('dialog',{name:'Ancestral Root portal'})).toBeVisible();
  await page.getByRole('button',{name:'Enter the Ethereal Tree',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/Lantern Grove.*Ethereal Tree/})).toBeVisible();
  await expect(page).toHaveURL(/rootView=grove/);
  await expect(page.getByRole('dialog',{name:'Ancestral Root portal'})).not.toBeVisible();
  await expect(page.getByRole('dialog',{name:/Lantern Grove.*Ethereal Tree/})).toHaveCSS('opacity','1');
  await page.screenshot({path:testInfo.outputPath(`grove-${width}.png`)});
  const memory=page.getByLabel('Story: The lantern at the table',{exact:true});
  if(width<500) await memory.tap(); else await memory.click();
  await expect(page.getByText('A fictional memory for this preview: there was always another place at the table.')).toBeVisible();
  await page.getByRole('dialog',{name:'Story: The lantern at the table',exact:true}).getByRole('button',{name:'Close this memory',exact:true}).click();
  await page.reload();await expect(page.getByRole('dialog',{name:/Lantern Grove.*Ethereal Tree/})).toBeVisible();
  await page.getByRole('button',{name:'Leave the tree'}).click();
  await expect(page).not.toHaveURL(/rootView/);await expect(page).toHaveURL(/focus=plane/);
  await expect(mark).toBeFocused();
  await page.screenshot({path:testInfo.outputPath(`bark-${width}.png`)});
  await page.goBack();await expect(page.getByRole('dialog',{name:/Lantern Grove.*Ethereal Tree/})).toBeVisible();
  await page.goBack();await expect(page.getByRole('dialog',{name:'Ancestral Root portal'})).toBeVisible();
  await page.goBack();await expect(page.getByRole('heading',{name:'Ancestral Roots',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);expect(external.filter(x=>/supabase/.test(x))).toEqual([]);
  await context.close();
 });
 test(`Anonymous, revoked and empty Roots at ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:900});const remote:string[]=[];
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)){remote.push(u.hostname);return route.abort();}return route.continue();});
  await page.goto(`${entry}?visitor=outsider&tab=memory&category=ancestral-roots`);
  await page.getByRole('button',{name:'Open the ancestral root Rowan',exact:true}).click();
  await expect(page.getByText('The tree beyond this mark is held privately by its family.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Enter the Ethereal Tree'})).toHaveCount(0);
  await expect(page.getByText('The lantern at the table')).toHaveCount(0);
  await page.screenshot({path:testInfo.outputPath(`private-${width}.png`)});
  await page.goto(`${entry}?visitor=denied&tab=memory&category=ancestral-roots&root=demo-handwritten&rootView=grove`);
  await expect(page.getByRole('button',{name:'Leave the tree'})).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('permission has changed');
  // A stale capability cannot open a Grove when its row is denied/missing.
  await expect(page.getByRole('dialog',{name:/Lantern Grove.*Ethereal Tree/})).toHaveCount(0);
  await page.goto(`${entry}?visitor=empty&tab=memory&category=ancestral-roots`);
  await expect(page.getByText('No Ancestral Roots resting here yet.')).toBeVisible();
  await expect(page.getByRole('button',{name:/Open the ancestral root/})).toHaveCount(0);
  expect(remote.filter(x=>/supabase/.test(x))).toEqual([]);
 });
}
for (const width of [320,390,1440]) {
 test(`Actual Ancient Friend Archive integration at ${width}px`,async({page},testInfo)=>{
  await page.setViewportSize({width,height:1000});
  const treeId='00000000-0000-4000-8000-000000000098';
  const mutations:string[]=[];
  await page.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if(['127.0.0.1','localhost'].includes(u.hostname))return route.continue();
   if(!['GET','HEAD'].includes(req.method())&&!u.pathname.includes('/rpc/'))mutations.push(req.method()+' '+u.pathname);
   let body:unknown=[];
   if(u.pathname==='/rest/v1/trees'&&u.searchParams.get('id')===`eq.${treeId}`)body={id:treeId,name:'Fictional Review Oak',species:'Oak',latitude:null,longitude:null,created_by:null,accessibility_tier:'public',metadata:{},created_at:'2026-10-15T00:00:00Z',updated_at:'2026-10-15T00:00:00Z'};
   if(u.pathname.endsWith('/rpc/list_tree_inscriptions'))body=[{root_id:'public-mark',life_grove_id:'fictional-private',root_type:'ancestral',inscription_text:'A fictional name',signature_strokes:null,can_enter:false,remembered_name:null,grove_title:null,dedication:null,rooted_year:2026}];
   return route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
  });
  await page.goto(`/tree/${treeId}?tab=encounters&from=circle236&focus=plane`);
  await page.getByRole('button',{name:'Open Ancestral Roots',exact:true}).click();
  await expect(page.getByRole('tab',{name:/Ancestral Roots/})).toHaveAttribute('data-state','active');
  await expect(page.getByRole('heading',{name:'Ancestral Roots',exact:true})).toBeVisible();
  await expect(page.getByText('No offerings placed here yet.')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Ancestral Roots',exact:true})).toBeVisible();
  const dismiss=page.getByRole('button',{name:'Dismiss trail',exact:true});
  if(await dismiss.isVisible()) await dismiss.click();
  const inscription=page.getByRole('button',{name:'Open the ancestral root A fictional name',exact:true});
  await inscription.evaluate(el=>el.scrollIntoView({block:'center'}));
  await inscription.click();
  await expect(page.getByText('The tree beyond this mark is held privately by its family.')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath(`actual-tree-${width}.png`)});
  await expect(page).toHaveURL(/focus=plane/);
  expect(mutations.every(m=>m==='POST /rest/v1/tree_page_views')).toBe(true); // Existing page analytics intercepted; never sent live.
 });
}
