/** Fictional, memory-only specimen. Never reads or writes a real Grove. */
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AncestralInscriptions, { type RootPreview } from '@/components/tree-sections/AncestralInscriptions';
import { ancestralRootsParams, treeMemoryState } from '@/lib/ancestralRootNavigation';
import '@/index.css';

const visitor = new URLSearchParams(location.search).get('visitor') ?? 'outsider';
const member = visitor === 'member' || visitor === 'denied';
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false } } });
qc.setQueryData(['current-user'], member ? { id: 'fictional-review-member' } : null);
const grove = { id: 'fictional-grove', grove_title: 'The Lantern Grove · fictional', tree_name: 'A tree of remembered kindness', remembered_or_celebrated_name: 'Rowan · fictional', tree_archetype_species: 'oak' as const };
const common = { life_grove_id: grove.id, root_type: 'ancestral' as const, inscription_style: 'text', rooted_year: 2026, remembered_name: null, grove_title: null, dedication: null, signature_strokes: null };
const preview: RootPreview = {
  marks: visitor === 'empty' ? [] : [
    { ...common, root_id: 'demo-handwritten', inscription_text: 'Rowan', signature_strokes: [[{x:.1,y:.7},{x:.15,y:.2},{x:.35,y:.3},{x:.14,y:.5},{x:.4,y:.75}],[{x:.44,y:.65},{x:.5,y:.4},{x:.6,y:.65},{x:.7,y:.4},{x:.8,y:.65},{x:.9,y:.4}]], can_enter: member },
    { ...common, root_id: 'demo-text', inscription_text: 'For the stories we carry', can_enter: false },
  ],
  grove: member && visitor !== 'denied' ? grove : null,
  offerings: member && visitor !== 'denied' ? [{id:'fictional-story',life_grove_id:grove.id,contributor_user_id:null,contributor_name:'A fictional cousin',offering_type:'story',title:'The lantern at the table',body_text:'A fictional memory for this preview: there was always another place at the table.',media_url:null,visibility:'family_only',memory_position_data:null,created_at:'2026-10-15T00:00:00Z'}] : [],
};
function Preview() {
  const [params,setParams] = useSearchParams();
  const state=treeMemoryState(params);
  const roots=state.section==='memory' && state.category==='ancestral-roots';
  const setTab=(tab:string)=>{const next=new URLSearchParams(params);next.set('tab',tab);next.delete('root');next.delete('rootView');setParams(next);};
  return <main className="min-h-screen bg-background text-foreground px-5 py-8 pb-24 max-w-4xl mx-auto font-serif">
    <p className="text-xs tracking-widest text-primary">LOCAL REVIEW · FICTIONAL DATA · NO FAMILY CONNECTION</p>
    <h1 className="text-3xl md:text-5xl mt-6">The Lantern Oak</h1>
    <p className="text-muted-foreground mt-3">One Ancient Friend. A little name in the bark. A permissioned doorway to a living memory.</p>
    <nav aria-label="Review visitor" className="flex flex-wrap gap-3 my-6 text-xs">{['outsider','member','denied','empty'].map(v=><a className="min-h-11 inline-flex items-center underline text-primary" key={v} href={`?visitor=${v}&tab=memory&view=archive&category=ancestral-roots`}>{v==='member'?'Fictional member':v==='outsider'?'Anonymous visitor':v==='denied'?'Access revoked': 'No roots'}</a>)}</nav>
    <nav aria-label="Ancient Friend sections" className="flex flex-wrap gap-3 border-y border-border py-3">{['overview','encounters','memory'].map(tab=><button className="min-h-11 px-3 text-primary" key={tab} onClick={()=>setTab(tab)} aria-current={state.section===tab?'page':undefined}>{tab[0].toUpperCase()+tab.slice(1)}</button>)}</nav>
    {state.section==='overview' && <AncestralInscriptions treeId="fictional-lantern-oak" preview={preview} />}
    {state.section==='encounters' && <section className="py-8"><h2 className="text-2xl">Encounters</h2><p className="my-4 text-muted-foreground">Names remembered in the bark. A Root does not create a visit.</p><button className="min-h-11 px-4 border border-primary rounded-lg text-primary" onClick={()=>setParams(ancestralRootsParams(params))}>Open Ancestral Roots</button></section>}
    {state.section==='memory' && <section className="py-8"><h2 className="text-2xl">Memory → Archive</h2><nav aria-label="Archive categories" className="flex flex-wrap gap-3 mt-4">{['Photos','Songs','Poems','Ancestral Roots'].map(label=><button key={label} className="min-h-11 px-3 border border-border rounded-lg text-primary" onClick={()=>{const next=ancestralRootsParams(params);next.set('category',label==='Ancestral Roots'?'ancestral-roots':label.toLowerCase());setParams(next);}}>{label}{label==='Ancestral Roots'?` (${preview.marks.length})`:''}</button>)}</nav>{roots?<AncestralInscriptions treeId="fictional-lantern-oak" showEmpty preview={preview}/>:<p className="mt-8 text-muted-foreground">No fictional offerings in this category. The Grove’s memories remain in its own archive.</p>}</section>}
    <p className="text-xs text-muted-foreground mt-12">This is not Ely, Noku or a real family Grove. The same inscription, portal and Ethereal Tree components power the proposed Ancient Friend integration. Visitor controls simulate permissions; they do not authenticate anyone.</p>
  </main>;
}
document.documentElement.classList.add('dark');
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={qc}><BrowserRouter><Preview/></BrowserRouter></QueryClientProvider>);
