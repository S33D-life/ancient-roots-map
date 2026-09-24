/** Parameter shape only: never retain token values, URLs, or provider errors. */
export function callbackShape(search: string, hash: string): string[] {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ''));
  // Match the installed SDK: query values override fragment values, even empty ones.
  const parsed: Record<string, string> = Object.create(null);
  fragment.forEach((value, key) => { parsed[key] = value; });
  query.forEach((value, key) => { parsed[key] = value; });
  const effective = (key: string) => parsed[key];
  const keys = ['access_token', 'refresh_token', 'expires_in', 'token_type', 'code'];
  const events: string[] = [];
  if (keys.some(key => query.getAll(key).length > 1)) events.push('CALLBACK_QUERY_DUPLICATES');
  if (keys.some(key => fragment.getAll(key).length > 1)) events.push('CALLBACK_FRAGMENT_DUPLICATES');
  if (query.has('access_token')) events.push('CALLBACK_QUERY_ACCESS_PRESENT');
  if (fragment.has('access_token')) events.push('CALLBACK_FRAGMENT_ACCESS_PRESENT');
  if (effective('access_token')) events.push('CALLBACK_EFFECTIVE_ACCESS_NONEMPTY');
  if (effective('refresh_token')) events.push('CALLBACK_EFFECTIVE_REFRESH_NONEMPTY');
  if (effective('expires_in') && effective('token_type')) events.push('CALLBACK_IMPLICIT_METADATA_PRESENT');
  if (effective('code')) events.push('CALLBACK_EFFECTIVE_CODE_NONEMPTY');
  if (['access_token', 'refresh_token', 'expires_in', 'token_type', 'code'].some(key => query.has(key) && fragment.has(key))) events.push('CALLBACK_QUERY_FRAGMENT_OVERLAP');
  return events;
}
export const callbackShapeEvents = new Set([
  'CALLBACK_QUERY_DUPLICATES', 'CALLBACK_FRAGMENT_DUPLICATES',
  'CALLBACK_QUERY_ACCESS_PRESENT', 'CALLBACK_FRAGMENT_ACCESS_PRESENT',
  'CALLBACK_EFFECTIVE_ACCESS_NONEMPTY', 'CALLBACK_EFFECTIVE_REFRESH_NONEMPTY',
  'CALLBACK_IMPLICIT_METADATA_PRESENT', 'CALLBACK_EFFECTIVE_CODE_NONEMPTY',
  'CALLBACK_QUERY_FRAGMENT_OVERLAP',
]);
