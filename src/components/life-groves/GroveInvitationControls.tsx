import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

/** Rendered only for stewards; the RPC independently checks authority. */
export default function GroveInvitationControls({ groveId }: { groveId: string }) {
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function manage(rotate: boolean) {
    setBusy(true); setLink(''); setMessage('');
    try {
      const { data, error } = await (supabase as any).rpc('manage_grove_invitation', { p_grove_id: groveId, p_rotate: rotate });
      if (error) throw error;
      if (rotate && data) setLink(`${window.location.origin}/life-grove-invite/${data}`);
      setMessage(rotate ? 'New invitation expires in seven days. Previous links no longer work. Existing members keep access.' : 'Invitation revoked. Existing members keep access.');
    } catch { setMessage('Invitation could not be changed. No success is assumed.'); }
    finally { setBusy(false); }
  }
  return <section aria-label="Grove invitations"><h3>Private invitations</h3><p>Share only with intended members. Removed members require a deliberate reinvitation.</p><Button disabled={busy} onClick={() => manage(true)}>Create or rotate invitation</Button><Button disabled={busy} onClick={() => manage(false)}>Revoke invitation</Button><p role="status">{message}</p>{link && <label>Private invitation link<input readOnly value={link} className="w-full" /></label>}</section>;
}
