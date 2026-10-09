import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HeartwoodLanding from '@/components/library/HeartwoodLanding';
vi.mock('@/components/Header', () => ({ default: () => null }));
vi.mock('@/components/Footer', () => ({ default: () => null }));
vi.mock('@/components/LibraryRoomGrid', () => ({ default: () => null }));
vi.mock('@/components/GlobalSearch', () => ({ default: ({onClose}: {onClose:()=>void}) => <div role="dialog"><button onClick={onClose}>Close consultation</button></div> }));
const enter = () => render(<MemoryRouter><HeartwoodLanding /></MemoryRouter>);
describe('Heartwood Living Field hierarchy', () => {
  it('leads with real current attention and keeps exact Library identity', () => {
    enter();
    expect(screen.getByRole('heading', {level:1})).toHaveTextContent('What is the Tree remembering now?');
    expect(screen.getByText('What is already blooming in us that we haven’t noticed yet?')).toBeInTheDocument();
    expect(screen.getByRole('link', {name:'Silver Birch · a recorded Library identity →'})).toHaveAttribute('href','/library/life/betula-pendula');
    expect(screen.getByText('Living Web · not open yet')).toBeInTheDocument();
  });
  it('distinguishes rootward and beside-Tree passages from cultural rooms', () => {
    enter();
    expect(screen.getByRole('link', {name:/Ancient Friends · Roots/})).toHaveAttribute('href','/map');
    expect(screen.getByRole('link', {name:/Quest Cave/})).toHaveAttribute('href','/library/quest-cave');
    expect(screen.getByRole('link', {name:/Staff Room/})).toHaveAttribute('href','/library/staff-room');
    expect(screen.getByRole('link', {name:/My Hearth/})).toHaveAttribute('href','/dashboard');
    expect(screen.queryByRole('link', {name:/Dev Room|Rhythms|Vault|Harvest Exchange/})).not.toBeInTheDocument();
  });
  it('uses existing consultation without adding a persistent store', async () => {
    enter();fireEvent.click(screen.getByRole('button',{name:'Consult Heartwood →'}));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Close consultation'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

it('offers spatial and direct entry into the same Heartwood', () => {
  enter();expect(screen.getByRole('link',{name:'Explore Heartwood ↓'})).toHaveAttribute('href','#heartwood-direct');
  fireEvent.click(screen.getByRole('button',{name:'Enter the trunk'}));
  expect(screen.getByTitle('TETOL spatial Heartwood')).toHaveAttribute('src',expect.stringContaining('#hwroom'));
});
it('retains the spatial instance while opening a canonical room and returning', () => {
  enter();fireEvent.click(screen.getByRole('button',{name:'Enter the trunk'}));
  const frame=screen.getByTitle('TETOL spatial Heartwood') as HTMLIFrameElement;
  const doc=document.implementation.createHTMLDocument('Spatial fixture');Object.defineProperty(frame,'contentDocument',{value:doc});doc.body.innerHTML='<a href="https://www.s33d.life/library/music-room">Listen</a>';fireEvent.load(frame);
  act(()=>{doc.querySelector('a')!.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));});
  expect(screen.getByTitle('Music Room · Heartwood reading room')).toHaveAttribute('src','/library/music-room');
  expect(frame).toHaveAttribute('hidden');
  fireEvent.click(screen.getByRole('button',{name:'Return to Spatial Heartwood ↑'}));
  expect(screen.getByTitle('TETOL spatial Heartwood')).toBe(frame);expect(frame).not.toHaveAttribute('hidden');
});
