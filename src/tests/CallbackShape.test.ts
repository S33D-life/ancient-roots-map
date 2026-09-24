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
