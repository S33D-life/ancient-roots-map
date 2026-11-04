import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import manifest from '../../public/council/circle-239/companions.json';
import receipt from '../../docs/releases/circle239-20261104/receipt.json';
import tree from '../../public/council/time-tree.json';
import Circle239Page from '@/pages/council/Circle239Page';
import { installCompanionFrames, companionPanel } from '../../public/tetol/circle-235/pre-fire/runtime/companion-frames-239.js';
import { installTimeTree } from '../../public/tetol/circle-235/pre-fire/runtime/council-time-tree.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.head.querySelectorAll('style').forEach(s => s.remove()); });
const digest = (path:string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const model = () => ({nodes:{c233:{},c233now:{},yewc233:{},croom:{},live_fire:{name:'Older Fire'}},lineage:[],council:{circles:{233:{number:235}},active:233,current:'c233'}} as any);
describe('Circle239 front-only release', () => {
  it('pins the selected ten fronts, corrected Ginger and separately confirmed Fly Agaric', () => {
    expect(manifest.companions.map(c=>c.label)).toEqual(['Defynnog Yew','European Beech','Ginger','Sycamore helicopter seed','Ginkgo leaf','Dahlia','Rosehip','Fly Agaric / Amanita muscaria','Slender-billed Northern Nutcracker','The Secret Garden']);
    expect(manifest.companions.map(c=>c.order)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(manifest.companions[2]).toMatchObject({essence:'Hidden fire',sha256:'fc03a0244d7145cd93a30452f0f5082bb07a8e287b010bd445f1bf7c0ca7af17'});
    expect(manifest.companions[7].sha256).toBe('7587c9e94d1156d824c440ec0f8de61bade128f8a9477008a21a5d7ac2826cfd');
    expect(digest('public/council/circle-239/companions.json')).toBe(receipt.manifestSha256);
    for (const c of manifest.companions) {
      expect(c.id).toBe('c239-'+c.key); expect(c.atlasId).toBeNull(); expect(c.speciesKey).toBeNull();
      expect(c.width/c.height).toBe(1.5); expect(digest('public'+c.artwork)).toBe(c.sha256);
    }
    expect(manifest.fire).toBeNull(); expect(manifest.pdf).toBeNull(); expect(manifest.publicationApproved).toBe(false);
  });
  it('preserves every pinned previous public asset outside explicit edition presentation files', () => {
    for (const [path,sha] of Object.entries(receipt.preservedPublicFiles)) expect(digest(path),path).toBe(sha);
    expect(tree.current).toBe(239); expect(tree.editions.map(e=>e.number)).toEqual([234,235,236,237,238,239]);
    expect(tree.editions.find(e=>e.number===238)?.state).toBe('PREVIOUS');
    expect(tree.editions.find(e=>e.number===237)?.state).toBe('HISTORICAL');
  });
  it('uses the same manifest for the original Tree, question, ten scene frames and unscheduled hearth', async () => {
    vi.stubGlobal('fetch',vi.fn().mockImplementation(async (url:string) => ({ok:true,json:async()=>url.endsWith('time-tree.json')?tree:manifest})));
    (window as any).S33D_COUNCIL={circles:{}};
    const d=model(); await installCompanionFrames(d); await installTimeTree(d,239);
    expect(d.council.active).toBe(239); expect(d.council.circles[239].status).toBe('open');
    expect(d.nodes.croom.question).toBe(manifest.question); expect(d.nodes.c239.sub).toContain('CURRENT / OPEN');
    expect(d.council.circles[239].companions.map((c:any)=>c.id)).toEqual(manifest.companions.map(c=>c.id));
    for(const c of d.council.circles[239].companions) expect(c.repr).toMatchObject({form:'circleFrame',width:1536,height:1024});
    expect(d.nodes.live_fire.actions).toEqual([]); expect(d.nodes.live_fire.stateShort).toBe('UNSCHEDULED');
    for(const id of ['live_fire','seat_you']) {
      const panel=companionPanel(d,id,(s:string)=>s);
      expect(panel).toContain('no offering or attendance is recorded');
      expect(panel).not.toContain('Circle 235'); expect(panel).not.toContain('@opencircle');
    }
    expect(companionPanel(d,manifest.companions[0].id,(s:string)=>s)).toContain('/council/239?companion=defynnog-yew');
  });
  it.each(['question','fire','id','artwork'])('fails closed for a mismatched %s without installing another edition', async field => {
    const bad=structuredClone(manifest);
    if(field==='question') bad.question='A different question';
    if(field==='fire') (bad as any).fire={time:'invented'};
    if(field==='id') bad.companions[0].id=bad.companions[1].id;
    if(field==='artwork') bad.companions[0].artwork='/private/family.jpeg';
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>bad}));const d=model();
    await expect(installCompanionFrames(d)).rejects.toThrow('does not match'); expect(d.council.active).toBe(233);
  });
  it('has accessible encounter/return focus, an exact3D destination and no offering or flip action', () => {
    render(<MemoryRouter><Circle239Page /></MemoryRouter>);
    expect(screen.getByRole('heading',{level:1})).toHaveFocus();
    expect(screen.getAllByRole('img')).toHaveLength(10);
    fireEvent.click(screen.getByRole('button',{name:'Meet Ginger'}));
    expect(screen.getByRole('heading',{name:'Ginger'})).toHaveFocus();
    expect(screen.getByRole('link',{name:'Meet this companion in the original TETOL →'})).toHaveAttribute('href','/tetol/circle-235/pre-fire/tetol.html?circle=239#c239-ginger');
    fireEvent.click(screen.getByRole('button',{name:'Return to Circle 239'}));
    expect(screen.getByRole('button',{name:'Meet Ginger'})).toHaveFocus();
    expect(screen.queryByRole('button',{name:/offer|flip|submit|record/i})).not.toBeInTheDocument();
  });
});
