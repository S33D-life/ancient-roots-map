// The preview endpoint exists only on the opt-in loopback development server.
export const reviewRoot = '/__circle240_review/';
export const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
export const spatial = '/tetol/circle-235/pre-fire/tetol.html?circle=240&review240=1';
export const loadEdition = async () => {
  if (!loopback) throw new Error('Circle 240 is private');
  const response = await fetch(reviewRoot + 'catalogue.json', {cache: 'no-store'});
  if (!response.ok) throw new Error('Circle 240 catalogue unavailable');
  const edition = await response.json();
  if (edition.number !== 240 || edition.status !== 'PRIVATE_REVIEW' || (edition.question !== null && (typeof edition.question !== 'string' || !edition.question.trim())) ||
      edition.publicationApproved !== false ||
      edition.fire !== null || edition.companions.length !== 10) throw new Error('Invalid Circle 240 review catalogue');
  return edition;
};
