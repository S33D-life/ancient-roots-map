import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,cleanup} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {readFileSync} from 'node:fs';
import FoundingGatewayPage from '../pages/FoundingGatewayPage';
import {ROUTES} from '../lib/routes';
vi.mock('@/components/Header',()=>({default:()=>null}));
vi.mock('@/components/Footer',()=>({default:()=>null}));
afterEach(cleanup);
function visit(){return render(<MemoryRouter><FoundingGatewayPage /></MemoryRouter>);}
describe('informational S33D founding gateway',()=>{
 it('welcomes free Wanderers with working existing entrances and honest participation rules',()=>{
  visit();expect(screen.getByRole('heading',{name:'Enter freely as a Wanderer'})).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'Explore Ancient Friends'})).toHaveAttribute('href',ROUTES.MAP);
  expect(screen.getByRole('link',{name:'Visit the weekly Council'})).toHaveAttribute('href',ROUTES.COUNCIL);
  expect(screen.getByRole('link',{name:'Join or sign in for free'})).toHaveAttribute('href',ROUTES.AUTH);
  expect(screen.getByText(/Some group Whisper channels use earned Hearts/)).toBeInTheDocument();
 });
 it('keeps proposed rewards and Christmas gifting distinct from fulfilled services and donations',()=>{
  visit();expect(screen.getByText(/£33 for a defined first year/)).toHaveTextContent('£111 total');
  expect(screen.getByText(/Christmas gifting is being explored/)).toBeInTheDocument();
  expect(screen.getByText(/No campaign URL or checkout is available here/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:'View the existing S33D Giveth project'})).toHaveAttribute('href','https://giveth.io/project/s33dlife');
  expect(screen.getByText(/Donations do not purchase a Grove/)).toBeInTheDocument();
 });
 it('has no collection, checkout, invented Crowdfunder destination or application-side writes',()=>{
  const {container}=visit();expect(container.querySelectorAll('form,input,textarea,button')).toHaveLength(0);
  expect([...container.querySelectorAll('a')].filter(a=>a.href.includes('crowdfunder.'))).toHaveLength(0);
  const source=readFileSync('src/pages/FoundingGatewayPage.tsx','utf8');
  expect(source).not.toMatch(/supabase|fetch\(|localStorage|sessionStorage|createSupportCheckout|stripe|\.insert\(|\.upload\(/);
  expect(screen.getByText(/This page collects no personal details/)).toBeInTheDocument();
 });
});
