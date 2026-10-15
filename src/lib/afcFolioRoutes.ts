/** Review routes are isolated from the shared backend/API route projection. */
export const AFC_REVIEW_ROUTES = {
  FOLIO: '/review/ancient-friends/:folioKey',
  COUNCIL: '/review/afc/council/:circleNumber',
} as const;
