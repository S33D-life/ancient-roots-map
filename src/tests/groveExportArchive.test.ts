import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {buildGroveArchive,tarFiles,type ExportMemory} from '@/lib/life-groves/exportArchive';
const memory:ExportMemory={id:'00000000-0000-4000-8000-000000000200',offering_type:'photo',title:'Fictional memory',body_text:'Our fictional first memory',contributor_name:'Fictional backer',visibility:'private',created_at:'2026-11-21T00:00:00Z',media_url:'https://fixture.invalid/private-reference'};
const png=Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=','base64'));
describe('permitted archive download',()=>{
 it('builds an actual portable archive with text and original photo bytes',async()=>{const tar=await buildGroveArchive([memory],async()=>png);writeFileSync('/tmp/s33d-fictional-export.tar',tar);expect(new TextDecoder().decode(tar)).toContain('Our fictional first memory');expect(new TextDecoder().decode(tar)).not.toContain('https://fixture.invalid');expect(tar.length%512).toBe(0);});
 it('does not offer a partial download when a photo is denied',async()=>{await expect(buildGroveArchive([memory],async()=>{throw new Error('403');})).rejects.toThrow('403');});
 it('rejects traversal names',()=>expect(()=>tarFiles([{name:'../private',bytes:png}])).toThrow('Unsafe'));
});
