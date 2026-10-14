import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import frames from '../../public/council/circle-236/companions.json';
import { BIRCH_ARTIFACT, birchAppearance } from '@/data/library/birchThread';

describe('one Circle companion manifest, two surfaces', () => {
  it('keeps the seven approved associations and distinguishes the book and individual tree', () => {
    expect(frames.status).toBe('OPEN');
    expect(frames.companions.map(c => c.id)).toEqual(['birch-companion','ely-plane-companion','rose-companion','tomato-companion','bay-bolete-companion','toucan-companion','winnie-the-pooh-companion']);
    expect(frames.companions.filter(c => c.reader).map(c => c.id)).toEqual(['birch-companion']);
    expect(frames.companions[1].kind).toContain('Individual tree');
    expect(frames.companions[6].kind).toContain('Book');
    for (const c of frames.companions) expect(readFileSync(`public${c.artwork}`).length).toBeGreaterThan(10000);
    expect(BIRCH_ARTIFACT).toBe(frames.companions[0].artwork);
    expect(birchAppearance('spatial').artifactRef).toBe(BIRCH_ARTIFACT);
  });
  it('installs seven appearances without replacing the room, earlier Circle or canonical content', async () => {
    const room = { name: 'Council of Life', sub: 'Earlier Circle', purpose: 'Persistent room', question: 'LAST WEEK QUESTION', relations: [] };
    const previous = { node: 'c233', number: 233, companions: [{ id: 'historical-model' }] };
    const D = { nodes: { croom: room, c233: { name: 'Earlier Circle', question: 'HISTORICAL QUESTION' }, yewc233: { lives: ['historical'], actions: ['historical'], status: 'REMEMBERED' } } as Record<string, any>, council: { circles: { 233: previous } as Record<number, any>, active: 233, current: 'c233' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => frames }));
    try {
      const { installCompanionFrames, companionPanel } = await import('../../public/tetol/circle-235/pre-fire/runtime/companion-frames.js');
      await installCompanionFrames(D);
      expect(D.nodes.croom).toBe(room);
      expect(D.nodes.croom.question).toBeNull();
      expect(D.nodes.c236.question).toBeNull();
      expect(D.nodes.c233.question).toBe("HISTORICAL QUESTION");
      expect(D.council.circles[233]).toBe(previous);
      expect(D.council.circles[236].companions.map((c: any) => c.id)).toEqual(frames.companions.map(c => c.id));
      expect(D.nodes['ely-plane-companion'].lives).toEqual([]);
      expect(D.council.circles[236].companions[6].repr.artwork).toBeNull();
      expect(D.council.circles[236].companions[6].repr.textLabel).toContain('Winnie-the-Pooh');
      expect(companionPanel(D, 'birch-companion', (s: string) => s)).toContain('data-circle-reader');
      expect(companionPanel(D, 'winnie-the-pooh-companion', (s: string) => s)).not.toContain('data-circle-reader');
      expect(companionPanel(D, 'croom', (s: string) => s)).toContain('OPEN');
    } finally { vi.unstubAllGlobals(); }
  });
});

describe('companion presence uses the existing appearance and picking contract', () => {
  it('reuses existing builders and keeps every model mesh on its frame identity', async () => {
    const { buildCompanionPresence } = await import('../../public/tetol/circle-235/pre-fire/runtime/companion-frames.js');
    const pickables: THREE.Mesh[] = [];
    const add = (mesh: THREE.Mesh, name: string, id: string, parent: THREE.Group) => { mesh.name = name; mesh.userData.node = id; parent.add(mesh); pickables.push(mesh); return mesh; };
    const builder = vi.fn((group: THREE.Group, _r: unknown, id: string) => { add(new THREE.Mesh(new THREE.BoxGeometry(.1,.3,.1), new THREE.MeshStandardMaterial()), id + '_stem', id, group).position.y = .6; });
    const BUILD = { sapling: builder, flower: builder, herb: builder, fungus: builder, book: builder };
    for (const c of frames.companions) {
      const group = new THREE.Group(); const start = pickables.length;
      const presence = buildCompanionPresence({ THREE, add, std: (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p), BUILD }, group, { presence: c.presence }, c.id);
      expect(presence.parent).toBe(group);
      expect(pickables.length).toBeGreaterThan(start);
      expect(pickables.slice(start).every(m => m.userData.node === c.id)).toBe(true);
    }
    expect(builder).toHaveBeenCalledTimes(6);
    expect(frames.companions[6].presence.form).toBe('book');
    // A real Three ray through the symbolic bird resolves the same ID as its frame.
    const bird = pickables.find(m => m.name === 'toucan-companion_body')!;
    bird.parent!.updateMatrixWorld(true);
    const center = bird.getWorldPosition(new THREE.Vector3());
    const ray = new THREE.Raycaster(center.clone().add(new THREE.Vector3(0,0,2)), new THREE.Vector3(0,0,-1));
    expect(ray.intersectObject(bird)[0].object.userData.node).toBe('toucan-companion');
  });
});
