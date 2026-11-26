export const root = '/council/circle-240/';
export const spatial = '/tetol/circle-235/pre-fire/tetol.html?circle=240';

export async function loadEdition() {
  const response = await fetch(root + 'catalogue.json', {cache: 'no-store'});
  if (!response.ok) throw new Error('Circle 240 unavailable');
  const edition = await response.json();
  if (edition.number !== 240 || edition.status !== 'OPEN' || !edition.question?.trim() || edition.fire !== null ||
      edition.companions?.length !== 10 || edition.companions.some(item =>
        !/^[a-z0-9-]+$/.test(item.key) || item.id !== 'c240-' + item.key ||
        item.artwork !== root + 'portraits/' + item.key + '.webp' ||
        item.reverse?.artwork !== root + 'reverses/' + item.key + '.webp' || !item.reverse.readableText?.trim())) {
    throw new Error('Invalid Circle 240 catalogue');
  }
  return edition;
}
