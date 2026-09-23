import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { completeCallback, safeDestination } from '@/lib/auth/callback';
import { recordAuthEvidence, safeAuthError } from '@/lib/auth/sessionEvidence';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destination = safeDestination(params.get('returnTo'));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) { active = false; setError('AuthInitializationTimeout'); }
    }, 15000);
    void completeCallback().then(problem => {
      if (!active) return;
      if (problem) { setError(problem); return; }
      recordAuthEvidence('DESTINATION_NAVIGATION');
      navigate(destination, { replace: true });
    }).catch(problem => {
      if (active) setError(safeAuthError(problem));
    }).finally(() => window.clearTimeout(timer));
    return () => { active = false; window.clearTimeout(timer); };
  }, [destination, navigate]);
  return <main className="min-h-screen grid place-content-center gap-4 p-6">
    <h1 className="text-xl font-serif">Completing sign-in</h1>
    {error ? <><p role="alert">Sign-in could not be confirmed. ({error})</p><Link to="/auth">Try sign-in again</Link><Link to="/auth/diagnostics?diag=1">View safe diagnostics</Link></>
      : <p role="status">Checking your session…</p>}
  </main>;
}
