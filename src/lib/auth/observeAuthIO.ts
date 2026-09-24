import type { SupportedStorage } from '@supabase/auth-js';
import { appendEvidence, beginCallbackEvidence } from './evidenceJournal';

let operation = 0;
function observe<T>(run: () => T | Promise<T>, succeeded: (result: T) => void, failed: (error: unknown) => void): T | Promise<T> {
  try {
    const result = run();
    if (result && typeof (result as Promise<T>).then === 'function') {
      return (result as Promise<T>).then(value => { succeeded(value); return value; }, error => { failed(error); throw error; });
    }
    succeeded(result as T);
    return result;
  } catch (error) { failed(error); throw error; }
}

export function observeAuthStorage(storage: SupportedStorage | undefined, projectUrl: string): SupportedStorage | undefined {
  beginCallbackEvidence();
  if (!storage) return storage;
  // Matches SupabaseClient 2.81.0's existing default; does not change the key.
  const sessionKey = `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
  return {
    isServer: storage.isServer,
    getItem(key) {
      if (key !== sessionKey) return storage.getItem(key);
      const id = ++operation;
      return observe(() => storage.getItem(key), value => {
        appendEvidence(value ? 'SESSION_STORAGE_READ_PRESENT' : 'SESSION_STORAGE_READ_ABSENT', undefined, undefined, id);
      }, error => appendEvidence('SESSION_STORAGE_READ_FAILED', error, undefined, id));
    },
    setItem(key, value) {
      if (key !== sessionKey) return storage.setItem(key, value);
      const id = ++operation;
      appendEvidence('SESSION_STORAGE_WRITE_ATTEMPTED', undefined, undefined, id);
      return observe(() => storage.setItem(key, value), () => {
        appendEvidence('SESSION_STORAGE_WRITE_SUCCEEDED', undefined, undefined, id);
      }, error => appendEvidence('SESSION_STORAGE_WRITE_FAILED', error, undefined, id));
    },
    removeItem(key) {
      if (key !== sessionKey) return storage.removeItem(key);
      const id = ++operation;
      return observe(() => storage.removeItem(key), () => {
        appendEvidence('SESSION_STORAGE_REMOVAL_OBSERVED', undefined, undefined, id);
      }, error => appendEvidence('SESSION_STORAGE_REMOVAL_FAILED', error, undefined, id));
    },
  };
}

export function observeAuthFetch(projectUrl: string, delegate: typeof fetch = (input, init) => fetch(input, init)): typeof fetch {
  const endpoint = new URL('auth/v1/user', projectUrl.endsWith('/') ? projectUrl : `${projectUrl}/`);
  return (input, init) => {
    let observed = false;
    try {
      const request = typeof Request !== 'undefined' && input instanceof Request ? input : null;
      const url = new URL(request ? request.url : String(input));
      const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
      observed = method === 'GET' && url.origin === endpoint.origin && url.pathname === endpoint.pathname;
    } catch { /* leave all fetch semantics to the existing implementation */ }
    if (!observed) return delegate(input, init);
    const id = ++operation;
    appendEvidence('AUTH_USER_VALIDATION_STARTED', undefined, undefined, id);
    return observe(() => delegate(input, init), response => {
      appendEvidence('AUTH_USER_VALIDATION_COMPLETED', undefined, response.status, id);
      if (!response.ok) appendEvidence('AUTH_USER_VALIDATION_FAILED', undefined, response.status, id);
    }, error => appendEvidence('AUTH_USER_VALIDATION_FAILED', error, undefined, id)) as Promise<Response>;
  };
}
