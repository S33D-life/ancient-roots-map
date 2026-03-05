import { distributionCellKey, scoreCandidate } from "./utils.mjs";

export const selectTopN = (
  candidates,
  { limit, bbox, grid = 6, maxPerCell = 3, preferredTag = null, preferredMin = 0 },
) => {
  const ranked = [...candidates]
    .map((item) => ({ ...item, _score: scoreCandidate(item) }))
    .sort((a, b) => b._score - a._score);

  const selected = [];
  const perCell = new Map();
  const selectWithDistribution = (item) => {
    const cell = distributionCellKey(item.lat, item.lng, bbox, grid);
    const count = perCell.get(cell) || 0;
    if (cell !== "unknown" && count >= maxPerCell) return false;
    selected.push(item);
    perCell.set(cell, count + 1);
    return true;
  };

  if (preferredTag) {
    const preferred = ranked.filter((item) => item.tags?.includes(preferredTag));
    for (const item of preferred) {
      if (selected.length >= limit) break;
      if (selected.length >= preferredMin) break;
      selectWithDistribution(item);
    }
  }

  for (const item of ranked) {
    if (selected.length >= limit) break;
    if (selected.includes(item)) continue;
    selectWithDistribution(item);
  }

  if (selected.length < limit) {
    for (const item of ranked) {
      if (selected.length >= limit) break;
      if (selected.includes(item)) continue;
      selected.push(item);
    }
  }

  return selected.map(({ _score, ...rest }) => rest);
};
