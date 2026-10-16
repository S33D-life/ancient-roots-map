/** Tree-local navigation only. No arbitrary return URL or external redirect. */
export function treeMemoryState(params: URLSearchParams) {
  const tab = params.get('tab');
  return {
    section: tab === 'encounters' ? 'encounters' : ['memory', 'offerings', 'ethereal', 'living'].includes(tab ?? '') ? 'memory' : 'overview',
    mode: tab === 'living' || params.get('view') === 'living' ? 'living' : 'list',
    category: params.get('category') || 'photo',
  };
}
export function ancestralRootsParams(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  next.set('tab', 'memory'); next.set('view', 'archive'); next.set('category', 'ancestral-roots');
  next.delete('root'); next.delete('rootView');
  return next;
}
export function rootPortalParams(params: URLSearchParams, rootId: string | null, entered = false) {
  const next = new URLSearchParams(params);
  if (rootId) next.set('root', rootId); else next.delete('root');
  if (rootId && entered) next.set('rootView', 'grove'); else next.delete('rootView');
  return next;
}
