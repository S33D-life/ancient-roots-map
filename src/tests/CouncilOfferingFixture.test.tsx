import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {MemoryRouter} from 'react-router-dom';
import Composer from '@/review/council-offerings/Composer';
import {companions,kinds,selectedCompanion,demoReceipt,sourceOffering} from '@/review/council-offerings/model';
import Circle238Page from '@/pages/council/Circle238Page';
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:fixture-audio');URL.revokeObjectURL=vi.fn();window.scrollTo=vi.fn();});
afterEach(cleanup);
function start(kind:string){render(<Composer companion={companions[0]} onClose={vi.fn()}/>);fireEvent.click(screen.getByRole('button',{name:kind}));}
describe('Council offering fixture isolation',()=>{
 it.each([...kinds,'Suggest a future companion','Link an existing Ancient Friend offering'])('previews %s without persistence',async kind=>{
  start(kind);
  expect(screen.getByLabelText('Keep private')).toBeChecked();
  if(kind==='Song')fireEvent.click(screen.getByRole('button',{name:/A canopy hum/}));
  else if(kind==='Photograph')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic photograph example'}));
  else if(kind==='Voice')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic voice example'}));
  else if(kind==='Poem')fireEvent.change(screen.getByPlaceholderText('Let the poem begin…'),{target:{value:'A fictional poem'}});
  else if(!kind.startsWith('Link')){if(kind.startsWith('Suggest'))fireEvent.change(screen.getByRole('textbox',{name:'Suggested companion'}),{target:{value:'A fictional future companion'}});fireEvent.change(screen.getByRole('textbox',{name:kind.startsWith('Suggest')?'Why might they join a future Circle?':'Your words'}),{target:{value:'A fictional noticing'}});}
  fireEvent.click(screen.getByRole('button',{name:'Preview offering →'}));
  fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(await screen.findByText('Demo — not saved to Council Ledger.')).toBeInTheDocument();
 });
 it('requires a separate Circle proposal choice and retains failures without a receipt',()=>{
  start('Story');fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fixture story'}});
  fireEvent.click(screen.getByLabelText('Propose sharing with the Circle'));
  expect(screen.getByText(/would not become public automatically/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Preview offering →'}));
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'unknown'}});
  fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(screen.getByRole('alert')).toHaveTextContent('unknown');
  expect(screen.queryByText('Demo — not saved to Council Ledger.')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'success'}});fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(screen.getByText(/Sharing proposed in this demo/)).toBeInTheDocument();
 });
 it('references one synthetic source ID without copying its body or inventing a tree',()=>{
  const result=demoReceipt(companions[0],'Link existing offering','private','must not copy','Demo Wanderer');
  expect(result).toMatchObject({circle:238,companionKey:companions[0].key,sourceOfferingId:sourceOffering.id,status:'demo-only'});
  expect(result).not.toHaveProperty('text');expect(result).not.toHaveProperty('tree_id');
  expect(selectedCompanion('goji-seed')?.id).not.toBe(selectedCompanion('goji-fruit')?.id);
  expect(selectedCompanion('not-a-companion')).toBeUndefined();
 });
 it('keeps production 2D unchanged unless a preview callback is explicitly supplied',()=>{
  render(<MemoryRouter initialEntries={['/council/238?companion=fig&offering=review']}><Circle238Page/></MemoryRouter>);
  expect(screen.queryByRole('button',{name:'Leave an offering · demo'})).not.toBeInTheDocument();
 });
 it('releases its synthetic object URL on unmount',()=>{
  const result=render(<Composer companion={companions[0]} onClose={vi.fn()}/>);result.unmount();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-audio');
 });
 it('contains no real write, reward, search, storage or recorder integration',()=>{
  for(const name of ['Composer.tsx','model.ts','main.tsx']){
   const source=readFileSync('src/review/council-offerings/'+name,'utf8');
   expect(source).not.toMatch(/supabase|issueRewards|earnHearts|claimCouncil|localStorage|indexedDB|getUserMedia|\.upload\(|fetch\(/);
  }
 });
});
