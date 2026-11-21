import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
it('purges old private Grove cache entries without removing public trees',async()=>{
 let activate:((event:{waitUntil:(p:Promise<unknown>)=>void})=>void)|undefined;
 const requests=[{url:'https://fixture.invalid/rest/v1/life_grove_offerings?id=eq.fake'},{url:'https://fixture.invalid/storage/v1/object/sign/offerings-private/fake/photo.jpg'},{url:'https://fixture.invalid/rest/v1/trees?id=eq.public'}];
 const deleted:string[]=[];
 vm.runInNewContext(readFileSync('public/grove-cache-boundary.js','utf8'),{self:{addEventListener:(_name:string,fn:typeof activate)=>{activate=fn;}},caches:{keys:async()=>['supabase-api'],open:async()=>({keys:async()=>requests,delete:async(r:{url:string})=>{deleted.push(r.url);return true;}})}});
 let done:Promise<unknown>=Promise.resolve();activate!({waitUntil:p=>{done=p;}});await done;
 expect(deleted).toEqual(requests.slice(0,2).map(r=>r.url));
});
