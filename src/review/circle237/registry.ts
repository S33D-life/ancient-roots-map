import type { IdentityRef } from '@/lib/library/recordIdentity';
import { returnContextSchema, type ContextualAppearance } from '@/lib/library/contextualReturn';
export const PILOT_PATH = '/review/circle237.html';
export const CONTEXT = 'council-of-life/circle-237';
export const PILOT_REVIEW_DATE = '2026-10-16';
export type Mode = '2d' | 'spatial';
export const NAMESPACE = 'weekly-2026';
export const roster = [
  ['noku', 'Noku / Nokuphila', 'Ancient Friend'],
  ['hawthorn', 'Hawthorn', 'Tree Species'],
  ['jade', 'Jade / Money Plant', 'Plant'],
  ['broad-bean', 'Leo’s Broad Bean', 'Seed'],
  ['wild-raspberry', 'Wild Raspberry', 'Leaf'],
  ['sunflower', 'Teddy Bear Sunflower', 'Flower'],
  ['quince', 'Quince', 'Fruit'],
  ['fly-agaric', 'Fly Agaric', 'Fungi'],
  ['faraway-tree', 'The Magic Faraway Tree', 'Book'],
  ['boobook', 'Boobook Owl', 'Bird'],
].map(([key, name, category]) => ({ key, name, category, appearanceId: `${key}-companion`,
  plaque: `${name} · ${category} · yOur Blooming Week · Council of Life · 237`,
  artwork: null, artworkStatus: 'Exact portrait pending intake' as const,
}));
export type PilotKey = 'noku' | 'fly-agaric';
export const identities: Record<PilotKey, IdentityRef> = {
  noku: { source: 'trees', id: '59eb1fe8-3c29-4696-ae00-f42edeb1c886' },
  'fly-agaric': { source: 'notion', id: '22a15b58-480d-8027-bf5f-ce0841334f10' },
};
export function isPilotKey(value: unknown): value is PilotKey { return value === 'noku' || value === 'fly-agaric'; }
export function appearance(key: PilotKey, mode: Mode): ContextualAppearance {
  return { id: `${key}-companion`, contextId: CONTEXT, identity: identities[key],
    contextNote: `Council appearance proposal recorded ${PILOT_REVIEW_DATE}; encounter date unconfirmed.`,
    returnContext: { route: 'council', realm: 'canopy', contextId: CONTEXT, appearanceId: `${key}-companion`, mode, focusTarget: `${key}-companion` } };
}
/** The caller cannot supply routes, selectors, private record IDs or an external return URL. */
export function pilotState(search: string) {
  const params = new URLSearchParams(search);
  const mode: Mode = params.get('mode') === 'spatial' ? 'spatial' : '2d';
  const key = isPilotKey(params.get('companion')) ? params.get('companion') as PilotKey : null;
  const requested = params.get('view');
  const view = ['encounter', 'record', 'harvest', ...(key === 'noku' ? ['twin'] : [])].includes(requested ?? '') && key ? requested! : 'council';
  const returned = isPilotKey(params.get('returned')) ? params.get('returned') as PilotKey : null;
  return { mode, key, view, returned };
}
export function pilotHref(mode: Mode, view = 'council', key?: PilotKey) {
  const p = new URLSearchParams({ mode });
  if (key) p.set('companion', key);
  if (view !== 'council') p.set('view', view);
  return `${PILOT_PATH}?${p}`;
}
export function returnHref(key: PilotKey, mode: Mode) {
  const context = returnContextSchema.parse(appearance(key, mode).returnContext);
  if (context.route !== 'council' || context.contextId !== CONTEXT) throw new Error('Unregistered return');
  return `${pilotHref(mode)}&returned=${key}`;
}
export const NokuTwinReference = 'https://claude.ai/artifact/VMPrXsQ7ALdTL9nN67UFqp';
