/** Portable uncompressed tar: no remote archive service or new dependency. */
export interface ExportMemory {id:string;offering_type:string;title:string|null;body_text:string|null;contributor_name:string;visibility:string;created_at:string;media_url:string|null;media_type?:string|null;media_metadata?:Record<string,unknown>|null}
const encoder=new TextEncoder();
export function tarFiles(files:{name:string;bytes:Uint8Array}[]):Uint8Array {
  const blocks:Uint8Array[]=[];
  for(const file of files){
    if(!/^[a-zA-Z0-9_./-]+$/.test(file.name)||file.name.includes('..')||file.name.length>99) throw new Error('Unsafe archive name');
    const h=new Uint8Array(512);const write=(s:string,offset:number)=>h.set(encoder.encode(s),offset);
    write(file.name,0);write('0000600\0',100);write('0000000\0',108);write('0000000\0',116);
    write(file.bytes.length.toString(8).padStart(11,'0')+'\0',124);write('00000000000\0',136);write('        ',148);write('0',156);write('ustar\0',257);write('00',263);
    write(h.reduce((a,b)=>a+b,0).toString(8).padStart(6,'0')+'\0 ',148);
    blocks.push(h,file.bytes,new Uint8Array((512-file.bytes.length%512)%512));
  }
  blocks.push(new Uint8Array(1024));const output=new Uint8Array(blocks.reduce((n,b)=>n+b.length,0));let offset=0;for(const b of blocks){output.set(b,offset);offset+=b.length;}return output;
}
export async function buildGroveArchive(memories:ExportMemory[], readPhoto:(id:string)=>Promise<Uint8Array>):Promise<Uint8Array>{
  const files:{name:string;bytes:Uint8Array}[]=[];const safe=[];let bytes=0;
  for(const m of memories){
    let photo:string|null=null;
    if(m.media_url && m.offering_type!=="song"){
      const data=await readPhoto(m.id);if(!data.length) throw new Error('Photo unavailable; export was not completed');bytes+=data.length;if(bytes>100*1024*1024) throw new Error('Export exceeds local limit; request a steward-assisted export');
      const extension=data[0]===0x89&&data[1]===0x50&&data[2]===0x4e&&data[3]===0x47 ? "png" : data[0]===0xff&&data[1]===0xd8 ? "jpg" : "bin";
      photo=`photos/${m.id}.${extension}`;files.push({name:photo,bytes:data});
    }
    const {media_url:_,...record}=m;safe.push({...record,photo,external_reference:m.offering_type==="song"?m.media_url:null});
  }
  files.unshift({name:'memories.json',bytes:encoder.encode(JSON.stringify({format:'s33d-grove-export-v1',memories:safe},null,2))});
  return tarFiles(files);
}
