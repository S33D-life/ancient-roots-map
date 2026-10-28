import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {MemoryRouter} from 'react-router-dom';
import Composer from '@/review/council-offerings/Composer';
import {companions,kinds,selectedCompanion,demoReceipt,sourceOffering} from '@/review/council-offerings/model';
import Circle238Page from '@/pages/council/Circle238Page';
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:fixture-audio');URL.revokeObjectURL=vi.fn();window.scrollTo=vi.fn();window.matchMedia=vi.fn(()=>({matches:true} as MediaQueryList));});
afterEach(cleanup);
function start(kind:string,qa=false){render(<Composer companion={companions[0]} onClose={vi.fn()} qa={qa}/>);fireEvent.click(screen.getByRole('button',{name:kind}));}
describe('Council offering fixture isolation and holding',()=>{
 it.each(kinds)('keeps %s private by default at its dedicated holding stage',async kind=>{
  start(kind);expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  if(kind==='Song')fireEvent.click(screen.getByRole('button',{name:/A canopy hum/}));
  else if(kind==='Photograph')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic photograph example'}));
  else if(kind==='Voice')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic voice example'}));
  else if(kind==='Poem')fireEvent.change(screen.getByPlaceholderText('Let the poem begin…'),{target:{value:'A fictional poem'}});
  else fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fictional noticing'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  expect(screen.getByLabelText('Keep it with me')).toBeChecked();
  expect(screen.getByLabelText('Offer it to the Circle for review')).not.toBeChecked();
  expect(screen.getByLabelText('Future-design promises')).toHaveTextContent('not implemented in this demo');
  expect(screen.getByText(/Not minted/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Demo outcome')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Place it in the Circle (demo)'}));
  expect(await screen.findByText('Demo receipt · nothing was stored or sent.')).toBeInTheDocument();
 });
 it('requires a separate review choice and retains QA failures without a receipt',async()=>{
  start('Story',true);fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fixture story'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.click(screen.getByLabelText('Offer it to the Circle for review'));
  expect(screen.getByText(/unless they ask you first and you agree/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Place it in the Circle (demo)'}));
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'unknown'}});fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(screen.getByRole('alert')).toHaveTextContent('unknown');expect(screen.queryByLabelText('Demo receipt')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'success'}});fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(await screen.findByText(/A curator would ask before anything is shared/)).toBeInTheDocument();
 });
 it('keeps QA source links out of the normal journey and labels future suggestion privacy',()=>{
  start('A seed for a future Circle',false);
  expect(screen.getByText(/your suggestion and your name would be seen by the curators only/)).toBeInTheDocument();
 });
 it('does not expose reviewer source linking by default',()=>{render(<Composer companion={companions[0]} onClose={vi.fn()}/>);expect(screen.queryByRole('button',{name:'Link an existing Ancient Friend offering'})).not.toBeInTheDocument();});
 it('references one synthetic source ID without copying its body or inventing a tree',()=>{
  const result=demoReceipt(companions[0],'Link existing offering','private','must not copy','Demo Wanderer');
  expect(result).toMatchObject({circle:238,companionKey:companions[0].key,sourceOfferingId:sourceOffering.id,status:'demo-only'});expect(result).not.toHaveProperty('text');expect(result).not.toHaveProperty('tree_id');
  expect(selectedCompanion('goji-seed')?.id).not.toBe(selectedCompanion('goji-fruit')?.id);expect(selectedCompanion('not-a-companion')).toBeUndefined();
 });
 it('keeps production 2D unchanged without explicit fixture props',()=>{
  render(<MemoryRouter initialEntries={['/council/238?companion=fig&qa=1']}><Circle238Page/></MemoryRouter>);expect(screen.queryByRole('button',{name:'Offer something'})).not.toBeInTheDocument();expect(screen.getByRole('heading',{level:1})).toHaveTextContent('Fig-wood Council');
 });
 it('releases its synthetic object URL on unmount',()=>{const result=render(<Composer companion={companions[0]} onClose={vi.fn()}/>);result.unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-audio');});
 it('contains no real write, reward, search, storage or recorder integration',()=>{for(const name of ['Composer.tsx','model.ts','main.tsx','Invitation.tsx'])expect(readFileSync('src/review/council-offerings/'+name,'utf8')).not.toMatch(/supabase|issueRewards|earnHearts|claimCouncil|localStorage|indexedDB|getUserMedia|\.upload\(|fetch\(/);});
});
