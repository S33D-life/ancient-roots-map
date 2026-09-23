/** Read-only redacted evidence shared by OAuth and recovery callbacks. */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { readAuthEvidence, recordRouteSession } from '@/lib/auth/sessionEvidence';

export default function AuthDiagnosticsPage() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState(readAuthEvidence);
  useEffect(() => {
    void recordRouteSession();
    const timer = window.setInterval(() => setRows(readAuthEvidence()), 500);
    return () => window.clearInterval(timer);
  }, []);
  if (params.get('diag') !== '1') return null;
  return <main className="min-h-screen bg-background px-5 py-10">
    <h1 className="font-serif text-lg">Sign-in diagnostics</h1>
    <p className="text-sm">Local evidence only. SDK validation/exchange internals are not separately observed.</p>
    <pre className="mt-6 whitespace-pre-wrap break-all text-xs">{JSON.stringify(rows, null, 2)}</pre>
  </main>;
}
