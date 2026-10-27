import {beforeEach,describe,expect,it,vi} from 'vitest';
const mock=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),ilike:vi.fn(),select:vi.fn(),responses:[] as unknown[]}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mock.rpc,from:mock.from}}));
import {aggregatePublicResearch,canonicalAtlasCountry,fetchAtlasCountryStats,fetchCountryResearch,type ResearchSummaryRow} from '@/lib/atlas-research';
const record=(country='Costa Rica',id='1'):ResearchSummaryRow=>({id,country,species_scientific:'Ceiba pentandra',species_common:'Ceiba',latitude:null,longitude:null,geo_precision:'approx',source_doc_url:'https://example.test/source',source_program:'Research',source_doc_title:'Source',linked_tree_id:null,converted_tree_id:null,status:'research'});
beforeEach(()=>{
 vi.clearAllMocks();mock.responses=[];
 mock.from.mockImplementation(()=>{const q={select:(...args:unknown[])=>{mock.select(...args);return q;},order:()=>q,range:()=>q,ilike:(...args:unknown[])=>{mock.ilike(...args);return q;},then:(resolve:(v:unknown)=>unknown,reject:(e:unknown)=>unknown)=>Promise.resolve(mock.responses.shift()).then(resolve,reject)};return q;});
});
describe('Atlas public research recovery',()=>{
 it('uses a nonzero successful RPC without reading tables',async()=>{
  const stat={...aggregatePublicResearch([record()])[0],verification_task_open_count:0,verification_task_completed_count:0,data_confidence_score:50};
  mock.rpc.mockResolvedValue({data:[stat],error:null});expect(await fetchAtlasCountryStats()).toEqual([stat]);expect(mock.from).not.toHaveBeenCalled();
 });
 it('accepts genuinely empty RPC data but rejects missing/malformed data',async()=>{
  mock.rpc.mockResolvedValue({data:[],error:null});expect(await fetchAtlasCountryStats()).toEqual([]);
  for(const data of [null,{},[{country:'Peru',total_research_records:0}]]){mock.rpc.mockResolvedValue({data,error:null});await expect(fetchAtlasCountryStats()).rejects.toThrow();}
 });
 it('recovers nonzero public rows only for the missing RPC and preserves layer semantics',async()=>{
  mock.rpc.mockResolvedValue({data:null,error:{code:'PGRST202'}});mock.responses=[{data:[record(),record('Peru','2')],error:null,count:2}];
  const result=await fetchAtlasCountryStats();expect(result.map(r=>[r.country,r.total_research_records,r.source_count])).toEqual([['Costa Rica',1,1],['Peru',1,1]]);
  expect(result[0].verification_task_open_count).toBeNull();expect(result[0].data_confidence_score).toBeNull();expect(result[0].linked_ancient_friends_count).toBe(0);
  expect(mock.from).toHaveBeenCalledWith('research_trees');expect(mock.select.mock.calls[0][0]).not.toContain('description');
 });
 it('confirms an empty public fallback rather than fabricating records',async()=>{
  mock.rpc.mockResolvedValue({error:{code:'PGRST202'}});mock.responses=[{data:[],error:null,count:0}];expect(await fetchAtlasCountryStats()).toEqual([]);
 });
 it.each(['42501','PGRST301','NETWORK'])('does not hide %s behind a fallback',async code=>{
  mock.rpc.mockResolvedValue({error:{code}});await expect(fetchAtlasCountryStats()).rejects.toEqual({code});expect(mock.from).not.toHaveBeenCalled();
 });
 it('groups known country casing/outer spaces and sends canonical case-insensitive country reads',async()=>{
  expect(canonicalAtlasCountry('  pErU  ')).toBe('Peru');expect(aggregatePublicResearch([record(' costa rica '),record('COSTA RICA','2')])[0].total_research_records).toBe(2);
  mock.responses=[{data:[],error:null,count:0}];await fetchCountryResearch('  pErU ');expect(mock.ilike).toHaveBeenCalledWith('country','Peru');
 });
 it('reads beyond the API page limit and rejects partial/changed/oversized responses',async()=>{
  mock.rpc.mockResolvedValue({error:{code:'PGRST202'}});
  const first=Array.from({length:500},(_,i)=>record('Peru',String(i)));
  mock.responses=[{data:first,error:null,count:501},{data:[record('Peru','501')],error:null,count:501}];expect((await fetchAtlasCountryStats())[0].total_research_records).toBe(501);
  mock.responses=[{data:first,error:null,count:501},{data:null,error:{code:'42501'},count:null}];await expect(fetchAtlasCountryStats()).rejects.toEqual({code:'42501'});
  mock.responses=[{data:first,error:null,count:501},{data:[],error:null,count:500}];await expect(fetchAtlasCountryStats()).rejects.toThrow('changed');
  mock.responses=[{data:[],error:null,count:50001}];await expect(fetchAtlasCountryStats()).rejects.toThrow('Complete');
 });
 it('never turns a failed country read into a confirmed empty list',async()=>{
  mock.responses=[{data:null,error:{code:'42501'},count:null}];await expect(fetchCountryResearch('Peru')).rejects.toEqual({code:'42501'});
 });
});
