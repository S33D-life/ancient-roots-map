import releaseManifest from './release-manifest.json' with { type: 'json' };
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
  ['broad-bean', 'Broad Bean', 'Seed'],
  ['wild-raspberry', 'Wild Raspberry', 'Leaf'],
  ['sunflower', 'Teddy Bear Sunflower', 'Flower'],
  ['quince', 'Quince', 'Fruit'],
  ['fly-agaric', 'Fly Agaric', 'Fungi'],
  ['faraway-tree', 'The Magic Faraway Tree', 'Book'],
  ['boobook', 'Boobook Owl', 'Bird'],
].map(([key, name, category]) => ({ key, name, category, appearanceId: `${key}-companion`,
  plaque: `${name} · ${category} · yOur Blooming Week · Council of Life · 237`,
  artwork: releaseManifest.sceneAssets[key as keyof typeof releaseManifest.sceneAssets]?.path ?? null, artworkStatus: 'Exact portrait pending intake' as const,
}));
export type PilotKey = 'noku' | 'fly-agaric';
export type CompanionKey = 'noku' | 'hawthorn' | 'jade' | 'broad-bean' | 'wild-raspberry' | 'sunflower' | 'quince' | 'fly-agaric' | 'faraway-tree' | 'boobook';
export function isCompanionKey(value: unknown): value is CompanionKey {
  return typeof value === 'string' && roster.some(c => c.key === value);
}
/** Proposed editorial copy. Category/selection comes from Ed's ten-companion roster;
 * no field encounter, taxonomy binding or private biography is inferred. */
export const introductions: Record<CompanionKey, string> = {
  noku: 'Noku / Nokuphila returns as the same individual Ancient Friend remembered in Circle 234. One tree, with another Council appearance.',
  hawthorn: 'Hawthorn brings the tree-species thread to this Circle. The portrait specification also carries Hawthorn into the frames around the companions.',
  jade: 'Jade / Money Plant joins as the plant companion: a place to notice the quiet life of a growing plant.',
  'broad-bean': 'Broad Bean joins as the seed companion, with room to wonder about what a seed may become.',
  'wild-raspberry': 'Wild Raspberry brings the leaf into our constellation, inviting close attention to a familiar part of plant life.',
  sunflower: 'Teddy Bear Sunflower is the flower companion, bringing its name and flowering thread into the Circle.',
  quince: 'Quince joins as the fruit companion, inviting us to notice fruit, seasons and ripening.',
  'fly-agaric': 'Fly Agaric returns through its existing Library thread. Meet with care; never eat. This portrait is not a mushroom-identification guide.',
  'faraway-tree': 'The Magic Faraway Tree joins as a book companion. No unverified quotation or replacement character artwork is used here.',
  boobook: 'Boobook Owl is the bird companion. Its Council appearance does not claim a local sighting.',
};
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
export function pilotState(search: string, viewParam: 'view' | 'c237view' = 'view') {
  const params = new URLSearchParams(search);
  const mode: Mode = params.get('mode') === 'spatial' ? 'spatial' : '2d';
  const key = isCompanionKey(params.get('companion')) ? params.get('companion') as CompanionKey : null;
  const requested = params.get(viewParam);
  const view = requested === 'invitation' ? 'invitation' : key && ['encounter', ...(isPilotKey(key) ? ['record', 'harvest'] : []), ...(key === 'noku' ? ['twin'] : [])].includes(requested ?? '') ? requested! : 'council';
  const returned = isCompanionKey(params.get('returned')) ? params.get('returned') as CompanionKey : null;
  return { mode, key, view, returned };
}
export function pilotHref(mode: Mode, view = 'council', key?: CompanionKey, basePath = PILOT_PATH) {
  const p = new URLSearchParams({ mode });
  if (key) p.set('companion', key);
  if (view !== 'council') p.set(basePath === PILOT_PATH ? 'view' : 'c237view', view);
  return `${basePath}?${p}`;
}
export function returnHref(key: CompanionKey, mode: Mode, basePath = PILOT_PATH) {
  if(!isCompanionKey(key))throw new Error('Unregistered companion');
  // An encounter can return without inventing an enduring identity for it.
  const context = returnContextSchema.parse({ route:'council',realm:'canopy',contextId:CONTEXT,appearanceId:`${key}-companion`,mode,focusTarget:`${key}-companion` });
  if (context.route !== 'council' || context.contextId !== CONTEXT) throw new Error('Unregistered return');
  return `${pilotHref(mode, 'council', undefined, basePath)}&returned=${key}`;
}
export const NokuTwinReference = 'https://claude.ai/artifact/VMPrXsQ7ALdTL9nN67UFqp';
