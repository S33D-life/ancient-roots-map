import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import {MemoryRouter} from 'react-router-dom';
import Composer from '@/review/council-offerings/Composer';
import {companions,kinds,selectedCompanion,demoReceipt,sourceOffering} from '@/review/council-offerings/model';
import Circle238Page from '@/pages/council/Circle238Page';
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:fixture-audio');URL.revokeObjectURL=vi.fn();window.scrollTo=vi.fn();window.matchMedia=vi.fn(()=>({matches:true} as MediaQueryList));});
afterEach(cleanup);
function start(kind:string,qa=false){render(<Composer companion={companions[0]} onClose={vi.fn()} qa={qa}/>);fireEvent.click(screen.getByRole('button',{name:kind==='Recommend a companion for next week'?/Recommend a companion for next week/:kind}));}
describe('Council offering fixture isolation and holding',()=>{
 it.each(['2d','deck'] as const)('focuses the opening question in the %s composer',async host=>{
  render(<Composer companion={companions[0]} host={host} onClose={vi.fn()}/>);
  await waitFor(()=>expect(screen.getByRole('heading',{name:'What would you like to offer this companion?'})).toHaveFocus());
  expect(screen.getByRole('button',{name:'Close offering'})).not.toHaveFocus();
 });
 it('names the holding group with its visible question and exposes separate option descriptions',()=>{
  start('Story');fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fixture story'}});fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  const question=screen.getByRole('heading',{name:'How should your story be held?'}),group=screen.getByRole('group',{name:'How should your story be held?'});
  expect(group).toHaveAttribute('aria-labelledby',question.id);
  expect(screen.getByRole('radio',{name:'Only me'})).toHaveAccessibleDescription(/only you would see/);
  expect(screen.getByRole('radio',{name:'The curators for this Circle'})).toHaveAccessibleDescription(/public sharing would need your separate agreement/);
  expect(screen.getByRole('radio',{name:'Only me'})).toBeChecked();
 });
 it('includes the visible seed explanation in its accessible name',()=>{
  render(<Composer companion={companions[0]} onClose={vi.fn()}/>);
  expect(screen.getByRole('button',{name:'Recommend a companion for next week A suggestion for human review · nothing is sent'})).toBeInTheDocument();
 });
 it.each(kinds)('keeps %s private by default at its dedicated holding stage',async kind=>{
  start(kind);expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  if(kind==='Song')fireEvent.click(screen.getByRole('button',{name:/A canopy hum/}));
  else if(kind==='Photograph')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic photograph example'}));
  else if(kind==='Voice')fireEvent.click(screen.getByRole('button',{name:'Choose synthetic voice example'}));
  else if(kind==='Poem')fireEvent.change(screen.getByPlaceholderText('Let the poem begin…'),{target:{value:'A fictional poem'}});
  else fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fictional noticing'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  expect(screen.getByLabelText('Only me')).toBeChecked();
  expect(screen.getByLabelText('The curators for this Circle')).not.toBeChecked();
  expect(screen.getByLabelText('Future-design promises')).toHaveTextContent('not implemented in this demo');
  expect(screen.getByText(/Not minted/)).toBeInTheDocument();
  expect(screen.queryByLabelText('Demo outcome')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}));
  expect(await screen.findByText('Demo receipt · nothing was stored or sent.')).toBeInTheDocument();
  expect(screen.getByText('Different friends. One living story.')).toBeInTheDocument();
 });
 it('requires a separate review choice and retains QA failures without a receipt',async()=>{
  start('Story',true);fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'A fixture story'}});
  fireEvent.click(screen.getByRole('button',{name:'Continue'}));fireEvent.click(screen.getByLabelText('The curators for this Circle'));
  expect(screen.getByText(/public sharing would need your separate agreement/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}));
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'unknown'}});fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(screen.getByRole('alert')).toHaveTextContent('unknown');expect(screen.queryByLabelText('Demo receipt')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Demo outcome'),{target:{value:'success'}});fireEvent.click(screen.getByRole('button',{name:'Simulate offering'}));
  expect(await screen.findByText(/Nothing was submitted or shared/)).toBeInTheDocument();
 });
 it('keeps QA source links out of the normal journey and labels future suggestion privacy',()=>{
  start('Recommend a companion for next week',false);
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

describe('plain actions and independent recommendations',()=>{
 it('distinguishes addressed private reflection from a curator proposal',()=>{
  start('Message');fireEvent.change(screen.getByRole('textbox',{name:'Your words'}),{target:{value:'Fictional reflection'}});fireEvent.click(screen.getByRole('button',{name:'Continue'}));
  expect(screen.getByRole('button',{name:'Keep this private (demo)'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Place it in the Circle (demo)'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio',{name:'The curators for this Circle'}));expect(screen.getByRole('button',{name:'Propose for curator review (demo)'})).toBeInTheDocument();
 });
 it('opens a name-only recommendation without another companion and preserves existing categories',async()=>{
  const before=JSON.stringify(companions),close=vi.fn();render(<Composer initialKind="Future companion" onClose={close}/>);
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Recommend a companion');expect(screen.queryByRole('img')).not.toBeInTheDocument();
  const action=screen.getByRole('button',{name:'Preview recommendation (demo)'});expect(action).toBeDisabled();fireEvent.change(screen.getByRole('combobox',{name:'Suggested companion'}),{target:{value:'A fictional elder tree'}});expect(action).not.toBeDisabled();
  expect(screen.getByRole('textbox',{name:'Why recommend them? (optional)'})).not.toBeRequired();
  const options=Array.from(screen.getByRole('combobox',{name:'Category (optional)'}).querySelectorAll('option')).map(o=>o.textContent);expect(options).toEqual(['Not sure',...new Set(companions.map(c=>c.kind))]);
  fireEvent.click(action);expect(await screen.findByLabelText('Demo receipt')).toHaveTextContent('Recommendation preview — nothing was sent.');expect(screen.getByLabelText('Demo receipt')).toHaveTextContent('Not included');expect(screen.queryByText('Addressed to')).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Meet the next companion'})).not.toBeInTheDocument();expect(JSON.stringify(companions)).toBe(before);
  fireEvent.click(screen.getByRole('button',{name:'Return to the Council'}));expect(close).toHaveBeenCalledOnce();
 });
});
