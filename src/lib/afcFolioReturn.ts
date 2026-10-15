/** Selectively recovered Phase 0 contract: named companion + query-surviving return. */
import { parseReturnContext, returnContextParams } from '@/lib/library/contextualReturn';
import { type Folio } from '@/data/afc/folios';
export type FolioMode = '2d' | 'spatial';
export function folioOpening(folio: Folio, circle: number, mode: FolioMode) {
  if (!(folio.circles as number[]).includes(circle)) return null;
  return `/review/ancient-friends/${folio.key}?${returnContextParams({ route: 'council', realm: 'canopy', contextId: `council-of-life/circle-${circle}`, appearanceId: folio.companionId, focusTarget: folio.companionId, mode })}`;
}
export function folioReturn(folio: Folio, params: URLSearchParams) {
  const context = parseReturnContext(params);
  if (!context || context.route !== 'council' || context.appearanceId !== folio.companionId || context.focusTarget && context.focusTarget !== folio.companionId) return null;
  const circle = Number(context.contextId.split('circle-')[1]);
  if (!(folio.circles as number[]).includes(circle)) return null;
  return `/review/afc/council/${circle}?mode=${context.mode}&returned=1&companion=${folio.companionId}`;
}
