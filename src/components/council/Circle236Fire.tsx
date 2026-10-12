import { CURRENT_CIRCLE, approvedCircleUrl } from "../../../supabase/functions/_shared/currentCircle";

/** Fire timing confirmed by Ed / TEOTAG, 12 October. Not a completed Circle record. */
export default function Circle236Fire({ className = "birch-action" }: { className?: string }) {
  const group = approvedCircleUrl(CURRENT_CIRCLE.links.group);
  return <section aria-label="Circle 236 Council Fire">
    <h2>Council Fire</h2>
    <p><time dateTime="2026-10-13T19:30:00+01:00">Tuesday 13 October · 19:30 UK</time></p>
    <p>We gather in our recurring Google Meet room. The joining details are shared in the Council group.</p>
    {group ? <a className={className} href={group} rel="noopener noreferrer">Gather at the Fire · Council group →</a> : <p>Joining details are not available here yet.</p>}
  </section>;
}
