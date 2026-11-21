import { useState } from 'react';
import { Link,useParams,useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/use-current-user';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export default function FoundingGroveActivationPage() {
  const { token='' }=useParams(); const [params]=useSearchParams(); const signupCode=params.get('invite'); const { userId }=useCurrentUser();
  const [result,setResult]=useState<{life_grove_id:string;activated_at:string;ends_at:string}|null>(null);
  const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  async function activate(){
    setBusy(true); setMessage('');
    try {
      const {data,error}=await (supabase as any).rpc('activate_founding_grove',{p_token:token});
      if(error || !data) throw error || new Error('No entitlement returned');
      setResult(data);
    } catch { setMessage('Activation is unavailable. Check the invited account and opening date, or ask the steward. No activation is assumed.'); }
    finally { setBusy(false); }
  }
  return <main className="max-w-xl mx-auto px-4 py-24 space-y-4"><h1>Your Founding Grove invitation</h1><p>£33 includes one year of S33D access with a private Life Grove and Founding Grove recognition. An account is required. Your year begins when activation succeeds, not when you first open this page.</p>
    {!userId ? <Link to={`/auth?returnTo=${encodeURIComponent(`/founding-grove/activate/${token}`)}${signupCode ? `&invite=${encodeURIComponent(signupCode)}` : ""}`}>Sign in or create an account</Link> : result ? <section><h2>Your Grove is ready</h2><p>Activated {new Date(result.activated_at).toLocaleDateString()}. Year ends {new Date(result.ends_at).toLocaleDateString()}. Opening this invitation again keeps these dates.</p><Link to={`/heartwood/life-groves/${result.life_grove_id}`}>Open your private Grove</Link></section> : <Button disabled={busy} onClick={activate}>Activate my year and private Grove</Button>}
    <p role="status">{message}</p><p>First invitations are planned from 21 December 2026. Renewal price, access after the year, and duration of Founding recognition after year one remain undecided. The Ancient Friends map remains free.</p></main>;
}
