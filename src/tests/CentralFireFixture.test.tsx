import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {readFileSync} from 'node:fs';
import FireComposer from '@/review/council-offerings/fire/FireComposer';
import {blankFireDraft,fireReceipt,needsSafetyReview,practices,reviewFireState} from '@/review/council-offerings/fire/model';
beforeEach(()=>{URL.createObjectURL=vi.fn(()=> 'blob:synthetic');URL.revokeObjectURL=vi.fn();window.matchMedia=vi.fn(()=>({matches:true} as MediaQueryList));});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function start(practice='Notice',onReceipt=vi.fn(),onClose=vi.fn()){
 render(<FireComposer host="2d" onClose={onClose} onReceipt={onReceipt}/>);
 fireEvent.click(screen.getByRole('button',{name:practice}));
 return {onReceipt,onClose};
}
function words(){fireEvent.change(screen.getByRole('textbox',{name:'What happened?'}),{target:{value:'A fictional moment in a garden.'}});fireEvent.click(screen.getByRole('button',{name:'Continue'}));}
describe('Central Fire disconnected intentions',()=>{
 it.each(practices)('accepts only the required words for $name',p=>{start(p.name);expect(screen.getByRole('button',{name:'Continue'})).toBeDisabled();expect(screen.getByText('Add more (optional)').parentElement).not.toHaveAttribute('open');words();expect(screen.getByRole('group',{name:'Who should see it?'})).toBeInTheDocument();expect(screen.getByRole('radio',{name:'Only me'})).toBeChecked();});
 it('keeps curator review and read-aloud separate, resets both, and makes no requests',async()=>{
  const fetch=vi.spyOn(window,'fetch').mockRejectedValue(new Error('No network allowed'));const {onReceipt}=start();words();
  const curator=screen.getByRole('radio',{name:'The curators for this Circle'}),aloud=screen.getByRole('checkbox',{name:'Read aloud at the Fire'});
  expect(curator).not.toBeChecked();expect(curator).toHaveAccessibleDescription(/does not permit reading aloud or public Library/);expect(aloud).toBeDisabled();expect(aloud).not.toBeChecked();
  fireEvent.click(curator);expect(aloud).not.toBeChecked();fireEvent.click(aloud);expect(aloud).toBeChecked();fireEvent.click(screen.getByRole('radio',{name:'Only me'}));expect(aloud).toBeDisabled();expect(aloud).not.toBeChecked();
  fireEvent.click(screen.getByRole('button',{name:/^(Keep this private|Propose for curator review) \(demo\)$/}));await screen.findByLabelText('Fire demo receipt');
  expect(onReceipt).toHaveBeenCalledWith(expect.objectContaining({destination:'fire',circle:238,curatorReview:false,readAloud:false,status:'demo-only'}));expect(fetch).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Bring something else to the Fire'}));fireEvent.click(screen.getByRole('button',{name:'Learn'}));words();expect(screen.getByRole('radio',{name:'Only me'})).toBeChecked();expect(screen.getByRole('checkbox')).not.toBeChecked();
 });
 it('focuses the question and lets listening leave without a draft',async()=>{const close=vi.fn(),receipt=vi.fn();render(<FireComposer host="deck" onClose={close} onReceipt={receipt}/>);await waitFor(()=>expect(screen.getByRole('heading',{name:'What happened?'})).toHaveFocus());expect(screen.getByRole('dialog')).toHaveAccessibleName('The Fire');fireEvent.click(screen.getByRole('button',{name:/Or simply sit by the Fire and listen/}));expect(close).toHaveBeenCalledOnce();expect(receipt).not.toHaveBeenCalled();});
 it('marks wild Gather, fungus and preserved Make for safety review without a checkbox',()=>{const d=blankFireDraft();expect(needsSafetyReview({...d,practice:'Gather',origin:'Wild'})).toBe(true);expect(needsSafetyReview({...d,subject:'Hen of the Woods'})).toBe(true);expect(needsSafetyReview({...d,practice:'Make',preserved:true})).toBe(true);expect(needsSafetyReview({...d,practice:'Notice',subject:'Fig'})).toBe(false);start('Gather');fireEvent.click(screen.getByRole('radio',{name:'Wild'}));expect(screen.getByLabelText('Wild food needs care')).toBeInTheDocument();expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();});
 it('never promotes read-aloud to consent without curator review',()=>{expect(fireReceipt({...blankFireDraft(),readAloud:true}).readAloud).toBe(false);});
 it.each(['open','gathering','afterglow','remembered'])('requires explicit QA for the %s state',state=>{expect(reviewFireState(false,state)).toBe('open');expect(reviewFireState(true,state)).toBe(state);});
 it('has no persistence, upload, capture, backend or lookup imports',()=>{for(const file of ['FireComposer.tsx','FireArea.tsx','model.ts']){const source=readFileSync('src/review/council-offerings/fire/'+file,'utf8');expect(source).not.toMatch(/supabase|\.upload\(|getUserMedia|MediaRecorder|localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);}});
});
