// Run after the fictional SQL backer walkthrough. Real UI/helper, fake transport only.
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';
const memories=JSON.parse(readFileSync('/tmp/s33d-fictional-memories.json','utf8'));
const groveId=memories[0].media_url.split('/offerings-private/')[1].split('/')[1];
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const fixture={name:'fictional-only',setup(b){
 b.onResolve({filter:/^@\/integrations\/supabase\/client$/},args=>({path:args.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},()=>({loader:'js',contents:`export const supabase={rpc:async(name,body)=>{if(name!=='export_life_grove_memories'||body.p_grove_id!==${JSON.stringify(groveId)})throw Error('Unexpected request');return {data:${JSON.stringify(memories)},error:null}},functions:{invoke:async(name,{body})=>{if(name!=='offering-media'||body.offering_id!==${JSON.stringify(memories[0].id)})throw Error('Unexpected memory');return {data:new Blob([Uint8Array.from(atob(${JSON.stringify(png)}),c=>c.charCodeAt(0))],{type:'application/octet-stream'}),error:null}}}};`}));
}};
const bundle=await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Download from './src/components/life-groves/GroveArchiveDownload';import {useOfferingMediaUrl} from './src/utils/offeringMedia';function Probe(){const url=useOfferingMediaUrl(${JSON.stringify(memories[0].media_url)},${JSON.stringify(memories[0].id)});return <img alt='Fictional checked photo' src={url??undefined}/>;}createRoot(document.getElementById('root')).render(<><Probe/><Download groveId=${JSON.stringify(groveId)}/></>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',tsconfig:'tsconfig.app.json',define:{'process.env.NODE_ENV':'"test"'},plugins:[fixture]});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({acceptDownloads:true});await context.route('**/*',r=>/^(blob:|data:|about:)/.test(r.request().url())?r.continue():r.abort());const page=await context.newPage();
 try{
  await page.route('http://127.0.0.1:4354/fixture',r=>r.fulfill({contentType:'text/html',body:'<main id="root"></main>'}));await page.goto('http://127.0.0.1:4354/fixture');await page.addScriptTag({content:bundle.outputFiles[0].text});
  await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth===1);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download permitted memories and photos'}).click();const download=await pending;
  const path=`/tmp/s33d-${engine.name()}-actual-download.tar`;await download.saveAs(path);console.log(`PASS ${engine.name()} checked octet-stream photo decoded; real download -> ${path}`);
 }finally{await context.close();await browser.close();}
}
