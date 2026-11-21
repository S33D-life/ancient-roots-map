import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {buildGroveArchive,tarFiles,type ExportMemory} from '@/lib/life-groves/exportArchive';
const memory:ExportMemory={id:'00000000-0000-4000-8000-000000000200',offering_type:'photo',title:'Fictional memory',body_text:'Our fictional first memory',contributor_name:'Fictional backer',visibility:'private',created_at:'2026-11-21T00:00:00Z',media_url:'https://fixture.invalid/private-reference'};
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64'));
describe('permitted archive download',()=>{
 it('builds an actual portable archive with text and original photo bytes',async()=>{const tar=await buildGroveArchive([memory],async()=>png);writeFileSync('/tmp/s33d-fictional-export.tar',tar);expect(new TextDecoder().decode(tar)).toContain('Our fictional first memory');expect(new TextDecoder().decode(tar)).not.toContain('https://fixture.invalid');expect(tar.length%512).toBe(0);});
 it('does not offer a partial download when a photo is denied',async()=>{await expect(buildGroveArchive([memory],async()=>{throw new Error('403');})).rejects.toThrow('403');});
 it('preserves song references and book metadata without downloading third-party media',async()=>{let reads=0;const tar=await buildGroveArchive([{...memory,offering_type:'song',media_url:'https://music.apple.com/fixture-track',media_metadata:{artist:'Fictional artist'}},{...memory,media_url:null,offering_type:'book',media_metadata:{author:'Fictional writer',quote:'A fictional quotation'}}],async()=>{reads++;return png;});const text=new TextDecoder().decode(tar);expect(reads).toBe(0);expect(text).toContain('https://music.apple.com/fixture-track');expect(text).toContain('A fictional quotation');});
 it('rejects traversal names',()=>expect(()=>tarFiles([{name:'../private',bytes:png}])).toThrow('Unsafe'));
});
