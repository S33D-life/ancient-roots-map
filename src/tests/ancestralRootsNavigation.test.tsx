import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ancestralRootsParams, rootPortalParams, treeMemoryState } from '@/lib/ancestralRootNavigation';
import AncestralInscriptions from '@/components/tree-sections/AncestralInscriptions';
import { getLifeGrove, listOfferings } from '@/repositories/life-groves';
import { listTreeInscriptions } from '@/repositories/grove-roots';
vi.mock('@/hooks/use-current-user',()=>({useCurrentUser:()=>({userId:null})}));
vi.mock('@/repositories/life-groves',()=>({getLifeGrove:vi.fn(),listOfferings:vi.fn()}));
vi.mock('@/repositories/grove-roots',()=>({listTreeInscriptions:vi.fn(),isTreeRootAuthority:vi.fn(),listPendingTreeRoots:vi.fn(),reviewGroveRoot:vi.fn(),rootTypeLabel:()=> 'Ancestral'}));
const mark={root_id:'mark-1',life_grove_id:'private-grove',root_type:'ancestral',inscription_text:'A little name',signature_strokes:null,remembered_name:null,grove_title:null,dedication:null,rooted_year:2026,can_enter:false};
function show(path='/?tab=memory&view=archive&category=ancestral-roots'){
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><AncestralInscriptions treeId="tree-1" showEmpty/></MemoryRouter></QueryClientProvider>);
}
describe('Ancestral Roots relationship navigation',()=>{
 it('preserves Circle/Map context without accepting a new return destination',()=>{
  const params=ancestralRootsParams(new URLSearchParams('recordReturn=circle236&focus=plane&from=map'));
  expect(params.get('recordReturn')).toBe('circle236');expect(params.get('focus')).toBe('plane');
  expect(treeMemoryState(params)).toEqual({section:'memory',mode:'list',category:'ancestral-roots'});
  const closed=rootPortalParams(rootPortalParams(params,'root-1',true),null);
  expect(closed.get('category')).toBe('ancestral-roots');expect(closed.has('rootView')).toBe(false);
 });
 it.each(['living','offerings','ethereal'])('keeps legacy %s deep links',tab=>{
  expect(treeMemoryState(new URLSearchParams({tab})).section).toBe('memory');
  expect(treeMemoryState(new URLSearchParams({tab})).mode).toBe(tab==='living'?'living':'list');
 });
 it('opens a public mark but never fetches its private Grove or offerings',async()=>{
  vi.mocked(listTreeInscriptions).mockResolvedValue([mark as never]);
  vi.mocked(getLifeGrove).mockClear();vi.mocked(listOfferings).mockClear();show();
  fireEvent.click(await screen.findByRole('button',{name:/Open the ancestral root/}));
  expect(await screen.findByText('The tree beyond this mark is held privately by its family.')).toBeVisible();
  expect(getLifeGrove).not.toHaveBeenCalled();expect(listOfferings).not.toHaveBeenCalled();
 });
 it('does not resolve a forged/unlisted root id into a Grove fetch',async()=>{
  vi.mocked(listTreeInscriptions).mockResolvedValue([]);vi.mocked(getLifeGrove).mockClear();
  show('/?root=forged&rootView=grove');
  expect(await screen.findByText('No Ancestral Roots resting here yet.')).toBeVisible();
  expect(getLifeGrove).not.toHaveBeenCalled();
 });
 it('reports an RPC failure instead of presenting it as an empty archive',async()=>{
  vi.mocked(listTreeInscriptions).mockRejectedValue(new Error('not allowed'));
  show();await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('could not be opened'));
  expect(screen.queryByText('No Ancestral Roots resting here yet.')).not.toBeInTheDocument();
 });
});
