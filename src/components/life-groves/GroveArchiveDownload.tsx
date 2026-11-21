import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { signedOfferingMediaUrl } from '@/utils/offeringMedia';
import { buildGroveArchive } from '@/lib/life-groves/exportArchive';
import { Button } from '@/components/ui/button';
export default function GroveArchiveDownload({groveId}:{groveId:string}){
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function download(){setBusy(true);setMessage('');try{
  const {data,error}=await (supabase as any).rpc('export_life_grove_memories',{p_grove_id:groveId});if(error) throw error;
  const archive=await buildGroveArchive(data??[],async id=>{const url=await signedOfferingMediaUrl(id);if(!url) throw new Error('Photo unavailable');try{const res=await fetch(url,{credentials:'omit',cache:'no-store'});if(!res.ok) throw new Error('Photo unavailable');return new Uint8Array(await res.arrayBuffer());}finally{if(url.startsWith('blob:')) URL.revokeObjectURL(url);}});
  const url=URL.createObjectURL(new Blob([new Uint8Array(archive).buffer],{type:'application/x-tar'}));const link=document.createElement('a');link.href=url;link.download='s33d-grove-export.tar';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Download prepared. It includes only memories and photos you may read. Other members’ Only me memories are excluded.');
 }catch{setMessage('Export did not complete. No partial download was offered. Ask the steward if a legacy photo needs recovery.');}finally{setBusy(false);}}
 return <section aria-label="Download Grove archive"><Button disabled={busy} onClick={download}>Download permitted memories and photos</Button><p role="status">{message}</p></section>;
}
