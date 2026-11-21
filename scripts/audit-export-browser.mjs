// Run after the fictional SQL backer walkthrough; no real records or requests.
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {chromium,webkit} from '@playwright/test';
const memories=JSON.parse(readFileSync('/tmp/s33d-fictional-memories.json','utf8'));
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=';
const fixture={name:'fictional-only',setup(b){
 b.onResolve({filter:/^@\/integrations\/supabase\/client$|^@\/utils\/offeringMedia$/},args=>({path:args.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'js',contents:args.path.includes('supabase')?`export const supabase={rpc:async(name,body)=>{if(name!=='export_life_grove_memories'||body.p_grove_id!=='fictional-grove')throw Error('Unexpected request');return {data:${JSON.stringify(memories)},error:null}}};`:`export async function signedOfferingMediaUrl(id){if(id!==${JSON.stringify(memories[0].id)})throw Error('Unexpected memory');return ${JSON.stringify(png)}}`}));
}};
const bundle=await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import Download from './src/components/life-groves/GroveArchiveDownload';createRoot(document.getElementById('root')).render(<Download groveId='fictional-grove'/>);",resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',tsconfig:'tsconfig.app.json',define:{'process.env.NODE_ENV':'"test"'},plugins:[fixture]});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});const context=await browser.newContext({acceptDownloads:true});await context.route('**/*',r=>r.abort());const page=await context.newPage();
 try{
  await page.setContent('<main id="root"></main>');await page.addScriptTag({content:bundle.outputFiles[0].text});
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download permitted memories and photos'}).click();const download=await pending;
  const path=`/tmp/s33d-${engine.name()}-actual-download.tar`;await download.saveAs(path);console.log(`PASS ${engine.name()} real download event -> ${path}`);
 }finally{await context.close();await browser.close();}
}
