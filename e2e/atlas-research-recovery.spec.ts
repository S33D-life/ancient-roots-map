import {test,expect,type Page} from '@playwright/test';
type Mode='records'|'empty'|'failed'|'permission';
const makeRows=(country:string,count:number)=>Array.from({length:count},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+(country==='Peru'?100:0)).padStart(12,'0')}`,country,species_scientific:'Ceiba pentandra',species_common:`Research candidate ${i+1}`,province:'Research region',locality_text:'Source-backed location',latitude:null,longitude:null,geo_precision:'unknown',source_doc_url:'https://example.test/research',source_program:'Regression fixture',source_doc_title:'Research provenance fixture',source_doc_year:2025,designation_type:'Research candidate',record_kind:'individual_tree',record_status:'research',status:'research',linked_tree_id:null,converted_tree_id:null}));
async function transport(page:Page,state:{mode:Mode}){
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());if(['localhost','127.0.0.1'].includes(u.hostname))return route.continue();
  const headers={'access-control-allow-origin':'*','access-control-expose-headers':'content-range','content-type':'application/json'};
  if(u.pathname.endsWith('/rpc/public_atlas_country_stats'))return route.fulfill({status:state.mode==='permission'?403:404,headers,body:JSON.stringify({code:state.mode==='permission'?'42501':'PGRST202'})});
  if(u.pathname.endsWith('/research_trees')){
   if(state.mode==='failed')return route.abort('failed');
   const filter=u.searchParams.get('country')?.replace(/^(eq|ilike)\./,'');
   const rows=state.mode==='empty'?[]:[...makeRows('Costa Rica',17),...makeRows('Peru',18)].filter(r=>!filter||r.country.toLowerCase()===filter.toLowerCase());
   return route.fulfill({status:200,headers:{...headers,'content-range':rows.length?`0-${rows.length-1}/${rows.length}`:'*/0'},body:JSON.stringify(rows)});
  }
  // No real auth, mapped/private trees, verification actions, telemetry or backend writes.
  return route.fulfill({status:200,headers,body:'[]'});
 });
}
test.use({serviceWorkers:'block'});
for(const width of [320,390,1280]){
 test(`missing RPC recovers both public countries at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await transport(page,{mode:'records'});await page.goto('/atlas');
  await expect(page.locator('#country-gateways')).toContainText('35 research records');
  const chapter=page.locator('#country-gateways');await expect(chapter).toContainText('17 records');await expect(chapter).toContainText('18 records');
  for(const [slug,count]of [['costa-rica',17],['peru',18]] as const){
   await page.goto('/atlas/'+slug);await expect(page.getByRole('tabpanel',{name:'All Trees'}).getByRole('link',{name:/Research provenance/})).toHaveCount(count);
   await expect(page.getByText(new RegExp(`^${count} Research Trees`))).toBeVisible();await expect(page.getByRole('tabpanel',{name:'All Trees'})).toContainText('Research provenance');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.screenshot({path:`output/playwright/atlas123/recovered-${width}.png`,fullPage:true});
 });
 test(`confirmed empty dataset stays empty at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await transport(page,{mode:'empty'});await page.goto('/atlas');await expect(page.getByText('No public research records returned.',{exact:true})).toBeVisible();
  await expect(page.locator('#country-gateways')).toContainText('0 research records');await page.goto('/atlas/peru');await expect(page.getByText('No public research records found for this filter.',{exact:true})).toBeVisible();await expect(page.getByText('Research records unavailable.',{exact:false})).toHaveCount(0);
 });
 test(`failed public reads never claim zero at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:844});await transport(page,{mode:'failed'});await page.goto('/atlas');
  await expect(page.getByRole('alert').filter({hasText:'Research counts unavailable'})).toBeVisible();await expect(page.locator('#country-gateways')).not.toContainText('0 research records');
  await expect(page.getByRole('link',{name:'🇨🇷 Costa Rica',exact:true})).toBeVisible();await page.goto('/atlas/costa-rica');
  await expect(page.getByRole('alert').filter({hasText:'Research records unavailable'})).toBeVisible();await expect(page.getByText('Records',{exact:true})).toHaveCount(0);await expect(page.getByText('No public research records found for this filter.',{exact:true})).toHaveCount(0);
 });
}
test('RPC permission errors stay unavailable while successful country reads remain visible',async({page})=>{
 await transport(page,{mode:'permission'});await page.goto('/atlas');await expect(page.getByRole('alert').filter({hasText:'Research counts unavailable'})).toBeVisible();await page.goto('/atlas/peru');await expect(page.getByText(/^18 Research Trees/)).toBeVisible();await expect(page.getByRole('status').filter({hasText:'Country summary unavailable'})).toBeVisible();
});
test('retry restores counts after failed retrieval without writing data',async({page})=>{
 const state:{mode:Mode}={mode:'failed'};await transport(page,state);await page.goto('/atlas');await expect(page.getByRole('button',{name:'Retry research counts'})).toBeVisible();state.mode='records';await page.getByRole('button',{name:'Retry research counts'}).click();await expect(page.locator('#country-gateways')).toContainText('35 research records');await expect(page.getByRole('button',{name:'Retry research counts'})).toHaveCount(0);
});
