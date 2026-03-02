/**
 * Council Spark — golden beetle/firefly sigil icon.
 * Used in the FAB cluster, Council page, and Spark dialog.
 */
const CouncilSparkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {/* Beetle body */}
    <ellipse cx="12" cy="13" rx="4.5" ry="5.5" fill="currentColor" opacity={0.15} />
    <ellipse cx="12" cy="13" rx="4.5" ry="5.5" stroke="currentColor" strokeWidth={1.4} />
    {/* Wing line */}
    <line x1="12" y1="8" x2="12" y2="18" stroke="currentColor" strokeWidth={1} opacity={0.5} />
    {/* Head */}
    <circle cx="12" cy="7" r="2" fill="currentColor" opacity={0.3} stroke="currentColor" strokeWidth={1.2} />
    {/* Antennae */}
    <path d="M10.5 5.5 L8.5 3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    <path d="M13.5 5.5 L15.5 3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    {/* Spark rays */}
    <line x1="12" y1="1" x2="12" y2="2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
    <line x1="7" y1="3" x2="7.8" y2="3.8" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
    <line x1="17" y1="3" x2="16.2" y2="3.8" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
    {/* Legs */}
    <path d="M8 11 L5.5 10" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    <path d="M16 11 L18.5 10" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    <path d="M7.8 14 L5.5 14.5" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
    <path d="M16.2 14 L18.5 14.5" stroke="currentColor" strokeWidth={1} strokeLinecap="round" opacity={0.4} />
  </svg>
);

export default CouncilSparkIcon;
