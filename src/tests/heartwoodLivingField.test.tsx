import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.queryByRole('link', {name:/Dev Room|Rhythms|Vault/})).not.toBeInTheDocument();
  });
  it('uses existing consultation without adding a persistent store', async () => {
    enter();fireEvent.click(screen.getByRole('button',{name:'Consult Heartwood →'}));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Close consultation'}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
