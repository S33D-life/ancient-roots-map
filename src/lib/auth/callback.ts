import { supabase } from '@/integrations/supabase/client';
import { returnContext } from './returnContext';
import { recordAuthEvidence, safeAuthError, startSessionEvidence } from './sessionEvidence';

export function safeDestination(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/atlas';
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return '/atlas';
    if (url.pathname === '/auth/handoff' && /^[a-zA-Z0-9-]{1,100}$/.test(url.searchParams.get('h') || '')) return `/auth/handoff?h=${encodeURIComponent(url.searchParams.get('h')!)}`;
    if ( url.pathname.startsWith('/auth') || url.pathname === '/reset-password' || url.pathname.startsWith('/~oauth')) return '/atlas';
    // Destinations never carry callback credentials.
    return url.pathname;
  } catch { return '/atlas'; }
}
export async function completeCallback(): Promise<string | null> {
  recordAuthEvidence('CALLBACK_ENTERED');
  await startSessionEvidence();
  // The canonical SDK constructor consumes implicit credentials. Its existing
  // initialize promise also owns PKCE when configured. Never exchange twice.
  const { error } = await supabase.auth.initialize();
  if (error) return safeAuthError(error);
  if (returnContext.error) return 'AuthImplicitGrantRedirectError';
  if (!returnContext.credentials) return 'AuthCallbackCredentialsMissing';
  // Current client uses implicit flow. A code-only callback is not silently
  // accepted against an unrelated existing session or blindly re-exchanged.
  if (returnContext.codeOnly) return 'AuthFlowMismatch';
  const result = await supabase.auth.getSession();
  if (result.error) return safeAuthError(result.error);
  if (!result.data.session?.user) {
    recordAuthEvidence('CALLBACK_SESSION_MISSING', { name: 'AuthSessionMissingError' });
    return 'AuthSessionMissingError';
  }
  recordAuthEvidence('CALLBACK_VALIDATION_REQUESTED');
  const verified = await supabase.auth.getUser();
  if (verified.error) {
    recordAuthEvidence('CALLBACK_VALIDATION_FAILED', verified.error);
    return safeAuthError(verified.error);
  }
  if (!verified.data.user || verified.data.user.id !== result.data.session.user.id) return 'AuthSessionMissingError';
  recordAuthEvidence('CALLBACK_SESSION_CONFIRMED');
  return null;
}
