/**
 * InviteExpiryHint — soft gold/amber hint that an invite has a fade time.
 * Purely informational: backend validation remains the source of truth for
 * whether a signup may proceed.
 */
import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";

interface Props {
  /** ISO timestamp when the invite expires; null/undefined means no expiry. */
  expiresAt: string | null | undefined;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "any moment now";
  const minutes = Math.floor(ms / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 2) return `in ${days} days`;
  if (days === 1) return `in 1 day`;
  if (hours >= 2) return `in ${hours} hours`;
  if (hours === 1) return `in 1 hour`;
  if (minutes >= 2) return `in ${minutes} minutes`;
  if (minutes === 1) return `in 1 minute`;
  return "in under a minute";
}

const InviteExpiryHint = ({ expiresAt }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;
  const ts = Date.parse(expiresAt);
  if (Number.isNaN(ts)) return null;

  const remaining = ts - now;
  const phrase = formatRemaining(remaining);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 px-2.5 py-1.5 text-[11px] font-serif text-amber-700 dark:text-amber-300"
    >
      <Hourglass className="w-3 h-3 shrink-0" aria-hidden />
      <span>This invitation fades {phrase}.</span>
    </div>
  );
};

export default InviteExpiryHint;
