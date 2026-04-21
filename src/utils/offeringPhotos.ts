/**
 * Offering photo helpers — bridges legacy single `media_url`
 * with the new `photos: string[]` (max 3) field.
 */
export const MAX_OFFERING_PHOTOS = 3;

/** Returns the canonical list of photo URLs for an offering. */
export function getOfferingPhotos(offering: any): string[] {
  if (!offering) return [];
  const arr = Array.isArray(offering.photos) ? offering.photos.filter(Boolean) : [];
  if (arr.length > 0) return arr.slice(0, MAX_OFFERING_PHOTOS);
  if (offering.media_url) return [offering.media_url];
  return [];
}

/** Returns the cover photo (first item) for thumbnails / cards. */
export function getOfferingCover(offering: any): string | null {
  return getOfferingPhotos(offering)[0] || null;
}
