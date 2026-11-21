import {afterEach,beforeEach,it,expect,vi} from 'vitest';
import {act,render,screen,waitFor,cleanup} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import Page from '@/pages/heartwood/LifeGroveInvitePage';
const state=vi.hoisted(()=>({userId:null as string|null,join:vi.fn(),lookup:vi.fn()}));
vi.mock('@/hooks/use-current-user',()=>({useCurrentUser:()=>({user:state.userId?{id:state.userId}:null,userId:state.userId})}));
vi.mock('@/repositories/life-groves',()=>({getLifeGroveByToken:state.lookup}));
vi.mock('@/repositories/life-grove-stewardship',()=>({joinGroveWithToken:state.join}));
vi.mock('@/components/Header',()=>({default:()=>null}));vi.mock('@/components/Footer',()=>({default:()=>null}));
vi.mock('@/components/life-groves/EtherealTreePreview',()=>({default:()=>null}));vi.mock('@/components/life-groves/LifeGroveOfferingComposer',()=>({default:()=>null}));
beforeEach(()=>{state.userId=null;state.join.mockResolvedValue('fictional-grove');state.lookup.mockResolvedValue({id:'fictional-grove',grove_title:'Fictional private family',grove_type:'family',privacy:'private_family'});});
afterEach(()=>{cleanup();vi.resetAllMocks();});
function fixture(client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}})){return <QueryClientProvider client={client}><MemoryRouter initialEntries={['/life-grove-invite/fictional-token']}><Routes><Route path="/life-grove-invite/:inviteToken" element={<Page/>}/></Routes></MemoryRouter></QueryClientProvider>;}
it('shows no family details and performs no lookup while signed out',()=>{render(fixture());expect(screen.getByRole('heading',{name:'Private Grove invitation'})).toBeTruthy();expect(state.join).not.toHaveBeenCalled();expect(state.lookup).not.toHaveBeenCalled();expect(screen.queryByText('Fictional private family')).toBeNull();});
it('reveals the family only after successful server redemption',async()=>{state.userId='fictional-author';render(fixture());await waitFor(()=>expect(screen.getByRole('heading',{name:'Fictional private family'})).toBeTruthy());expect(state.join).toHaveBeenCalledWith('fictional-token');});
it('shows an honest expired-link state and a safe return to existing memberships',async()=>{state.userId='fictional-member';state.join.mockRejectedValue(new Error('Invitation unavailable'));render(fixture());await waitFor(()=>expect(screen.getByRole('heading',{name:'Invitation unavailable'})).toBeTruthy());expect(screen.getByRole('link',{name:'Return to my Groves'})).toHaveAttribute('href','/heartwood/life-groves');expect(state.lookup).not.toHaveBeenCalled();});
it('does not reuse another account’s joined state',async()=>{state.userId='fictional-a';const client=new QueryClient({defaultOptions:{queries:{retry:false}}});const view=render(fixture(client));await waitFor(()=>expect(screen.getByRole('heading',{name:'Fictional private family'})).toBeTruthy());let finish:(v:string)=>void=()=>{};state.join.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));state.userId='fictional-b';view.rerender(fixture(client));await waitFor(()=>expect(state.join).toHaveBeenCalledTimes(2));expect(screen.getByRole('heading',{name:'Checking invitation'})).toBeTruthy();expect(screen.queryByText('Fictional private family')).toBeNull();await act(async()=>finish('fictional-grove'));await waitFor(()=>expect(screen.getByRole('heading',{name:'Fictional private family'})).toBeTruthy());});
