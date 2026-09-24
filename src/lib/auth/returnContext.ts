import { callbackShape } from './callbackShape';
// Capture callback shape before the SDK consumes it. Never retain values.
export const returnContext = (() => {
const params = new URLSearchParams(window.location.search);
const fragment = new URLSearchParams(window.location.hash.slice(1));
const has = (key: string) => params.has(key) || fragment.has(key);
return Object.freeze({
  shape: callbackShape(window.location.search, window.location.hash),
  credentials: has('access_token') || has('code'),
  codeOnly: has('code') && !has('access_token'),
  recovery: params.get('type') === 'recovery' || fragment.get('type') === 'recovery'
    || (window.location.pathname === '/reset-password' && has('code')),
  error: has('error') || has('error_description'),
});
})();
