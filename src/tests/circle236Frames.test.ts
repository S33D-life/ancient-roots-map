import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import frames from '../../public/council/circle-236/companions.json';
import { BIRCH_ARTIFACT, birchAppearance } from '@/data/library/birchThread';

describe('one Circle companion manifest, two surfaces', () => {
  it('keeps the seven approved associations and distinguishes the book and individual tree', () => {
    expect(frames.status).toBe('PREPARING');
    expect(frames.companions.map(c => c.id)).toEqual(['birch-companion','ely-plane-companion','rose-companion','tomato-companion','bay-bolete-companion','toucan-companion','winnie-the-pooh-companion']);
    expect(frames.companions.filter(c => c.reader).map(c => c.id)).toEqual(['birch-companion']);
    expect(frames.companions[1].kind).toContain('Individual tree');
    expect(frames.companions[6].kind).toContain('Book');
    for (const c of frames.companions) expect(readFileSync(`public${c.artwork}`).length).toBeGreaterThan(10000);
    expect(BIRCH_ARTIFACT).toBe(frames.companions[0].artwork);
    expect(birchAppearance('spatial').artifactRef).toBe(BIRCH_ARTIFACT);
  });
  it('installs seven appearances without replacing the room, earlier Circle or canonical content', async () => {
    const room = { name: 'Council of Life', sub: 'Earlier Circle', purpose: 'Persistent room', relations: [] };
    const previous = { node: 'c233', number: 233, companions: [{ id: 'historical-model' }] };
    const D = { nodes: { croom: room, c233: { name: 'Earlier Circle' }, yewc233: { lives: ['historical'], actions: ['historical'], status: 'REMEMBERED' } } as Record<string, any>, council: { circles: { 233: previous } as Record<number, any>, active: 233, current: 'c233' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => frames }));
    try {
      const { installCompanionFrames, companionPanel } = await import('../../public/tetol/circle-235/pre-fire/runtime/companion-frames.js');
      await installCompanionFrames(D);
      expect(D.nodes.croom).toBe(room);
      expect(D.council.circles[233]).toBe(previous);
      expect(D.council.circles[236].companions.map((c: any) => c.id)).toEqual(frames.companions.map(c => c.id));
      expect(D.nodes['ely-plane-companion'].lives).toEqual([]);
      expect(companionPanel(D, 'birch-companion', (s: string) => s)).toContain('data-circle-reader');
      expect(companionPanel(D, 'winnie-the-pooh-companion', (s: string) => s)).not.toContain('data-circle-reader');
      expect(companionPanel(D, 'croom', (s: string) => s)).toContain('PREPARING');
    } finally { vi.unstubAllGlobals(); }
  });
});
