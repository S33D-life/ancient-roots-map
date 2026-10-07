import { expect, it } from 'vitest';
import { callbackShape, callbackShapeEvents } from '@/lib/auth/callbackShape';
it('distinguishes complete implicit credentials from empty or code-only parameters without retaining values', () => {
  const hash = '#access_token=SECRET&refresh_token=PRIVATE&expires_in=3600&token_type=bearer';
  const complete = callbackShape('', hash);
  expect(complete).toContain('CALLBACK_EFFECTIVE_ACCESS_NONEMPTY');
  expect(complete).toContain('CALLBACK_EFFECTIVE_REFRESH_NONEMPTY');
  expect(complete).toContain('CALLBACK_IMPLICIT_METADATA_PRESENT');
  const masked = callbackShape('?access_token=', hash);
  expect(masked).toContain('CALLBACK_QUERY_FRAGMENT_OVERLAP');
  expect(masked).not.toContain('CALLBACK_EFFECTIVE_ACCESS_NONEMPTY');
  expect(callbackShape('?code=SECRET', '')).toEqual(['CALLBACK_EFFECTIVE_CODE_NONEMPTY']);
  expect(callbackShape('?access_token=', '')).toEqual(['CALLBACK_QUERY_ACCESS_PRESENT']);
  expect(callbackShape('?email=PRIVATE&error_description=SECRET', '#unrelated=SECRET')).toEqual([]);
  for (const event of [...complete, ...masked]) expect(callbackShapeEvents.has(event)).toBe(true);
  expect(JSON.stringify([...complete, ...masked])).not.toMatch(/SECRET|PRIVATE/);
});

it.each([
  ['?access_token=SECRET&access_token=', '', false, 'CALLBACK_QUERY_DUPLICATES'],
  ['?access_token=&access_token=SECRET', '', true, 'CALLBACK_QUERY_DUPLICATES'],
  ['', '#access_token=SECRET&access_token=', false, 'CALLBACK_FRAGMENT_DUPLICATES'],
  ['', '#access_token=&access_token=SECRET', true, 'CALLBACK_FRAGMENT_DUPLICATES'],
  ['?access_token=', '#access_token=SECRET', false, 'CALLBACK_QUERY_FRAGMENT_OVERLAP'],
  ['?access_token=SECRET', '#access_token=', true, 'CALLBACK_QUERY_FRAGMENT_OVERLAP'],
])('matches SDK last-occurrence precedence (%s, %s)', (query, fragment, nonempty, event) => {
  const rows = callbackShape(query, fragment);
  expect(rows.includes('CALLBACK_EFFECTIVE_ACCESS_NONEMPTY')).toBe(nonempty);
  expect(rows).toContain(event);
  expect(JSON.stringify(rows)).not.toContain('SECRET');
});
it('uses the same duplicate precedence for refresh, metadata and code', () => {
  const rows = callbackShape('?refresh_token=SECRET&refresh_token=&code=SECRET&code=', '#expires_in=3600&expires_in=&token_type=bearer');
  expect(rows).not.toContain('CALLBACK_EFFECTIVE_REFRESH_NONEMPTY');
  expect(rows).not.toContain('CALLBACK_IMPLICIT_METADATA_PRESENT');
  expect(rows).not.toContain('CALLBACK_EFFECTIVE_CODE_NONEMPTY');
});
