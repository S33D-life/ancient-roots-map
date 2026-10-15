/** Curated review projections of existing identities, never a second tree store. */
import folios from '../../../public/review/afc-folios.json';
export type FolioKey = keyof typeof folios;
export type Folio = (typeof folios)[FolioKey];
export const AFC_FOLIOS = folios;
export function folioFor(key: string | undefined): Folio | null {
  return key && Object.prototype.hasOwnProperty.call(folios, key) ? folios[key as FolioKey] : null;
}
