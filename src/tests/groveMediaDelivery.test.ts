import {afterEach,it,expect,vi} from 'vitest';
const invoke=vi.hoisted(()=>vi.fn());
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke}}}));
import {signedOfferingMediaUrl} from '@/utils/offeringMedia';
afterEach(()=>vi.restoreAllMocks());
it('uses checked bytes and a browser-local URL instead of a transferable storage grant',async()=>{invoke.mockResolvedValue({data:new Blob(['fictional-photo']),error:null});const local=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:fictional');expect(await signedOfferingMediaUrl('fictional-memory')).toBe('blob:fictional');expect(invoke).toHaveBeenCalledWith('offering-media',{body:{offering_id:'fictional-memory'}});expect(local).toHaveBeenCalled();});
it('does not fall back to a legacy remote signed URL',async()=>{invoke.mockResolvedValue({data:{url:'https://fixture.invalid/old-signed-capability'},error:null});expect(await signedOfferingMediaUrl('fictional-memory')).toBeNull();});
it('does not display bytes after a denied read',async()=>{invoke.mockResolvedValue({data:null,error:{status:403}});expect(await signedOfferingMediaUrl('fictional-memory')).toBeNull();});
