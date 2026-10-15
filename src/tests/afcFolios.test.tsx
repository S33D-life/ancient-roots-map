import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AFC_FOLIOS, folioFor } from '@/data/afc/folios';
import { folioOpening, folioReturn } from '@/lib/afcFolioReturn';
import { AfcCouncilReviewPage, AncientFriendFolioPage } from '@/pages/review/AncientFriendFolioPage';
import { readFileSync } from 'node:fs';
beforeAll(() => { HTMLElement.prototype.scrollIntoView = vi.fn(); window.scrollTo = vi.fn(); });
afterEach(cleanup);
function mount(url:string) { return render(<MemoryRouter initialEntries={[url]}><Routes><Route path="/review/ancient-friends/:folioKey" element={<AncientFriendFolioPage />} /><Route path="/review/afc/council/:circleNumber" element={<AfcCouncilReviewPage />} /></Routes></MemoryRouter>); }
describe('AFC identity and contextual folio studies',()=>{
  it('preserves two distinct existing identities and Noku history',()=>{
    expect(AFC_FOLIOS.ely.identity).toEqual({source:'research-trees',id:'fc085265-5a4f-46f0-a616-f3b869bea8b0'});
    expect(AFC_FOLIOS.noku.identity).toEqual({source:'trees',id:'59eb1fe8-3c29-4696-ae00-f42edeb1c886'});
    expect(AFC_FOLIOS.noku.circles).toEqual([234,237]);expect(folioFor('__proto__')).toBeNull();
  });
  for(const folio of Object.values(AFC_FOLIOS)) for(const circle of folio.circles) for(const mode of ['2d','spatial'] as const)
  it(`${folio.key} Circle ${circle} ${mode}: refreshable exact return`,()=>{
    const url=folioOpening(folio,circle,mode)!;expect(folioReturn(folio,new URL(url,'https://example.test').searchParams)).toBe(`/review/afc/council/${circle}?mode=${mode}&returned=1&companion=${folio.companionId}`);
  });
  it('rejects cross-identity, wrong circle, focus mismatch, duplicate and hostile contexts',()=>{
    const valid=new URL(folioOpening(AFC_FOLIOS.ely,236,'2d')!,'https://example.test').searchParams;
    expect(folioReturn(AFC_FOLIOS.noku,valid)).toBeNull();
    const raw=JSON.parse(valid.get('recordReturn')!);
    for(const bad of [{...raw,contextId:'council-of-life/circle-237'},{...raw,focusTarget:'birch-companion'},{...raw,route:'https://evil.test'},{...raw,url:'https://evil.test'}])expect(folioReturn(AFC_FOLIOS.ely,new URLSearchParams({recordReturn:JSON.stringify(bad)}))).toBeNull();
    valid.append('recordReturn',valid.get('recordReturn')!);expect(folioReturn(AFC_FOLIOS.ely,valid)).toBeNull();expect(folioReturn(AFC_FOLIOS.ely,new URLSearchParams())).toBeNull();expect(folioOpening(AFC_FOLIOS.noku,236,'2d')).toBeNull();
  });
  it('has credited external livestream only for Ely, no iframe/feed mirroring',()=>{
    mount(folioOpening(AFC_FOLIOS.ely,236,'2d')!);
    const link=screen.getByRole('link',{name:'Watch this tree live ↗'});expect(link.getAttribute('href')).toBe(AFC_FOLIOS.ely.livestream);expect(link.getAttribute('rel')).toContain('noopener');expect(document.querySelector('iframe')).toBeNull();
    expect(screen.getAllByRole('link',{name:/Return to Ely Plane in Circle 236/})).toHaveLength(2);
  });
  it('Noku has no invented stream or photo, retains source attribution and future state',()=>{
    mount(folioOpening(AFC_FOLIOS.noku,237,'2d')!);expect(screen.queryByRole('link',{name:/Watch this tree live/})).toBeNull();expect(document.querySelector('img')).toBeNull();expect(screen.getByText(/Ian’s source material is held privately/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('link',{name:/Return to Noku in Circle 237/})[0]);expect(screen.getByRole('heading',{name:'Circle 237 · PREPARING'})).toBeTruthy();expect(document.activeElement?.id).toBe('noku-companion');
  });
  it('does not ship coordinates, private sources, guardian detail or database reads',()=>{
    const serialized=JSON.stringify(AFC_FOLIOS);expect(serialized).not.toMatch(/52\.398|0\.261|what3words|hedgehog|app\.notion|Photo.?9/i);
    const source=readFileSync('src/pages/review/AncientFriendFolioPage.tsx','utf8');expect(source).not.toMatch(/supabase|research_trees|\.from\(|fetch\(/);
  });
  it('keeps the spatial adapter opt-in and its source independent from production workflows',()=>{
    const adapter=readFileSync('public/tetol/circle-235/pre-fire/runtime/companion-frames.js','utf8');expect(adapter).toContain('["234", "236", "237"].includes(preview)');
    const preview=readFileSync('public/tetol/circle-235/pre-fire/runtime/afc-folio-preview.js','utf8');expect(preview).toContain('body.grace-p.g-still:not(.g-reading) aside#panel{opacity:1!important;pointer-events:auto!important}');expect(preview).not.toMatch(/supabase|\/rest\/v1|\.insert\(|\.update\(/);
  });
});
